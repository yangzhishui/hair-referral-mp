const api = require('../../../utils/request')
const { DOCTOR_TITLES } = require('../../../config/index')
const app = getApp()

Page({
  data: {
    form: {
      name: '',
      title: '主治医师',
      licenseNo: '',
      hospitalId: '',
      department: '',
      specialties: '',
      projects: ''
    },
    hospitals: [],
    hospitalNames: [],
    hospitalIndex: 0,
    titleIndex: 2,
    certImages: [],
    auditStatus: '',
    submitting: false
  },

  onLoad() {
    const profile = app.globalData.profile || wx.getStorageSync('profile') || {}
    api.hospitalList().then((list) => {
      this.setData({
        hospitals: list,
        hospitalNames: list.map((h) => h.name)
      })
    })
    if (profile.doctor) {
      const d = profile.doctor
      const idx = this.data.hospitals.findIndex((h) => h._id === d.hospitalId)
      this.setData({
        auditStatus: d.auditStatus,
        form: {
          name: d.name || '',
          title: d.title || '主治医师',
          licenseNo: d.licenseNo || '',
          hospitalId: d.hospitalId || '',
          department: d.department || '',
          specialties: (d.specialties || []).join('、'),
          projects: (d.projects || []).join('、')
        }
      })
    }
  },

  onInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({ [`form.${field}`]: e.detail.value })
  },

  onTitleChange(e) {
    this.setData({
      titleIndex: e.detail.value,
      'form.title': DOCTOR_TITLES[e.detail.value]
    })
  },

  onHospitalChange(e) {
    const i = Number(e.detail.value)
    this.setData({
      hospitalIndex: i,
      'form.hospitalId': this.data.hospitals[i]._id
    })
  },

  onCertsChange(e) {
    this.setData({ certImages: e.detail.list })
  },

  onSubmit() {
    const f = this.data.form
    if (!f.name.trim()) return wx.showToast({ title: '请填写姓名', icon: 'none' })
    if (!f.licenseNo.trim()) return wx.showToast({ title: '请填写执业证号', icon: 'none' })
    if (!f.hospitalId) return wx.showToast({ title: '请选择所属医院', icon: 'none' })
    if (!this.data.certImages.length) return wx.showToast({ title: '请上传执业证照片', icon: 'none' })

    this.setData({ submitting: true })
    wx.showLoading({ title: '提交中', mask: true })
    api
      .submitVerify({
        name: f.name,
        title: f.title,
        licenseNo: f.licenseNo,
        hospitalId: f.hospitalId,
        department: f.department,
        specialties: f.specialties.split(/[、,，\s]+/).filter(Boolean),
        projects: f.projects.split(/[、,，\s]+/).filter(Boolean),
        certImages: this.data.certImages
      })
      .then((profile) => {
        app.globalData.profile = profile
        wx.setStorageSync('profile', profile)
        wx.hideLoading()
        wx.showModal({
          title: '提交成功',
          content: '资质已提交，管理员将在 1-2 个工作日内完成审核',
          showCancel: false,
          success: () => {
            const pages = getCurrentPages()
            if (pages.length > 1) wx.navigateBack()
            else wx.switchTab({ url: '/pages/doctor/mine/index' })
          }
        })
      })
      .catch(() => {
        wx.hideLoading()
        this.setData({ submitting: false })
      })
  }
})
