const h = require('./helper')

exports.list = async (ctx) => {
  const me = await h.requireDoctor(ctx)
  const rows = await h.list(ctx, 'friends', { doctorId: me._id, status: 'accepted' })
  const out = []
  for (const row of rows) {
    const d = await h.findOne(ctx, 'doctors', { _id: row.friendId })
    if (d) out.push(Object.assign({}, d, { friendStatus: 'accepted' }))
  }
  return out
}

exports.pending = async (ctx) => {
  const me = await h.requireDoctor(ctx)
  const rows = await h.list(ctx, 'friends', { friendId: me._id, status: 'pending' })
  const out = []
  for (const row of rows) {
    const d = await h.findOne(ctx, 'doctors', { _id: row.doctorId })
    if (d) out.push(Object.assign({}, d, { requestId: row._id, friendStatus: 'pending' }))
  }
  return out
}

exports.apply = async (ctx, payload = {}) => {
  const me = await h.requireDoctor(ctx)
  const target = await h.findOne(ctx, 'doctors', { _id: payload.doctorId })
  if (!target) throw new Error('医生不存在')

  const exist = await h.findOne(ctx, 'friends', { doctorId: me._id, friendId: payload.doctorId })
  if (exist) throw new Error(exist.status === 'pending' ? '已发送申请，等待对方通过' : '已是好友')

  await h.insert(ctx, 'friends', {
    doctorId: me._id,
    friendId: payload.doctorId,
    status: 'pending'
  })

  await h.pushMessage(ctx, target.userId, {
    type: 'friend',
    title: '好友申请',
    content: `${me.name}（${me.hospitalName}）申请添加您为好友`,
    refId: me._id
  })
  return { success: true }
}

exports.handle = async (ctx, payload = {}) => {
  const me = await h.requireDoctor(ctx)
  const req = await h.findOne(ctx, 'friends', { _id: payload.requestId })
  if (!req) throw new Error('申请不存在')
  if (req.friendId !== me._id) throw new Error('无权处理该申请')

  if (!payload.accept) {
    await ctx.db.collection('friends').doc(req._id).remove()
    return exports.list(ctx)
  }

  await ctx.db.collection('friends').doc(req._id).update({ data: { status: 'accepted' } })
  await h.insert(ctx, 'friends', {
    doctorId: me._id,
    friendId: req.doctorId,
    status: 'accepted'
  })

  const target = await h.findOne(ctx, 'doctors', { _id: req.doctorId })
  if (target) {
    await h.pushMessage(ctx, target.userId, {
      type: 'friend',
      title: '好友申请已通过',
      content: `${me.name} 已通过您的好友申请`
    })
  }
  return exports.list(ctx)
}
