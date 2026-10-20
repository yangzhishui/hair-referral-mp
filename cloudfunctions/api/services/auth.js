const h = require('./helper')

/** 微信一键登录 / 注册（账号唯一：以 openid 为准） */
exports.login = async (ctx, payload = {}) => {
  const role = payload.role === 'patient' ? 'patient' : 'doctor'
  const user = await h.currentUser(ctx)
  await ctx.db.collection('users').doc(user._id).update({ data: { role } })

  if (role === 'doctor') {
    let doctor = await h.findOne(ctx, 'doctors', { userId: user._id })
    if (!doctor) {
      doctor = await h.insert(ctx, 'doctors', {
        userId: user._id,
        openid: ctx.openid,
        name: '',
        title: '',
        licenseNo: '',
        phone: '',
        hospitalId: '',
        hospitalName: '',
        department: '',
        specialties: [],
        projects: [],
        schedule: [],
        certImages: [],
        auditStatus: 'none',
        points: 0,
        isAdmin: false
      })
    }
    await ctx.db.collection('users').doc(user._id).update({ data: { doctorId: doctor._id } })
  }
  return exports.profile(ctx, {})
}

/** 当前用户完整资料 */
exports.profile = async (ctx) => {
  const user = await h.currentUser(ctx)
  const base = { role: user.role || '', userId: user._id, phone: user.phone || '' }

  if (base.role === 'doctor') {
    const doctor = user.doctorId ? await h.findOne(ctx, 'doctors', { _id: user.doctorId }) : null
    if (!doctor) return Object.assign(base, { doctor: null, hospital: null })
    const hospital = doctor.hospitalId ? await h.findOne(ctx, 'hospitals', { _id: doctor.hospitalId }) : null
    return Object.assign(base, { doctor, hospital })
  }

  if (base.role === 'patient') {
    let patient = user.patientId ? await h.findOne(ctx, 'patients', { _id: user.patientId }) : null
    if (!patient) patient = await h.findOne(ctx, 'patients', { openid: ctx.openid })
    if (patient && !user.patientId) {
      await ctx.db.collection('users').doc(user._id).update({ data: { patientId: patient._id } })
    }
    return Object.assign(base, { patient })
  }

  return base
}

/** 手机号绑定（账号唯一） */
exports.bindPhone = async (ctx, payload = {}) => {
  const user = await h.currentUser(ctx)
  const phone = String(payload.phone || '').trim()
  if (!/^1\d{10}$/.test(phone)) throw new Error('手机号格式不正确')
  await ctx.db.collection('users').doc(user._id).update({ data: { phone } })
  if (user.doctorId) {
    await ctx.db.collection('doctors').doc(user.doctorId).update({ data: { phone } })
  }
  if (user.patientId) {
    await ctx.db.collection('patients').doc(user.patientId).update({ data: { phone } })
  }
  return exports.profile(ctx, {})
}

/** 修改资料（医生 / 患者通用） */
exports.updateProfile = async (ctx, payload = {}) => {
  const user = await h.currentUser(ctx)
  const patch = Object.assign({}, payload)
  delete patch.role
  delete patch.auditStatus
  delete patch.points

  if (user.role === 'doctor' && user.doctorId) {
    await ctx.db.collection('doctors').doc(user.doctorId).update({ data: patch })
  } else if (user.role === 'patient' && user.patientId) {
    await ctx.db.collection('patients').doc(user.patientId).update({ data: patch })
  }
  return exports.profile(ctx, {})
}

/** 提交资质审核 */
exports.submitVerify = async (ctx, payload = {}) => {
  const user = await h.currentUser(ctx)
  if (!user.doctorId) throw new Error('请先登录医生端')

  const hospital = payload.hospitalId ? await h.findOne(ctx, 'hospitals', { _id: payload.hospitalId }) : null

  await ctx.db.collection('doctors').doc(user.doctorId).update({
    data: {
      name: payload.name || '',
      title: payload.title || '',
      licenseNo: payload.licenseNo || '',
      hospitalId: payload.hospitalId || '',
      hospitalName: hospital ? hospital.name : '',
      department: payload.department || '',
      specialties: payload.specialties || [],
      projects: payload.projects || [],
      certImages: payload.certImages || [],
      auditStatus: 'pending'
    }
  })
  await ctx.db.collection('users').doc(user._id).update({ data: { role: 'doctor' } })
  return exports.profile(ctx, {})
}
