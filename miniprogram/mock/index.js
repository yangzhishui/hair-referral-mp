const db = require('./db')
const buildSeed = require('./seed')
const { genId } = require('../utils/util')

const USER_KEY = 'HAIR_MP_USER'
const DEMO_DOCTOR_ID = 'doc_1'
const DEMO_PATIENT_USER_ID = 'user_pat_1'

function ok(data) {
  return { code: 0, data }
}

function fail(msg) {
  return { code: -1, msg }
}

/* ---------------- 基础能力 ---------------- */

function ensureSeed() {
  const data = db.load()
  if (!data._meta) {
    const seed = buildSeed()
    Object.keys(seed).forEach((k) => db.setCollection(k, seed[k]))
  }
}

function currentUser() {
  return wx.getStorageSync(USER_KEY) || null
}

function requireUser() {
  const u = currentUser()
  if (!u) throw new Error('未登录')
  return u
}

function myDoctor() {
  const u = requireUser()
  if (u.role !== 'doctor') return null
  return db.findById('doctors', u.doctorId)
}

function myPatient() {
  const u = requireUser()
  if (u.role !== 'patient') return null
  return db.query('patients', { where: { patientUserId: u.userId } })[0] || null
}

function pushMsg(userId, msg) {
  db.insert('messages', {
    userId,
    type: msg.type || 'system',
    title: msg.title,
    content: msg.content,
    refId: msg.refId || '',
    read: false,
    createdAt: new Date().toISOString()
  })
}

function addLog(referral, action, operator) {
  const logs = (referral.logs || []).slice()
  logs.push({ action, operator, at: new Date().toISOString() })
  return logs
}

function hospitalOf(doctorId) {
  const d = db.findById('doctors', doctorId)
  return d ? db.findById('hospitals', d.hospitalId) : null
}

function friendStatusOf(myId, otherId) {
  const f = db
    .query('friends', { where: { doctorId: myId, friendId: otherId } })[0]
  if (!f) return 'none'
  return f.status
}

/* 模拟定时触发器：扫描超时未接单 */
function sweepExpired() {
  const nowTs = Date.now()
  db.col('referrals').forEach((r) => {
    if (r.status === 'pending' && r.expireAt && new Date(r.expireAt).getTime() < nowTs) {
      db.updateById('referrals', r._id, {
        status: 'cancelled',
        cancelReason: '72 小时无人接单，系统自动取消',
        logs: addLog(r, '72 小时无人接单，系统自动取消', '系统')
      })
      pushMsg('user_' + r.initiatorId, {
        type: 'referral',
        title: '转诊已自动取消',
        content: `您发起的转诊（${r.patientName}）超过 72 小时无人接单，已自动取消，可复制资料重新发起`,
        refId: r._id
      })
      const p = db.findById('patients', r.patientId)
      if (p) {
        pushMsg(p.patientUserId, {
          type: 'referral',
          title: '转诊已取消',
          content: '本次转诊超过 72 小时无人接单，已自动取消，请联系您的主诊医生',
          refId: r._id
        })
      }
    }
  })
}

/* ---------------- 具体业务 ---------------- */

