const ENV = require('../../config/env')

Page({
  data: {
    mockMode: false
  },

  onLoad() {
    this.setData({ mockMode: ENV.useMock || !ENV.cloudEnv })
  },

  onChoose(e) {
    const role = e.currentTarget.dataset.role
    wx.setStorageSync('entryRole', role)
    wx.navigateTo({ url: `/pages/auth/login/login?role=${role}` })
  }
})
