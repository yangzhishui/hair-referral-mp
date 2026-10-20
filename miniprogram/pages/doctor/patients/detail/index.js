const api = require('../../../../utils/request')
const { requireRole } = require('../../../../utils/guard')
const { formatTime } = require('../../../../utils/util')
const { REFERRAL_STATUS, IMAGE_CATEGORIES } = require('../../../../config/index')

Page({
  data: {
    patientId: '',
    patient: null,
    records: [],
    referrals: [],
    imageGroups: [],
    statusMap: REFERRAL_STATUS
  },

  onLoad(query) {
    if (!requireRole('doctor')) return
    this.setData({ patientId: query.id })
  },

  onShow() {
    if (!this.data.patientId) return
    api.patientGet({ patientId: this.data.patientId }).then((res) => {
      const images = res.patient.images || []
      const groups = IMAGE_CATEGORIES.map((c) => ({
        key: c.key,
        name: c.name,
        list: images.filter((i) => i.category === c.key).sort((a, b) => (a.takenAt < b.takenAt ? 1 : -1))
      })).filter((g) => g.list.length)

      this.setData({
        patient: Object.assign({}, res.patient, {
          lastReferralText: res.patient.lastReferralAt ? formatTime(res.patient.lastReferralAt, false) : '暂无'
        }),
        editable: res.editable,
        records: res.records.map((r) =>
          Object.assign({}, r, { updatedText: formatTime(r.updatedAt || r.createdAt) })
        ),
        referrals: res.referrals.map((r) =>
          Object.assign({}, r, { createdText: formatTime(r.createdAt) })
        ),
        imageGroups: groups,
        imageCount: images.length
      })
    })
  },

  onEditBase() {
    wx.navigateTo({ url: `/pages/doctor/patients/edit/index?mode=edit&id=${this.data.patientId}` })
  },

  onGallery() {
    wx.navigateTo({ url: `/pages/doctor/patients/gallery/index?id=${this.data.patientId}` })
  },

  onRecord(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/doctor/patients/record/index?patientId=${this.data.patientId}&recordId=${id || ''}`
    })
  },

  onReferralCreate() {
    wx.navigateTo({ url: `/pages/doctor/referral/create/index?patientId=${this.data.patientId}` })
  },

  onReferralDetail(e) {
    wx.navigateTo({ url: `/pages/doctor/referral/detail/index?id=${e.currentTarget.dataset.id}` })
  },

  onPreview(e) {
    const { url } = e.currentTarget.dataset
    if (!url) return
    wx.previewImage({ urls: [url], current: url })
  }
})
