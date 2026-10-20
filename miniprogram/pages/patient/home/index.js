const api = require('../../../utils/request')
const { requireRole, setTabBar } = require('../../../utils/guard')
const { formatTime, hoursLeft } = require('../../../utils/util')
const { REFERRAL_STATUS } = require('../../../config/index')

Page({
  data: {
    list: [],
    patient: null,
    statusMap: REFERRAL_STATUS
  },

  onLoad() {
    if (!requireRole('patient')) return
  },

  onShow() {
    setTabBar(this, 0)
    this.load()
  },

  load() {
    api.myProfile().then((p) => this.setData({ patient: p.patient }))
    api.referralList({ tab: 'mine' }).then((list) => {
      this.setData({
        list: list
          .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
          .map((r) =>
            Object.assign({}, r, {
              createdText: formatTime(r.createdAt),
              leftHours: hoursLeft(r.expireAt)
            })
          )
      })
    })
  },

  onDetail(e) {
    wx.navigateTo({ url: `/pages/patient/referral/detail/index?id=${e.currentTarget.dataset.id}` })
  }
})
