/**
 * 本地 MOCK 数据库
 * 以 Storage 为持久层，提供与云开发数据库接近的集合操作语义。
 * 仅用于无云环境时预览全流程，不参与正式环境逻辑。
 */
const KEY = 'HAIR_MP_DB'

let cache = null

function load() {
  if (!cache) cache = wx.getStorageSync(KEY) || {}
  return cache
}

function persist() {
  try {
    wx.setStorageSync(KEY, cache)
  } catch (e) {
    console.warn('[mock-db] 持久化失败', e)
  }
}

function reset() {
  cache = {}
  persist()
}

function col(name) {
  const data = load()
  if (!data[name]) {
    data[name] = []
    persist()
  }
  return data[name]
}

function setCollection(name, rows) {
  load()[name] = rows
  persist()
}

function matchValue(actual, expect) {
  if (expect && typeof expect === 'object' && !Array.isArray(expect)) {
    const ops = Object.keys(expect)
    for (const op of ops) {
      const v = expect[op]
      switch (op) {
        case '$in':
          if (Array.isArray(v)) {
            if (Array.isArray(actual)) {
              if (!actual.some((x) => v.indexOf(x) > -1)) return false
            } else if (!v.includes(actual)) return false
          }
          break
        case '$nin':
          if (Array.isArray(v) && Array.isArray(actual)) {
            if (actual.some((x) => v.indexOf(x) > -1)) return false
          } else if (Array.isArray(v) && v.includes(actual)) return false
          break
        case '$ne':
          if (actual === v) return false
          break
        case '$gt':
          if (!(actual > v)) return false
          break
        case '$gte':
          if (!(actual >= v)) return false
          break
        case '$lt':
          if (!(actual < v)) return false
          break
        case '$lte':
          if (!(actual <= v)) return false
          break
        case '$exists':
          if (v ? actual === undefined : actual !== undefined) return false
          break
        default:
          if (actual !== expect[op]) return false
      }
    }
    return true
  }
  if (Array.isArray(actual) && !Array.isArray(expect)) {
    return actual.indexOf(expect) > -1
  }
  if (Array.isArray(expect) && Array.isArray(actual)) {
    return expect.every((x) => actual.indexOf(x) > -1)
  }
  return actual === expect
}

function matchWhere(doc, where) {
  if (!where) return true
  return Object.keys(where).every((k) => matchValue(doc[k], where[k]))
}

function query(name, options = {}) {
  const { where, orderBy, desc = true, limit = 100, skip = 0, keyword } = options
  let rows = col(name).filter((d) => matchWhere(d, where))
  if (keyword && options.keywordFields) {
    const kw = String(keyword).trim().toLowerCase()
    if (kw) {
      rows = rows.filter((d) =>
        options.keywordFields.some((f) => String(d[f] || '').toLowerCase().indexOf(kw) > -1)
      )
    }
  }
  if (orderBy) {
    rows.sort((a, b) => {
      const av = a[orderBy]
      const bv = b[orderBy]
      if (av === bv) return 0
      return av > bv ? (desc ? -1 : 1) : desc ? 1 : -1
    })
  }
  return rows.slice(skip, skip + limit)
}

function insert(name, doc) {
  const row = Object.assign({}, doc)
  if (!row._id) row._id = `${name}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
  col(name).unshift(row)
  persist()
  return row
}

function updateById(name, id, patch) {
  const rows = col(name)
  const idx = rows.findIndex((d) => d._id === id)
  if (idx < 0) return null
  rows[idx] = Object.assign({}, rows[idx], patch)
  persist()
  return rows[idx]
}

function removeById(name, id) {
  const rows = col(name)
  const idx = rows.findIndex((d) => d._id === id)
  if (idx < 0) return false
  rows.splice(idx, 1)
  persist()
  return true
}

function findById(name, id) {
  return col(name).find((d) => d._id === id) || null
}

module.exports = {
  load,
  col,
  setCollection,
  query,
  insert,
  updateById,
  removeById,
  findById,
  reset
}
