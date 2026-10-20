const api = require('../../../../utils/request')
const { requireRole } = require('../../../../utils/guard')

Page({
  data: {
    hospital: null,
    canEdit: false,
    editing: false,
    adminTip: ''
  },

  onLoad() {
    if (!requireRole('doctor')) return
    this.load()
  },

  load() {
    api.hospitalGet({}).then((h) => {
      this.setData({
        hospital: h,
        canEdit: !!h.canEdit,
        adminTip: h.canEdit ? '您是该院管理员，可编辑全部医院资料' : '普通医生权限：仅查看，不可修改'
      })
      wx.setNavigationBarTitle({ title: h.name })
    })
  },

  toggleEdit() {
    if (!this.data.canEdit) return wx.showToast({ title: '仅医院管理员可编辑', icon: 'none' })
    this.setData({ editing: !this.data.editing })
  },

  onInput(e) {
    const { field, index, sub } = e.currentTarget.dataset
    if (index === undefined) {
      this.setData({ [`hospital.${field}`]: e.detail.value })
    } else {
      this.setData({ [`hospital.projects[${index}].${sub}`]: e.detail.value })
    }
  },

  addProject() {
    const list = (this.data.hospital.projects || []).slice()
    list.push({ name: '', desc: '', priceRange: '' })
    this.setData({ 'hospital.projects': list })
  },

  removeProject(e) {
    const list = this.data.hospital.projects.slice()
    list.splice(e.currentTarget.dataset.index, 1)
    this.setData({ 'hospital.projects': list })
  },

  onSave() {
    const h = this.data.hospital
    wx.showLoading({ title: '保存中', mask: true })
    api
      .hospitalUpdate({
        hospitalId: h._id,
        name: h.name,
        address: h.address,
        department: h.department,
        intro: h.intro,
        projects: h.projects,
        outpatientTime: h.outpatientTime,
        weekendTime: h.weekendTime
      })
      .then((res) => {
        wx.hideLoading()
        wx.showToast({ title: '已保存', icon: 'success' })
        this.setData({ editing: false })
        this.load()
      })
      .catch(() => wx.hideLoading())
  }
})
