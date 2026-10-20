const api = require('../../../utils/request')
const { requireRole, setTabBar, refresh } = require('../../../utils/guard')
const { fromNow } = require('../../../utils/util')

Page({
  data: {
    patient: null,
    records: [],
    images: [],
    messages: []
  },

  onLoad() {
    if (!requireRole('patient')) return
  },

  onShow() {
    setTabBar(this, 1)
    this.load()
  },

  load() {
    refresh()
      .then((profile) => {
        const p = profile.patient || {}
        this.setData({ patient: p, images: (p.images || []).slice() })
        return api.recordList({ patientId: p._id })
      })
      .then((records) => this.setData({ records }))
      .catch(() => {})
    api.messageList().then((list) => {
      this.setData({
        messages: list.slice(0, 5).map((m) => Object.assign({}, m, { timeText: fromNow(m.createdAt) }))
      })
    })
  },

  onEdit() {
    wx.navigateTo({ url: '/pages/patient/mine/info/index' })
  },

  onPreview(e) {
    const { url } = e.currentTarget.dataset
    if (url) wx.previewImage({ urls: [url], current: url })
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
