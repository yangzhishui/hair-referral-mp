const api = require('../../../utils/request')
const app = getApp()

Page({
  data: {
    role: 'doctor',
    phone: '',
    logging: false
  },

  onLoad(query) {
    const role = query.role || wx.getStorageSync('entryRole') || 'doctor'
    this.setData({ role })
    wx.setNavigationBarTitle({
      title: role === 'doctor' ? '医生登录 / 注册' : '患者登录'
    })
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value })
  },

  onGetPhone(e) {
    // 企业主体可通过 getPhoneNumber 直接获取；此处兼容手动输入
    if (e.detail.phoneNumber) {
      this.setData({ phone: e.detail.phoneNumber })
      this.bindPhone()
    }
  },

  onLogin() {
    if (this.data.logging) return
    this.setData({ logging: true })
    wx.showLoading({ title: '登录中', mask: true })
    api
      .login({ role: this.data.role })
      .then((profile) => {
        app.setRole(this.data.role, profile)
        const home =
          this.data.role === 'doctor'
            ? '/pages/doctor/patients/list/index'
            : '/pages/patient/home/index'
        if (this.data.role === 'doctor' && profile.doctor.auditStatus !== 'approved') {
          wx.hideLoading()
          wx.redirectTo({ url: '/pages/auth/verify/verify' })
          return
        }
        wx.hideLoading()
        wx.showToast({ title: '登录成功', icon: 'success' })
        setTimeout(() => wx.switchTab({ url: home }), 400)
      })
      .catch(() => {
        wx.hideLoading()
        this.setData({ logging: false })
      })
  },

  bindPhone() {
    const phone = (this.data.phone || '').trim()
    if (!/^1\d{10}$/.test(phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }
    api.bindPhone({ phone }).then((profile) => {
      app.globalData.profile = profile
      wx.setStorageSync('profile', profile)
      wx.showToast({ title: '绑定成功', icon: 'success' })
      this.setData({ phone: '' })
    })
  }
})
