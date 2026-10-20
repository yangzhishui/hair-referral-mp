const api = require('../../../../utils/request')
const { requireRole, setTabBar } = require('../../../../utils/guard')

Page({
  data: {
    keyword: '',
    results: [],
    friends: [],
    pending: []
  },

  onLoad() {
    if (!requireRole('doctor')) return
  },

  onShow() {
    setTabBar(this, 2)
    this.load()
  },

  load() {
    api.friendList().then((friends) => this.setData({ friends }))
    api.friendPending().then((pending) => this.setData({ pending }))
    if (this.data.keyword) this.search()
  },

  onInput(e) {
    this.setData({ keyword: e.detail.value }, () => this.search())
  },

  search() {
    api.doctor.search({ keyword: this.data.keyword }).then((results) => this.setData({ results }))
  },

  onApply(e) {
    const { id } = e.currentTarget.dataset
    api.friendApply({ doctorId: id }).then(() => {
      wx.showToast({ title: '申请已发送', icon: 'success' })
      this.load()
    })
  },

  onHandle(e) {
    const { id, accept } = e.currentTarget.dataset
    api.friendHandle({ requestId: id, accept: !!accept }).then(() => {
      wx.showToast({ title: accept ? '已通过' : '已拒绝', icon: 'success' })
      this.load()
    })
  }
})
