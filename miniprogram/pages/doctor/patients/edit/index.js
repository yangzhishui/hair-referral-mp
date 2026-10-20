const api = require('../../../../utils/request')
const { requireRole } = require('../../../../utils/guard')
const { DIAGNOSIS_TAGS } = require('../../../../config/index')

Page({
  data: {
    mode: 'new',
    patientId: '',
    genders: ['男', '女'],
    tags: DIAGNOSIS_TAGS,
    form: {
      name: '',
      gender: '男',
      age: '',
      phone: '',
      pastHistory: '',
      allergy: '',
      chiefComplaint: '',
      diagnosisTags: []
    },
    saving: false
  },

  onLoad(query) {
    if (!requireRole('doctor')) return
    this.setData({ mode: query.mode || 'edit', patientId: query.id || '' })
    wx.setNavigationBarTitle({ title: this.data.mode === 'new' ? '新建患者档案' : '编辑基本信息' })
    if (this.data.mode === 'edit' && this.data.patientId) {
      api.patientGet({ patientId: this.data.patientId }).then((res) => {
        const p = res.patient
        this.setData({
          form: {
            name: p.name || '',
            gender: p.gender || '男',
            age: p.age || '',
            phone: p.phone || '',
            pastHistory: p.pastHistory || '',
            allergy: p.allergy || '',
            chiefComplaint: p.chiefComplaint || '',
            diagnosisTags: p.diagnosisTags || []
          }
        })
      })
    }
  },

  onInput(e) {
    this.setData({ [`form.${e.currentTarget.dataset.field}`]: e.detail.value })
  },

  onGender(e) {
    this.setData({ 'form.gender': this.data.genders[e.detail.value] })
  },

  toggleTag(e) {
    const tag = e.currentTarget.dataset.tag
    const list = this.data.form.diagnosisTags.slice()
    const i = list.indexOf(tag)
    if (i > -1) list.splice(i, 1)
    else list.push(tag)
    this.setData({ 'form.diagnosisTags': list })
  },

  onSave() {
    const f = this.data.form
    if (!f.name.trim()) return wx.showToast({ title: '请填写患者姓名', icon: 'none' })
    if (!/^1\d{10}$/.test(f.phone)) return wx.showToast({ title: '请填写正确的手机号', icon: 'none' })
    this.setData({ saving: true })
    wx.showLoading({ title: '保存中', mask: true })
    const req =
      this.data.mode === 'new'
        ? api.patientCreate(f)
        : api.patientUpdate({ patientId: this.data.patientId, patch: f })
    req
      .then(() => {
        wx.hideLoading()
        wx.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 500)
      })
      .catch(() => {
        wx.hideLoading()
        this.setData({ saving: false })
      })
  }
})
