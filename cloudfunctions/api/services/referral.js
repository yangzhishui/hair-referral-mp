const h = require('./helper')
const { sendSms } = require('./sms')

const EXPIRE_HOURS = 72

/** 发起转诊 */
exports.create = async (ctx, payload = {}) => {
  const me = await h.requireDoctor(ctx)
  const patient = await h.findOne(ctx, 'patients', { _id: payload.patientId })
  if (!patient) throw new Error('患者不存在')
  if (!payload.purpose || !payload.purpose.length) throw new Error('转诊目的为必填项')

  const records = await h.list(ctx, 'records', { patientId: patient._id })
  const now = Date.now()

  const referral = await h.insert(ctx, 'referrals', {
    patientId: patient._id,
    patientName: patient.name,
    patientSnapshot: patient,
    recordSnapshot: records,
    purpose: payload.purpose,
    remark: payload.remark || '',
    targetType: payload.targetType || 'public',
    targetHospitalIds: payload.targetHospitalIds || [],
    targetDoctorIds: payload.targetDoctorIds || [],
    regions: payload.regions || [],
    initiatorId: me._id,
    initiatorName: me.name,
    initiatorHospital: me.hospitalName,
    status: 'pending',
    acceptedBy: '',
    acceptedByName: '',
    createdAt: h.nowIso(),
    expireAt: new Date(now + EXPIRE_HOURS * 3600000).toISOString(),
    logs: [
      {
        action: `创建转诊单（${payload.targetType === 'friend' ? '好友定向' : '公开抢单'}）`,
        operator: me.name,
        at: h.nowIso()
      }
    ],
    treatment: null
  })

  // 定向好友 / 定向医院：仅好友可见 + 短信提醒
  const targets = payload.targetDoctorIds || []
  for (const id of targets) {
    const d = await h.findOne(ctx, 'doctors', { _id: id })
    if (!d) continue
    await h.pushMessage(ctx, d.userId, {
      type: 'referral',
      title: '定向转诊待接单',
      content: `${me.name}（${me.hospitalName}）向您定向转诊患者 ${patient.name}，请尽快接单`,
      refId: referral._id
    })
    if (d.phone) {
      await sendSms(ctx, d.phone, `【毛发医联体】${me.name}医生向您定向转诊患者${patient.name}，请登录小程序接单。`)
    }
  }

  await ctx.db.collection('patients').doc(patient._id).update({ data: { lastReferralAt: h.nowIso() } })

  if (patient.patientUserId) {
    await h.pushMessage(ctx, patient.patientUserId, {
      type: 'referral',
      title: '转诊发起成功',
      content: `${me.name}医生已为您发起转诊，等待接诊医生响应`,
      refId: referral._id
    })
  }

  return referral
}

/** 转诊单列表：mine 我发起 / pool 待抢单 / accepted 我接诊 / history 历史 */
exports.list = async (ctx, payload = {}) => {
  const user = await h.currentUser(ctx)

  if (user.role === 'patient') {
    const p = await h.currentPatient(ctx)
    if (!p) return []
    return h.list(ctx, 'referrals', { patientId: p._id })
  }

  const me = await h.requireDoctor(ctx)
  const tab = payload.tab || 'mine'

  if (tab === 'mine') {
    return h.list(ctx, 'referrals', { initiatorId: me._id })
  }

  if (tab === 'accepted') {
    const rows = await h.list(ctx, 'referrals', { acceptedBy: me._id })
    return rows.filter((r) => r.status === 'accepted' || r.status === 'in_progress')
  }

  if (tab === 'history') {
    const rows = await h.list(ctx, 'referrals', {})
    return rows.filter(
      (r) =>
        (r.status === 'closed' || r.status === 'cancelled') &&
        (r.initiatorId === me._id || r.acceptedBy === me._id)
    )
  }

  // 待抢单池：pending 且（定向到本人 / 定向到本院 / 公开未指定）
  const rows = await h.list(ctx, 'referrals', { status: 'pending' })
  return rows.filter((r) => {
    if (r.initiatorId === me._id) return false
    const inDoctors = (r.targetDoctorIds || []).indexOf(me._id) > -1
    const inHospitals = (r.targetHospitalIds || []).indexOf(me.hospitalId) > -1
    const openAll =
      r.targetType === 'public' &&
      !(r.targetDoctorIds || []).length &&
      !(r.targetHospitalIds || []).length
    return r.targetType === 'friend' ? inDoctors : inDoctors || inHospitals || openAll
  })
}

