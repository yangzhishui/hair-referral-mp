const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

const services = {
  auth: require('./services/auth'),
  doctor: require('./services/doctor'),
  hospital: require('./services/hospital'),
  patient: require('./services/patient'),
  record: require('./services/record'),
  referral: require('./services/referral'),
  friend: require('./services/friend'),
  message: require('./services/message'),
  stats: require('./services/stats'),
  system: require('./services/system')
}

exports.main = async (event = {}) => {
  const { action, payload = {} } = event
  const openid = cloud.getWXContext().OPENID
  const ctx = { db, _, cloud, openid }

  const [group, name] = String(action || '').split('.')
  const service = services[group]

  if (!service || typeof service[name] !== 'function') {
    return { code: -1, msg: `未知接口：${action}` }
  }

  try {
    const data = await service[name](ctx, payload)
    return { code: 0, data }
  } catch (err) {
    console.error(`[api] ${action} 失败`, err)
    return { code: -1, msg: err.message || '服务异常，请稍后重试' }
  }
}
