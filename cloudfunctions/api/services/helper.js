/** 云函数通用能力 */

function nowIso() {
  return new Date().toISOString()
}

async function findOne(ctx, collection, where) {
  const res = await ctx.db.collection(collection).where(where).limit(1).get()
  return res.data[0] || null
}

async function list(ctx, collection, where = {}, orderBy = 'createdAt', desc = true) {
  const res = await ctx.db
    .collection(collection)
    .where(where)
    .orderBy(orderBy, desc ? 'desc' : 'asc')
    .limit(100)
    .get()
  return res.data
}

async function insert(ctx, collection, doc) {
  const res = await ctx.db.collection(collection).add({ data: Object.assign({ createdAt: nowIso() }, doc) })
  const id = res._id
  const created = await ctx.db.collection(collection).doc(id).get()
  return created.data
}

async function update(ctx, collection, id, patch) {
  await ctx.db.collection(collection).doc(id).update({
    data: Object.assign({ updatedAt: nowIso() }, patch)
  })
  const res = await ctx.db.collection(collection).doc(id).get()
  return res.data
}

/** 当前登录用户 */
async function currentUser(ctx) {
  let user = await findOne(ctx, 'users', { openid: ctx.openid })
  if (!user) {
    user = await insert(ctx, 'users', {
      openid: ctx.openid,
      role: '',
      phone: '',
      createdAt: nowIso()
    })
  }
  return user
}

/** 当前医生（未注册医生身份时返回 null） */
async function currentDoctor(ctx) {
  const user = await currentUser(ctx)
  if (!user.doctorId) return null
  return findOne(ctx, 'doctors', { _id: user.doctorId })
}

/** 需要医生身份，否则抛错 */
async function requireDoctor(ctx) {
  const doctor = await currentDoctor(ctx)
  if (!doctor) throw new Error('请先完成医生认证入驻')
  return doctor
}

/** 当前患者（患者端） */
async function currentPatient(ctx) {
  const user = await currentUser(ctx)
  if (!user.patientId) return null
  return findOne(ctx, 'patients', { _id: user.patientId })
}

async function pushMessage(ctx, userId, msg) {
  if (!userId) return null
  return insert(ctx, 'messages', {
    userId,
    type: msg.type || 'system',
    title: msg.title,
    content: msg.content,
    refId: msg.refId || '',
    read: false,
    createdAt: nowIso()
  })
}

function buildLogs(referral, action, operator) {
  const logs = (referral.logs || []).slice()
  logs.push({ action, operator, at: nowIso() })
  return logs
}

module.exports = {
  nowIso,
  findOne,
  list,
  insert,
  update,
  currentUser,
  currentDoctor,
  requireDoctor,
  currentPatient,
  pushMessage,
  buildLogs
}
