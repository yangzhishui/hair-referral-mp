const api = require('../../../../utils/request')
const { requireRole, setTabBar } = require('../../../../utils/guard')
const { formatTime } = require('../../../../utils/util')

Page({
  data: {
    list: [],
    keyword: '',
    loading: true,
    pickMode: false
  },

  onLoad(query) {
    if (!requireRole('doctor')) return
    // pick=1：由发起转诊页进入，用于回选患者
    if (query.pick === '1') {
      this.setData({ pickMode: true })
      wx.setNavigationBarTitle({ title: '选择患者' })
    }
  },

  onShow() {
    if (this.data.pickMode) return
    setTabBar(this, 0)
    this.load()
  },

  load() {
    return api
      .patientList({ keyword: this.data.keyword })
      .then((list) => {
        this.setData({
          list: list.map((p) =>
            Object.assign({}, p, {
              createdAtText: formatTime(p.createdAt, false),
              lastReferralText: p.lastReferralAt ? formatTime(p.lastReferralAt, false) : '暂无'
            })
          ),
          loading: false
        })
      })
      .catch(() => this.setData({ loading: false }))
  },

  onSearch(e) {
    this.setData({ keyword: e.detail.value }, () => this.load())
  },

  onAdd() {
    wx.navigateTo({ url: '/pages/doctor/patients/edit/index?mode=new' })
  },

  onDetail(e) {
    const { id } = e.currentTarget.dataset
    if (this.data.pickMode) {
      wx.setStorageSync('pickPatientId', id)
      wx.navigateBack()
      return
    }
    wx.navigateTo({ url: `/pages/doctor/patients/detail/index?id=${id}` })
  }
})