exports.get = async (ctx, payload = {}) => {
  const referral = await h.findOne(ctx, 'referrals', { _id: payload.referralId })
  if (!referral) throw new Error('转诊单不存在')
  const patient = await h.findOne(ctx, 'patients', { _id: referral.patientId })
  const records = await h.list(ctx, 'records', { patientId: referral.patientId })
  const user = await h.currentUser(ctx)
  const me = user.doctorId ? await h.findOne(ctx, 'doctors', { _id: user.doctorId }) : null

  let action = 'none'
  if (me && referral.status === 'pending' && referral.initiatorId !== me._id) action = 'accept'
  if (me && referral.acceptedBy === me._id && (referral.status === 'accepted' || referral.status === 'in_progress')) {
    action = 'close'
  }
  if (me && referral.initiatorId === me._id && referral.status === 'pending') action = 'cancel'

  return {
    referral,
    patient: patient || referral.patientSnapshot,
    records,
    action,
    canCopy: !!me && (referral.status === 'cancelled' || referral.status === 'closed')
  }
}

/** 抢单 / 接单（一单仅一人，接单即锁定） */
exports.accept = async (ctx, payload = {}) => {
  const me = await h.requireDoctor(ctx)
  const referral = await h.findOne(ctx, 'referrals', { _id: payload.referralId })
  if (!referral) throw new Error('转诊单不存在')
  if (referral.status !== 'pending') throw new Error('该转诊单已被接单或已关闭')

  const updated = await h.update(ctx, 'referrals', referral._id, {
    status: 'accepted',
    acceptedBy: me._id,
    acceptedByName: me.name,
    acceptedAt: h.nowIso(),
    logs: h.buildLogs(referral, `${me.name} 立即接单`, me.name)
  })

  const initiator = await h.findOne(ctx, 'doctors', { _id: referral.initiatorId })
  if (initiator) {
    await h.pushMessage(ctx, initiator.userId, {
      type: 'referral',
      title: '转诊已被接单',
      content: `${me.name}（${me.hospitalName}）已接诊患者 ${referral.patientName}`,
      refId: referral._id
    })
  }
  const patient = await h.findOne(ctx, 'patients', { _id: referral.patientId })
  if (patient && patient.patientUserId) {
    await h.pushMessage(ctx, patient.patientUserId, {
      type: 'referral',
      title: '已被接诊',
      content: `您的转诊已被 ${me.hospitalName} ${me.name} 医生接诊`,
      refId: referral._id
    })
  }
  return updated
}

/** 转诊结案：上传诊疗照片 / 医嘱 / 小结 */
exports.close = async (ctx, payload = {}) => {
  const me = await h.requireDoctor(ctx)
  const referral = await h.findOne(ctx, 'referrals', { _id: payload.referralId })
  if (!referral) throw new Error('转诊单不存在')
  if (referral.acceptedBy !== me._id) throw new Error('仅接诊医生可结案')

  const treatment = Object.assign({}, payload.treatment || {}, {
    closedBy: me.name,
    closedAt: h.nowIso()
  })

  const updated = await h.update(ctx, 'referrals', referral._id, {
    status: 'closed',
    closedAt: h.nowIso(),
    treatment,
    logs: h.buildLogs(referral, `${me.name} 转诊结案`, me.name)
  })

  const initiator = await h.findOne(ctx, 'doctors', { _id: referral.initiatorId })
  if (initiator) {
    await h.pushMessage(ctx, initiator.userId, {
      type: 'referral',
      title: '转诊已结案',
      content: `${me.name} 已完成患者 ${referral.patientName} 的转诊结案`,
      refId: referral._id
    })
  }
  const patient = await h.findOne(ctx, 'patients', { _id: referral.patientId })
  if (patient && patient.patientUserId) {
    await h.pushMessage(ctx, patient.patientUserId, {
      type: 'referral',
      title: '转诊已结案',
      content: '医生已完成本次转诊，可查看诊疗小结与医嘱',
      refId: referral._id
    })
  }

  // 结案积分
  await ctx.db.collection('doctors').doc(me._id).update({
    data: { points: ctx._.inc(20) }
  })

  return updated
}

/** 发起医生主动取消 */
exports.cancel = async (ctx, payload = {}) => {
  const me = await h.requireDoctor(ctx)
  const referral = await h.findOne(ctx, 'referrals', { _id: payload.referralId })
  if (!referral) throw new Error('转诊单不存在')
  if (referral.initiatorId !== me._id) throw new Error('仅发起医生可取消')

  return h.update(ctx, 'referrals', referral._id, {
    status: 'cancelled',
    cancelReason: '发起医生主动取消',
    logs: h.buildLogs(referral, `${me.name} 主动取消转诊`, me.name)
  })
}
