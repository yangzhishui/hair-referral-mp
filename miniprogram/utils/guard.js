const app = getApp()
const api = require('./request')

function profile() {
  if (app.globalData.profile) return app.globalData.profile
  const p = wx.getStorageSync('profile')
  if (p) app.globalData.profile = p
  return p || null
}

/** 校验登录态与角色，不满足则回到入口页 */
function requireRole(role) {
  const p = profile()
  if (!p || p.role !== role) {
    wx.reLaunch({ url: '/pages/entry/entry' })
    return null
  }
  if (!app.globalData.role) app.globalData.role = role
  return p
}

/** 刷新并缓存当前用户资料 */
function refresh() {
  return api.myProfile().then((p) => {
    app.globalData.profile = p
    wx.setStorageSync('profile', p)
    return p
  })
}

/** 设置自定义 tabBar 选中项 */
function setTabBar(page, index) {
  if (typeof page.getTabBar === 'function') {
    const bar = page.getTabBar()
    if (bar) bar.setData({ selected: index })
  }
}

module.exports = { profile, requireRole, refresh, setTabBar }
