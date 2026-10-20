const api = require('../../../../utils/request')
const { requireRole, refresh } = require('../../../../utils/guard')

Page({
  data: {
    genders: ['男', '女'],
    form: {
      name: '',
      gender: '男',
      age: '',
      phone: '',
      pastHistory: '',
      allergy: '',
      chiefComplaint: ''
    }
  },

  onLoad() {
    if (!requireRole('patient')) return
    const profile = getApp().globalData.profile || wx.getStorageSync('profile')
    const p = (profile && profile.patient) || {}
    this.setData({
      form: {
        name: p.name || '',
        gender: p.gender || '男',
        age: p.age || '',
        phone: p.phone || '',
        pastHistory: p.pastHistory || '',
        allergy: p.allergy || '',
        chiefComplaint: p.chiefComplaint || ''
      }
    })
  },

  onInput(e) {
    this.setData({ [`form.${e.currentTarget.dataset.field}`]: e.detail.value })
  },

  onGender(e) {
    this.setData({ 'form.gender': this.data.genders[e.detail.value] })
  },

  onSave() {
    const f = this.data.form
    if (!f.name.trim()) return wx.showToast({ title: '请填写姓名', icon: 'none' })
    if (!/^1\d{10}$/.test(f.phone)) return wx.showToast({ title: '请填写正确的手机号', icon: 'none' })
    wx.showLoading({ title: '保存中', mask: true })
    api
      .updateProfile(f)
      .then(() => refresh())
      .then(() => {
        wx.hideLoading()
        wx.showToast({ title: '已同步医生端', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 500)
      })
      .catch(() => wx.hideLoading())
  }
})
