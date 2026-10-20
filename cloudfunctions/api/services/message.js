const h = require('./helper')

exports.list = async (ctx) => {
  const user = await h.currentUser(ctx)
  return h.list(ctx, 'messages', { userId: user._id })
}

exports.read = async (ctx, payload = {}) => {
  const user = await h.currentUser(ctx)
  if (payload.messageId) {
    await ctx.db.collection('messages').doc(payload.messageId).update({ data: { read: true } })
    return { success: true }
  }
  const rows = await h.list(ctx, 'messages', { userId: user._id, read: false })
  for (const row of rows) {
    await ctx.db.collection('messages').doc(row._id).update({ data: { read: true } })
  }
  return { success: true }
}
