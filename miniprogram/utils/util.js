function pad(n) {
  return n < 10 ? '0' + n : '' + n
}

/** 格式化时间戳 -> 2026-10-20 14:30 */
function formatTime(ts, withTime = true) {
  if (!ts) return ''
  const d = ts instanceof Date ? ts : new Date(ts)
  if (isNaN(d.getTime())) return ''
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return withTime ? `${date} ${pad(d.getHours())}:${pad(d.getMinutes())}` : date
}

/** 相对时间：刚刚 / 5分钟前 / 3天前 */
function fromNow(ts) {
  if (!ts) return ''
  const d = new Date(ts).getTime()
  const diff = Date.now() - d
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  if (diff < 2592000000) return `${Math.floor(diff / 86400000)} 天前`
  return formatTime(ts, false)
}

/** 距离过期剩余小时数 */
function hoursLeft(expiresAt) {
  if (!expiresAt) return 0
  const left = new Date(expiresAt).getTime() - Date.now()
  return left > 0 ? Math.ceil(left / 3600000) : 0
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function genId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

function daysFromNow(days) {
  return Date.now() + days * 86400000
}

function formatDateShort(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

module.exports = {
  pad,
  formatTime,
  fromNow,
  hoursLeft,
  uuid,
  genId,
  daysFromNow,
  formatDateShort
}
