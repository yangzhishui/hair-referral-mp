const h = require('./helper')

exports.mine = async (ctx) => {
  const me = await h.currentDoctor(ctx)
  if (!me) return null

  const all = await h.list(ctx, 'referrals', {})
  const mine = all.filter((r) => r.initiatorId === me._id)
  const acceptedList = all.filter((r) => r.acceptedBy === me._id)
  const closedList = acceptedList.filter((r) => r.status === 'closed')
  const friends = await h.list(ctx, 'friends', { doctorId: me._id, status: 'accepted' })

  return {
    points: me.points || 0,
    initiated: mine.length,
    accepted: acceptedList.length,
    closed: closedList.length,
    pending: mine.filter((r) => r.status === 'pending').length,
    friends: friends.length,
    closeRate: acceptedList.length
      ? Math.round((closedList.length / acceptedList.length) * 100) + '%'
      : '-'
  }
}
