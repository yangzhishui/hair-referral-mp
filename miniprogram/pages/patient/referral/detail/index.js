const api = require('../../../../utils/request')
const { requireRole } = require('../../../../utils/guard')
const { formatTime, hoursLeft } = require('../../../../utils/util')
const { REFERRAL_STATUS, IMAGE_CATEGORIES } = require('../../../../config/index')

Page({
  data: {
    referral: null,
    patient: null,
    records: [],
    imageGroups: [],
    statusMap: REFERRAL_STATUS
  },

  onLoad(query) {
    if (!requireRole('patient')) return
    this.setData({ id: query.id })
    this.load()
  },

  load() {
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
        imageGroups: groups
      })
      wx.setNavigationBarTitle({ title: '转诊详情' })
    })
  },

  onPreview(e) {
    const { url } = e.currentTarget.dataset
    if (url) wx.previewImage({ urls: [url], current: url })
  }
})
