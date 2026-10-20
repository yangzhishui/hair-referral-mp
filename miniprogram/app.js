const ENV = require('./config/env')

App({
  globalData: {
    role: '', // doctor | patient
    profile: null,
    cloudReady: false
  },

  onLaunch() {
    this.globalData.role = wx.getStorageSync('role') || ''
    this.globalData.profile = wx.getStorageSync('profile') || null

    if (!wx.cloud) {
      console.warn('[app] 当前基础库不支持云开发，已切换到本地 MOCK 模式')
      return
    }
    if (!ENV.cloudEnv) {
      console.warn('[app] 未配置云环境 ID（config/env.js），已使用本地 MOCK 模式')
      return
    }
    wx.cloud.init({ env: ENV.cloudEnv, traceUser: true })
    this.globalData.cloudReady = true
  },

  setRole(role, profile) {
    this.globalData.role = role
    if (profile) {
      this.globalData.profile = profile
      wx.setStorageSync('profile', profile)
    }
    wx.setStorageSync('role', role)
  },

  logout() {
    this.globalData.role = ''
    this.globalData.profile = null
    wx.removeStorageSync('role')
    wx.removeStorageSync('profile')
  }
})
