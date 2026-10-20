const api = require('../../../../utils/request')
const { requireRole, setTabBar } = require('../../../../utils/guard')
const { formatTime, hoursLeft } = require('../../../../utils/util')
const { REFERRAL_STATUS } = require('../../../../config/index')

Page({
  data: {
    tabs: [
      { key: 'mine', text: '我发起' },
      { key: 'pool', text: '待抢单' },
      { key: 'accepted', text: '我接诊' },
      { key: 'history', text: '历史记录' }
    ],
    active: 'mine',
    list: [],
    statusMap: REFERRAL_STATUS
  },

  onLoad() {
    if (!requireRole('doctor')) return
  },

  onShow() {
    setTabBar(this, 1)
    this.load()
  },

  load() {
    return api.referralList({ tab: this.data.active }).then((list) => {
      this.setData({
        list: list
          .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
          .map((r) =>
            Object.assign({}, r, {
              createdText: formatTime(r.createdAt),
              leftHours: r.status === 'pending' ? hoursLeft(r.expireAt) : 0
            })
          )
      })
    })
  },

  onTab(e) {
    this.setData({ active: e.currentTarget.dataset.key }, () => this.load())
  },

  onDetail(e) {
    wx.navigateTo({ url: `/pages/doctor/referral/detail/index?id=${e.currentTarget.dataset.id}` })
  },

  onCreate() {
    wx.navigateTo({ url: '/pages/doctor/referral/create/index' })
  }
})
