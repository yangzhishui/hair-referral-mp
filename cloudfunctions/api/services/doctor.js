const h = require('./helper')

/** 搜索医生：姓名 / 医院 / 科室 */
exports.search = async (ctx, payload = {}) => {
  const me = await h.currentDoctor(ctx)
  const keyword = (payload.keyword || '').trim()
  let query = {}

  if (payload.doctorId) {
    query = { _id: payload.doctorId }
  } else if (keyword) {
    query = {
      name: ctx.db.RegExp({ regexp: keyword, options: 'i' })
    }
  }

  let list = await h.list(ctx, 'doctors', query, 'createdAt', false)

  if (keyword) {
    const byHospital = await h.list(ctx, 'doctors', {
      hospitalName: ctx.db.RegExp({ regexp: keyword, options: 'i' })
    }, 'createdAt', false)
    const map = {}
    list.forEach((d) => (map[d._id] = d))
    byHospital.forEach((d) => (map[d._id] = d))
    list = Object.keys(map).map((k) => map[k])
  }

  if (me) list = list.filter((d) => d._id !== me._id)

  // 好友状态
  const friendRows = me ? await h.list(ctx, 'friends', { doctorId: me._id }) : []
  return list.map((d) => {
    const row = friendRows.find((f) => f.friendId === d._id)
    return Object.assign({}, d, { friendStatus: row ? row.status : 'none' })
  })
}

exports.profile = async (ctx, payload = {}) => {
  const doctor = await h.findOne(ctx, 'doctors', { _id: payload.doctorId })
  if (!doctor) throw new Error('医生不存在')
  const hospital = doctor.hospitalId ? await h.findOne(ctx, 'hospitals', { _id: doctor.hospitalId }) : null
  return Object.assign({}, doctor, { hospital })
}
