const api = require('../../../../utils/request')
const { requireRole } = require('../../../../utils/guard')
const { RECORD_FIELDS } = require('../../../../config/index')
const ENV = require('../../../../config/env')

Page({
  data: {
    patientId: '',
    recordId: '',
    fields: RECORD_FIELDS,
    values: {},
    locked: false,
    aiEnabled: ENV.aiApi.enabled
  },

  onLoad(query) {
    if (!requireRole('doctor')) return
    this.setData({ patientId: query.patientId, recordId: query.recordId || '' })
  },

  onShow() {
    api.recordList({ patientId: this.data.patientId }).then((list) => {
      let rec = null
      if (this.data.recordId) rec = list.find((r) => r._id === this.data.recordId)
      if (!rec) rec = list.find((r) => !r.locked)
      if (!rec) rec = list[0]
      this.setData({
        recordId: rec ? rec._id : '',
        locked: rec ? !!rec.locked : false,
        values: rec || {}
      })
    })
  },

  onInput(e) {
    this.setData({ [`values.${e.currentTarget.dataset.field}`]: e.detail.value })
  },

  onSave() {
    if (this.data.locked) return wx.showToast({ title: '病历已锁定，不可修改', icon: 'none' })
    const payload = {}
    this.data.fields.forEach((f) => (payload[f.key] = this.data.values[f.key] || ''))
    wx.showLoading({ title: '保存中', mask: true })
    api
      .recordSave({ patientId: this.data.patientId, fields: payload })
      .then((rec) => {
        wx.hideLoading()
        wx.showToast({ title: '已保存（草稿）', icon: 'success' })
        this.setData({ recordId: rec._id })
      })
      .catch(() => wx.hideLoading())
  },

  onConfirm() {
    if (!this.data.recordId) return wx.showToast({ title: '请先保存病历', icon: 'none' })
    wx.showModal({
      title: '确认病历',
      content: '确认后该条病历将自动锁定，医患双方均不可修改，是否继续？',
      success: (res) => {
        if (!res.confirm) return
        wx.showLoading({ title: '处理中', mask: true })
        api
          .recordConfirm({ recordId: this.data.recordId })
          .then(() => {
            wx.hideLoading()
            wx.showToast({ title: '病历已锁定', icon: 'success' })
            this.setData({ locked: true })
          })
          .catch(() => wx.hideLoading())
      }
    })
  }
})
