const api = require('../../../../utils/request')
const { requireRole } = require('../../../../utils/guard')
const { fromNow } = require('../../../../utils/util')

Page({
  data: {
    list: [],
    icons: { referral: '🔁', friend: '🤝', system: '🔔' }
  },

  onLoad() {
    if (!requireRole('doctor')) return
  },

  onShow() {
    api.messageList().then((list) => {
      this.setData({
        list: list.map((m) => Object.assign({}, m, { timeText: fromNow(m.createdAt) }))
      })
    })
  },

  onReadAll() {
    api.messageRead({}).then(() => this.onShow())
  },

  onTap(e) {
    const item = this.data.list[e.currentTarget.dataset.index]
    if (!item.read) {
      api.messageRead({ messageId: item._id }).then(() => this.onShow())
    }
    if (item.type === 'referral' && item.refId) {
      wx.navigateTo({ url: `/pages/doctor/referral/detail/index?id=${item.refId}` })
    } else if (item.type === 'friend') {
      wx.switchTab({ url: '/pages/doctor/friends/list/index' })
    }
  }
})
