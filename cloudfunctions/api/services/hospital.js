const h = require('./helper')

exports.list = async (ctx) => h.list(ctx, 'hospitals', {}, 'createdAt', false)

exports.get = async (ctx, payload = {}) => {
  const me = await h.currentDoctor(ctx)
  const hospitalId = payload.hospitalId || (me && me.hospitalId)
  if (!hospitalId) throw new Error('尚未挂靠医院')
  const hospital = await h.findOne(ctx, 'hospitals', { _id: hospitalId })
  if (!hospital) throw new Error('医院不存在')
  const doctors = await h.list(ctx, 'doctors', { hospitalId }, 'createdAt', false)
  return Object.assign({}, hospital, {
    doctors,
    canEdit: !!(me && me.isAdmin && me.hospitalId === hospitalId)
  })
}

exports.update = async (ctx, payload = {}) => {
  const me = await h.requireDoctor(ctx)
  const hospitalId = payload.hospitalId || me.hospitalId
  if (!me.isAdmin || me.hospitalId !== hospitalId) throw new Error('仅医院管理员可修改医院资料')

  const patch = Object.assign({}, payload)
  delete patch.hospitalId
  delete patch._id
  delete patch.doctors
  delete patch.canEdit

  await ctx.db.collection('hospitals').doc(hospitalId).update({ data: patch })
  return exports.get(ctx, { hospitalId })
}
