const DOCTOR_TABS = [
  { pagePath: 'pages/doctor/patients/list/index', text: '患者管理', icon: '👥' },
  { pagePath: 'pages/doctor/referral/list/index', text: '转诊', icon: '🔁' },
  { pagePath: 'pages/doctor/friends/list/index', text: '好友', icon: '🤝' },
  { pagePath: 'pages/doctor/mine/index', text: '我的', icon: '👤' }
]

const PATIENT_TABS = [
  { pagePath: 'pages/patient/home/index', text: '我的转诊', icon: '📋' },
  { pagePath: 'pages/patient/mine/index', text: '我的', icon: '👤' }
]

Component({
  data: {
    tabs: DOCTOR_TABS,
    selected: 0,
    color: '#8a9099',
    selectedColor: '#12a89c'
  },

  lifetimes: {
    attached() {
      const app = getApp()
      const role = (app && app.globalData.role) || wx.getStorageSync('role') || 'doctor'
      const tabs = role === 'patient' ? PATIENT_TABS : DOCTOR_TABS
      const pages = getCurrentPages()
      const current = pages.length ? pages[pages.length - 1].route : ''
      const idx = tabs.findIndex((t) => t.pagePath === current)
      this.setData({ tabs, selected: idx < 0 ? 0 : idx })
    }
  },

  methods: {
    switchTab(e) {
      const { index, path } = e.currentTarget.dataset
      this.setData({ selected: index })
      wx.switchTab({ url: '/' + path })
    }
  }
})