const handlers = {
  /* ---- 认证 ---- */
  'auth.login': (payload = {}) => {
    ensureSeed()
    const role = payload.role || 'doctor'
    let user
    if (role === 'patient') {
      const patient = db.query('patients', { where: { patientUserId: DEMO_PATIENT_USER_ID } })[0]
      if (!patient) return fail('演示患者数据缺失')
      user = { userId: DEMO_PATIENT_USER_ID, role: 'patient', patientId: patient._id }
    } else {
      user = { userId: 'user_doc_1', role: 'doctor', doctorId: DEMO_DOCTOR_ID }
    }
    wx.setStorageSync(USER_KEY, user)
    return ok(handlers['auth.profile']().data)
  },

  'auth.profile': () => {
    ensureSeed()
    const u = currentUser()
    if (!u) return fail('未登录')
    if (u.role === 'doctor') {
      const doctor = db.findById('doctors', u.doctorId)
      if (!doctor) return fail('医生资料不存在')
      const hospital = db.findById('hospitals', doctor.hospitalId)
      return ok({ role: 'doctor', userId: u.userId, doctor, hospital })
    }
    const patient = db.query('patients', { where: { patientUserId: u.userId } })[0]
    if (!patient) return fail('患者资料不存在')
    return ok({ role: 'patient', userId: u.userId, patient })
  },

  'auth.bindPhone': (payload = {}) => {
    const u = requireUser()
    if (u.role === 'doctor') {
      db.updateById('doctors', u.doctorId, { phone: payload.phone })
    } else {
      const p = myPatient()
      if (p) db.updateById('patients', p._id, { phone: payload.phone })
    }
    return handlers['auth.profile']()
  },

  'auth.updateProfile': (payload = {}) => {
    const u = requireUser()
    if (u.role === 'doctor') {
      db.updateById('doctors', u.doctorId, payload)
    } else {
      const p = myPatient()
      if (p) db.updateById('patients', p._id, payload)
    }
    return handlers['auth.profile']()
  },

  'auth.submitVerify': (payload = {}) => {
    const u = requireUser()
    db.updateById('doctors', u.doctorId, Object.assign({}, payload, { auditStatus: 'pending' }))
    return handlers['auth.profile']()
  },

  /* ---- 医生 / 医院 ---- */
  'doctor.search': (payload = {}) => {
    ensureSeed()
    const me = myDoctor()
    const list = db
      .query('doctors', {
        where: payload.doctorId ? { _id: payload.doctorId } : {},
        keyword: payload.keyword,
        keywordFields: ['name', 'hospitalName', 'department']
      })
      .filter((d) => !me || d._id !== me._id)
      .map((d) =>
        Object.assign({}, d, {
          friendStatus: me ? friendStatusOf(me._id, d._id) : 'none'
        })
      )
    return ok(list)
  },

  'doctor.profile': (payload = {}) => {
    const d = db.findById('doctors', payload.doctorId)
    if (!d) return fail('医生不存在')
    const hospital = db.findById('hospitals', d.hospitalId)
    return ok(Object.assign({}, d, { hospital }))
  },

  'hospital.list': () => {
    ensureSeed()
    return ok(db.col('hospitals'))
  },

  'hospital.get': (payload = {}) => {
    const me = myDoctor()
    const id = payload.hospitalId || (me && me.hospitalId)
    const h = db.findById('hospitals', id)
    if (!h) return fail('医院不存在')
    const doctors = db.query('doctors', { where: { hospitalId: id } })
    return ok(Object.assign({}, h, { doctors, canEdit: !!me && me.isAdmin }))
  },

  'hospital.update': (payload = {}) => {
    const me = myDoctor()
    if (!me) return fail('无权限')
    const hospitalId = payload.hospitalId || me.hospitalId
    if (!me.isAdmin && me.hospitalId !== hospitalId) return fail('仅医院管理员可修改')
    const patch = Object.assign({}, payload)
    delete patch.hospitalId
    db.updateById('hospitals', hospitalId, patch)
    return handlers['hospital.get']({ hospitalId })
  },

  /* ---- 患者档案 ---- */
  'patient.list': (payload = {}) => {
    ensureSeed()
    const u = requireUser()
    if (u.role === 'patient') {
      return ok(db.query('patients', { where: { patientUserId: u.userId } }))
    }
    const me = myDoctor()
    return ok(
      db.query('patients', {
        where: { creatorDoctorId: me._id },
        keyword: payload.keyword,
        keywordFields: ['name', 'phone'],
        orderBy: 'createdAt'
      })
    )
  },

  'patient.get': (payload = {}) => {
    const p = db.findById('patients', payload.patientId)
    if (!p) return fail('患者不存在')
    const records = db.query('records', { where: { patientId: p._id }, orderBy: 'createdAt' })
    const referrals = db.query('referrals', { where: { patientId: p._id }, orderBy: 'createdAt' })
    const u = currentUser() || {}
    return ok({
      patient: p,
      records,
      referrals,
      editable: u.role === 'doctor' && p.creatorDoctorId === u.doctorId
    })
  },

  'patient.create': (payload = {}) => {
    const me = myDoctor()
    const nowIso = new Date().toISOString()
    const p = db.insert('patients', Object.assign({}, payload, {
      creatorDoctorId: me._id,
      creatorName: me.name,
      patientUserId: payload.patientUserId || `user_pat_${genId('')}`,
      images: [],
      createdAt: nowIso
    }))
    return ok(p)
  },

  'patient.update': (payload = {}) => {
    db.updateById('patients', payload.patientId, payload.patch || {})
    return handlers['patient.get']({ patientId: payload.patientId })
  },

  'patient.saveImages': (payload = {}) => {
    db.updateById('patients', payload.patientId, { images: payload.images || [] })
    return ok({ success: true })
  },

  /* ---- 格式化病历 ---- */
  'record.list': (payload = {}) => {
    return ok(db.query('records', { where: { patientId: payload.patientId }, orderBy: 'createdAt' }))
  },

  'record.save': (payload = {}) => {
    const me = myDoctor()
    const existing = db.query('records', { where: { patientId: payload.patientId } })
    const draft = existing.find((r) => !r.locked)
    const fields = payload.fields || {}
    if (draft) {
      db.updateById('records', draft._id, Object.assign({}, fields, { updatedAt: new Date().toISOString() }))
      return ok(db.findById('records', draft._id))
    }
    const rec = db.insert('records', Object.assign({}, fields, {
      patientId: payload.patientId,
      doctorId: me._id,
      doctorName: me.name,
      locked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))
    return ok(rec)
  },

  'record.confirm': (payload = {}) => {
    const rec = db.findById('records', payload.recordId)
    if (!rec) return fail('病历不存在')
    if (rec.locked) return fail('病历已锁定，不可修改')
    db.updateById('records', payload.recordId, {
      locked: true,
      confirmedAt: new Date().toISOString()
    })
    return ok(db.findById('records', payload.recordId))
  },

  /* ---- 转诊 ---- */
  'referral.create': (payload = {}) => {
    const me = myDoctor()
    const patient = db.findById('patients', payload.patientId)
    if (!patient) return fail('患者不存在')
    const nowIso = new Date().toISOString()
    const r = db.insert('referrals', {
      patientId: patient._id,
      patientName: patient.name,
      patientSnapshot: patient,
      purpose: payload.purpose || [],
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
      createdAt: nowIso,
      expireAt: new Date(Date.now() + 72 * 3600000).toISOString(),
      logs: [{ action: `创建转诊单（${payload.targetType === 'friend' ? '好友定向' : '公开抢单'}）`, operator: me.name, at: nowIso }],
      treatment: null
    })
    // 定向好友：仅好友可见 + 短信提醒
    ;(payload.targetDoctorIds || []).forEach((id) => {
      const d = db.findById('doctors', id)
      if (!d) return
      pushMsg(d.userId, {
        type: 'referral',
        title: '定向转诊待接单',
        content: `${me.name}（${me.hospitalName}）向您定向转诊患者 ${patient.name}，请尽快接单`,
        refId: r._id
      })
      db.insert('sms_tasks', {
        doctorId: id,
        phone: d.phone,
        stage: 'direct-referral',
        status: 'pending',
        content: `【毛发医联体】${me.name}医生向您定向转诊患者${patient.name}，请登录小程序接单。`
      })
    })
    db.updateById('patients', patient._id, { lastReferralAt: nowIso })
    if (patient.patientUserId) {
      pushMsg(patient.patientUserId, {
        type: 'referral',
        title: '转诊发起成功',
        content: `${me.name}医生已为您发起转诊，等待接诊医生响应`,
        refId: r._id
      })
    }
    return ok(r)
  },

  'referral.list': (payload = {}) => {
    ensureSeed()
    sweepExpired()
    const u = requireUser()
    const tab = payload.tab || 'mine'
    if (u.role === 'patient') {
      const p = myPatient()
      const list = p
        ? db.query('referrals', { where: { patientId: p._id }, orderBy: 'createdAt' })
        : []
      return ok(list)
    }
    const me = myDoctor()
    let list = []
    if (tab === 'mine') {
      list = db.query('referrals', { where: { initiatorId: me._id }, orderBy: 'createdAt' })
    } else if (tab === 'pool') {
      list = db.col('referrals').filter((r) => {
        if (r.status !== 'pending' || r.initiatorId === me._id) return false
        const inDoctors = (r.targetDoctorIds || []).indexOf(me._id) > -1
        const inHospitals = (r.targetHospitalIds || []).indexOf(me.hospitalId) > -1
        const openAll = r.targetType === 'public' && !(r.targetDoctorIds || []).length && !(r.targetHospitalIds || []).length
        return r.targetType === 'friend' ? inDoctors : inDoctors || inHospitals || openAll
      })
    } else if (tab === 'accepted') {
      list = db.query('referrals', {
        where: { acceptedBy: me._id, status: { $in: ['accepted', 'in_progress'] } },
        orderBy: 'createdAt'
      })
    } else {
      list = db.col('referrals').filter(
        (r) =>
          (r.status === 'closed' || r.status === 'cancelled') &&
          (r.initiatorId === me._id || r.acceptedBy === me._id)
      )
    }
    return ok(list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)))
  },

  'referral.get': (payload = {}) => {
    sweepExpired()
    const r = db.findById('referrals', payload.referralId)
    if (!r) return fail('转诊单不存在')
    const patient = db.findById('patients', r.patientId) || r.patientSnapshot
    const records = db.query('records', { where: { patientId: r.patientId }, orderBy: 'createdAt' })
    const u = currentUser() || {}
    const me = u.role === 'doctor' ? db.findById('doctors', u.doctorId) : null
    let action = 'none' // none | accept | close
    if (me && r.status === 'pending' && r.initiatorId !== me._id) action = 'accept'
    if (me && r.acceptedBy === me._id && (r.status === 'accepted' || r.status === 'in_progress')) action = 'close'
    if (me && r.initiatorId === me._id && r.status === 'pending') action = 'cancel'
    return ok({
      referral: r,
      patient,
      records,
      action,
      canCopy: !!me && (r.status === 'cancelled' || r.status === 'closed')
    })
  },

  'referral.accept': (payload = {}) => {
    const me = myDoctor()
    const r = db.findById('referrals', payload.referralId)
    if (!r) return fail('转诊单不存在')
    if (r.status !== 'pending') return fail('该转诊单已被接单或已关闭')
    const nowIso = new Date().toISOString()
    db.updateById('referrals', r._id, {
      status: 'accepted',
      acceptedBy: me._id,
      acceptedByName: me.name,
      acceptedAt: nowIso,
      logs: addLog(r, `${me.name} 立即接单`, me.name)
    })
    const initiator = db.findById('doctors', r.initiatorId)
    if (initiator) {
      pushMsg(initiator.userId, {
        type: 'referral',
        title: '转诊已被接单',
        content: `${me.name}（${me.hospitalName}）已接诊患者 ${r.patientName}`,
        refId: r._id
      })
    }
    const patient = db.findById('patients', r.patientId)
    if (patient && patient.patientUserId) {
      pushMsg(patient.patientUserId, {
        type: 'referral',
        title: '已被接诊',
        content: `您的转诊已被 ${me.hospitalName} ${me.name} 医生接诊`,
        refId: r._id
      })
    }
    return ok(db.findById('referrals', r._id))
  },

  'referral.close': (payload = {}) => {
    const me = myDoctor()
    const r = db.findById('referrals', payload.referralId)
    if (!r) return fail('转诊单不存在')
    if (r.acceptedBy !== me._id) return fail('仅接诊医生可结案')
    const nowIso = new Date().toISOString()
    db.updateById('referrals', r._id, {
      status: 'closed',
      closedAt: nowIso,
      treatment: Object.assign({}, payload.treatment, { closedBy: me.name, closedAt: nowIso }),
      logs: addLog(r, `${me.name} 转诊结案`, me.name)
    })
    const initiator = db.findById('doctors', r.initiatorId)
    if (initiator) {
      pushMsg(initiator.userId, {
        type: 'referral',
        title: '转诊已结案',
        content: `${me.name} 已完成患者 ${r.patientName} 的转诊结案`,
        refId: r._id
      })
    }
    const patient = db.findById('patients', r.patientId)
    if (patient && patient.patientUserId) {
      pushMsg(patient.patientUserId, {
        type: 'referral',
        title: '转诊已结案',
        content: '医生已完成本次转诊，可查看诊疗小结与医嘱',
        refId: r._id
      })
    }
    if (me) {
      db.updateById('doctors', me._id, {
        points: (me.points || 0) + 20,
        stats: Object.assign({}, me.stats, { closed: (me.stats.closed || 0) + 1 })
      })
    }
    return ok(db.findById('referrals', r._id))
  },

  'referral.cancel': (payload = {}) => {
    const me = myDoctor()
    const r = db.findById('referrals', payload.referralId)
    if (!r) return fail('转诊单不存在')
    if (r.initiatorId !== me._id) return fail('仅发起医生可取消')
    db.updateById('referrals', r._id, {
      status: 'cancelled',
      cancelReason: '发起医生主动取消',
      logs: addLog(r, `${me.name} 主动取消转诊`, me.name)
    })
    return ok(db.findById('referrals', r._id))
  },

  /* ---- 好友 ---- */
  'friend.list': () => {
    ensureSeed()
    const me = myDoctor()
    const rows = db.query('friends', { where: { doctorId: me._id, status: 'accepted' } })
    return ok(
      rows
        .map((f) => db.findById('doctors', f.friendId))
        .filter(Boolean)
        .map((d) => Object.assign({}, d, { friendStatus: 'accepted' }))
    )
  },

  'friend.pending': () => {
    const me = myDoctor()
    const rows = db.query('friends', { where: { friendId: me._id, status: 'pending' } })
    return ok(
      rows
        .map((f) => {
          const d = db.findById('doctors', f.doctorId)
          return d ? Object.assign({}, d, { requestId: f._id, friendStatus: 'pending' }) : null
        })
        .filter(Boolean)
    )
  },

  'friend.apply': (payload = {}) => {
    const me = myDoctor()
    const target = db.findById('doctors', payload.doctorId)
    if (!target) return fail('医生不存在')
    const exist = db
      .query('friends', { where: { doctorId: me._id, friendId: payload.doctorId } })[0]
    if (exist) return fail(exist.status === 'pending' ? '已发送申请，等待对方通过' : '已是好友')
    db.insert('friends', {
      doctorId: me._id,
      friendId: payload.doctorId,
      status: 'pending',
      createdAt: new Date().toISOString()
    })
    pushMsg(target.userId, {
      type: 'friend',
      title: '好友申请',
      content: `${me.name}（${me.hospitalName}）申请添加您为好友`,
      refId: me._id
    })
    return ok({ success: true })
  },

  'friend.handle': (payload = {}) => {
    const me = myDoctor()
    const req = db.findById('friends', payload.requestId)
    if (!req) return fail('申请不存在')
    if (payload.accept) {
      db.updateById('friends', payload.requestId, { status: 'accepted' })
      db.insert('friends', {
        doctorId: me._id,
        friendId: req.doctorId,
        status: 'accepted',
        createdAt: new Date().toISOString()
      })
      const target = db.findById('doctors', req.doctorId)
      if (target) {
        pushMsg(target.userId, { type: 'friend', title: '好友申请已通过', content: `${me.name} 已通过您的好友申请` })
      }
    } else {
      db.removeById('friends', payload.requestId)
    }
    return handlers['friend.list']()
  },

  /* ---- 消息 ---- */
  'message.list': () => {
    ensureSeed()
    const u = requireUser()
    return ok(db.query('messages', { where: { userId: u.userId }, orderBy: 'createdAt' }))
  },

  'message.read': (payload = {}) => {
    const u = requireUser()
    const list = db.query('messages', { where: { userId: u.userId } })
    if (payload.messageId) {
      db.updateById('messages', payload.messageId, { read: true })
    } else {
      list.forEach((m) => db.updateById('messages', m._id, { read: true }))
    }
    return ok({ success: true })
  },

  /* ---- 统计 ---- */
  'stats.mine': () => {
    const me = myDoctor()
    if (!me) return ok(null)
    const all = db.col('referrals')
    return ok({
      points: me.points || 0,
      initiated: all.filter((r) => r.initiatorId === me._id).length,
      accepted: all.filter((r) => r.acceptedBy === me._id).length,
      closed: all.filter((r) => r.acceptedBy === me._id && r.status === 'closed').length,
      pending: all.filter((r) => r.initiatorId === me._id && r.status === 'pending').length,
      friends: db.query('friends', { where: { doctorId: me._id, status: 'accepted' } }).length,
      closeRate: (() => {
        const mine = all.filter((r) => r.acceptedBy === me._id)
        if (!mine.length) return '-'
        return Math.round((mine.filter((r) => r.status === 'closed').length / mine.length) * 100) + '%'
      })()
    })
  },

  /* ---- 系统 ---- */
  'system.reset': () => {
    db.reset()
    ensureSeed()
    wx.removeStorageSync(USER_KEY)
    return ok({ success: true })
  }
}

module.exports = function mockRouter(action, payload) {
  ensureSeed()
  return new Promise((resolve) => {
    setTimeout(() => {
      const fn = handlers[action]
      if (!fn) return resolve(fail(`未知的 mock action: ${action}`))
      try {
        const res = fn(payload) || ok(null)
        return resolve(res)
      } catch (e) {
        return resolve(fail(e.message || 'MOCK 数据异常'))
      }
    }, 120)
  })
}
