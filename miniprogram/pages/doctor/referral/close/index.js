const api = require('../../../../utils/request')
const { requireRole } = require('../../../../utils/guard')

Page({
  data: {
    id: '',
    images: [],
    advice: '',
    summary: '',
    submitting: false
  },

  onLoad(query) {
    if (!requireRole('doctor')) return
    this.setData({ id: query.id })
  },

  onImagesChange(e) {
    this.setData({ images: e.detail.list })
  },

  onInput(e) {
    this.setData({ [e.currentTarget.dataset.field]: e.detail.value })
  },

  onSubmit() {
    const { advice, summary, images } = this.data
    if (!summary.trim()) return wx.showToast({ title: '请填写诊疗小结', icon: 'none' })
    wx.showModal({
      title: '转诊结案',
      content: '结案后患者端可查看诊疗小结与医嘱，是否确认？',
      success: (res) => {
        if (!res.confirm) return
        this.setData({ submitting: true })
        wx.showLoading({ title: '提交中', mask: true })
        api
          .referralClose({
            referralId: this.data.id,
            treatment: { images, advice, summary }
          })
          .then(() => {
            wx.hideLoading()
            wx.showToast({ title: '已结案', icon: 'success' })
            setTimeout(() => wx.navigateBack(), 600)
          })
          .catch(() => {
            wx.hideLoading()
            this.setData({ submitting: false })
          })
      }
    })
  }
})
