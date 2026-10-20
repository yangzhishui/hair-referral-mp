const api = require('../../../../utils/request')
const { requireRole } = require('../../../../utils/guard')
const { formatTime, hoursLeft } = require('../../../../utils/util')
const { REFERRAL_STATUS, IMAGE_CATEGORIES } = require('../../../../config/index')

Page({
  data: {
    id: '',
    referral: null,
    patient: null,
    records: [],
    imageGroups: [],
    action: 'none',
    canCopy: false,
    statusMap: REFERRAL_STATUS
  },

  onLoad(query) {
    if (!requireRole('doctor')) return
    this.setData({ id: query.id })
  },

  onShow() {
    if (!this.data.id) return
    api.referralGet({ referralId: this.data.id }).then((res) => {
      const images = (res.patient && res.patient.images) || []
      const groups = IMAGE_CATEGORIES.map((c) => ({
        key: c.key,
        name: c.name,
        list: images.filter((i) => i.category === c.key)
      })).filter((g) => g.list.length)
      this.setData({
        referral: Object.assign({}, res.referral, {
          createdText: formatTime(res.referral.createdAt),
          leftHours: hoursLeft(res.referral.expireAt),
          logs: (res.referral.logs || []).map((l) => Object.assign({}, l, { timeText: formatTime(l.at) }))
        }),
        patient: res.patient,
        records: res.records,
        imageGroups: groups,
        action: res.action,
        canCopy: res.canCopy
      })
      wx.setNavigationBarTitle({ title: `转诊 · ${res.referral.patientName}` })
    })
  },

  onAccept() {
    wx.showModal({
      title: '立即接单',
      content: '接单后该转诊单将锁定，其他医生无法抢单，是否确认？',
      success: (res) => {
        if (!res.confirm) return
        wx.showLoading({ title: '处理中', mask: true })
        api.referralAccept({ referralId: this.data.id }).then(() => {
          wx.hideLoading()
          wx.showToast({ title: '接单成功', icon: 'success' })
          this.onShow()
        }).catch(() => wx.hideLoading())
      }
    })
  },

  onClose() {
    wx.navigateTo({ url: `/pages/doctor/referral/close/index?id=${this.data.id}` })
  },

  onCancel() {
    wx.showModal({
      title: '取消转诊',
      content: '取消后可使用一键复制资料重新发起，是否确认取消？',
      success: (res) => {
        if (!res.confirm) return
        wx.showLoading({ title: '处理中', mask: true })
        api.referralCancel({ referralId: this.data.id }).then(() => {
          wx.hideLoading()
          wx.showToast({ title: '已取消', icon: 'success' })
          this.onShow()
        }).catch(() => wx.hideLoading())
      }
    })
  },

  onCopy() {
    wx.navigateTo({ url: `/pages/doctor/referral/create/index?patientId=${this.data.referral.patientId}` })
  },

  onPreview(e) {
    const { url } = e.currentTarget.dataset
    if (url) wx.previewImage({ urls: [url], current: url })
  },

  onRecord(e) {
    wx.navigateTo({
      url: `/pages/doctor/patients/record/index?patientId=${this.data.patient._id}&recordId=${e.currentTarget.dataset.id || ''}`
    })
  }
})
