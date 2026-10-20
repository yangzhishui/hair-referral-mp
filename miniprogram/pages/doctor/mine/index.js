const api = require('../../../utils/request')
const { requireRole, setTabBar, refresh } = require('../../../utils/guard')

Page({
  data: {
    profile: null,
    doctor: null,
    hospital: null,
    stats: null,
    unread: 0,
    schedule: []
  },

  onLoad() {
    if (!requireRole('doctor')) return
  },

  onShow() {
    setTabBar(this, 3)
    this.load()
  },

  load() {
    refresh()
      .then((profile) => {
        const d = profile.doctor || {}
        const today = new Date()
        const limit = new Date(today.getTime() + 3 * 86400000)
        const schedule = (d.schedule || [])
          .filter((s) => {
            const t = new Date(s.date).getTime()
            return t >= new Date(today.toDateString()).getTime() && t <= limit.getTime()
          })
          .map((s) => Object.assign({}, s, { dateText: s.date.slice(5) }))
        this.setData({
          profile,
          doctor: d,
          hospital: profile.hospital,
          schedule
        })
      })
      .catch(() => {})

    api.myStats().then((stats) => this.setData({ stats }))
    api.messageList().then((list) => {
      this.setData({ unread: list.filter((m) => !m.read).length })
    })
  },

  goQualification() {
    wx.navigateTo({ url: '/pages/auth/verify/verify' })
  },

  goEdit() {
    wx.navigateTo({ url: '/pages/doctor/mine/edit/index' })
  },

  goHospital() {
    wx.navigateTo({ url: '/pages/doctor/mine/hospital/index' })
  },

  goMessages() {
    wx.navigateTo({ url: '/pages/doctor/mine/messages/index' })
  },

  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确认退出当前账号？',
      success: (res) => {
        if (!res.confirm) return
        getApp().logout()
        wx.reLaunch({ url: '/pages/entry/entry' })
      }
    })
  }
})
