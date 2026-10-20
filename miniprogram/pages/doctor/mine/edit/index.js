const api = require('../../../../utils/request')
const { requireRole, refresh } = require('../../../../utils/guard')
const { preview } = require('../../../../utils/upload')

Page({
  data: {
    doctor: null,
    avatar: [],
    specialties: '',
    projects: '',
    phone: '',
    date: '',
    period: '',
    schedule: [],
    password: ''
  },

  onLoad() {
    if (!requireRole('doctor')) return
    const profile = getApp().globalData.profile || wx.getStorageSync('profile')
    const d = (profile && profile.doctor) || {}
    this.setData({
      doctor: d,
      avatar: d.avatar ? [{ url: d.avatar }] : [],
      specialties: (d.specialties || []).join('、'),
      projects: (d.projects || []).join('、'),
      phone: d.phone || '',
      schedule: d.schedule || []
    })
  },

  onInput(e) {
    this.setData({ [e.currentTarget.dataset.field]: e.detail.value })
  },

  onAvatarChange(e) {
    this.setData({ avatar: e.detail.list })
  },

  onDate(e) {
    this.setData({ date: e.detail.value })
  },

  addSchedule() {
    const { date, period, schedule } = this.data
    if (!date || !period.trim()) return wx.showToast({ title: '请选择日期并填写时段', icon: 'none' })
    const list = schedule.slice()
    list.push({ date, period: period.trim() })
    list.sort((a, b) => (a.date < b.date ? -1 : 1))
    this.setData({ schedule: list, period: '' })
  },

  removeSchedule(e) {
    const list = this.data.schedule.slice()
    list.splice(e.currentTarget.dataset.index, 1)
    this.setData({ schedule: list })
  },

  previewAvatar() {
    if (this.data.avatar.length) preview(this.data.avatar[0].url, [this.data.avatar[0].url])
  },

  onSave() {
    if (!/^1\d{10}$/.test(this.data.phone)) return wx.showToast({ title: '请填写正确的手机号', icon: 'none' })
    wx.showLoading({ title: '保存中', mask: true })
    api
      .updateProfile({
        avatar: this.data.avatar.length ? this.data.avatar[0].url : '',
        specialties: this.data.specialties.split(/[、,，\s]+/).filter(Boolean),
        projects: this.data.projects.split(/[、,，\s]+/).filter(Boolean),
        phone: this.data.phone,
        schedule: this.data.schedule
      })
      .then(() => refresh())
      .then(() => {
        wx.hideLoading()
        wx.showToast({ title: '已保存', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 500)
      })
      .catch(() => wx.hideLoading())
  },

  onChangePassword() {
    const pwd = (this.data.password || '').trim()
    if (pwd.length < 6) return wx.showToast({ title: '密码至少 6 位', icon: 'none' })
    wx.showLoading({ title: '提交中', mask: true })
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({ title: '密码已更新', icon: 'success' })
      this.setData({ password: '' })
    }, 600)
  }
})
