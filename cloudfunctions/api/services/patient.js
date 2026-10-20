const h = require('./helper')

/** 患者列表（医生端：归属自己；患者端：本人档案） */
exports.list = async (ctx, payload = {}) => {
  const user = await h.currentUser(ctx)

  if (user.role === 'patient') {
    const p = await h.currentPatient(ctx)
    return p ? [p] : []
  }

  const me = await h.requireDoctor(ctx)
  const keyword = (payload.keyword || '').trim()
  const where = { creatorDoctorId: me._id }
  if (keyword) {
    where.name = ctx.db.RegExp({ regexp: keyword, options: 'i' })
  }
  let list = await h.list(ctx, 'patients', where)
  if (keyword && /^\d+$/.test(keyword)) {
    const byPhone = await h.list(ctx, 'patients', { creatorDoctorId: me._id, phone: keyword })
    const map = {}
    list.forEach((p) => (map[p._id] = p))
    byPhone.forEach((p) => (map[p._id] = p))
    list = Object.keys(map).map((k) => map[k])
  }
  return list
}

exports.get = async (ctx, payload = {}) => {
  const patient = await h.findOne(ctx, 'patients', { _id: payload.patientId })
  if (!patient) throw new Error('患者不存在')
  const records = await h.list(ctx, 'records', { patientId: patient._id })
  const referrals = await h.list(ctx, 'referrals', { patientId: patient._id })
  const user = await h.currentUser(ctx)
  return {
    patient,
    records,
    referrals,
    editable: user.role === 'doctor' && user.doctorId === patient.creatorDoctorId
  }
}

exports.create = async (ctx, payload = {}) => {
  const me = await h.requireDoctor(ctx)
  const data = Object.assign({}, payload)
  delete data._id
  return h.insert(ctx, 'patients', Object.assign({}, data, {
    creatorDoctorId: me._id,
    creatorName: me.name,
    images: data.images || [],
    patientUserId: '',
    openid: ''
  }))
}

exports.update = async (ctx, payload = {}) => {
  const patch = Object.assign({}, payload.patch || {})
  delete patch._id
  delete patch.creatorDoctorId
  await ctx.db.collection('patients').doc(payload.patientId).update({ data: patch })
  return exports.get(ctx, { patientId: payload.patientId })
}

/** 影像资料整体保存（新增 / 删除 / 排序） */
exports.saveImages = async (ctx, payload = {}) => {
  await ctx.db.collection('patients').doc(payload.patientId).update({
    data: { images: payload.images || [] }
  })
  return { success: true }
}
