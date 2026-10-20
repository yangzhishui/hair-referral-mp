const api = require('../../../../utils/request')
const { requireRole } = require('../../../../utils/guard')
const { IMAGE_CATEGORIES } = require('../../../../config/index')
const { chooseImages, uploadFiles, preview } = require('../../../../utils/upload')
const { formatTime } = require('../../../../utils/util')

Page({
  data: {
    patientId: '',
    categories: [{ key: 'all', name: '全部' }].concat(IMAGE_CATEGORIES),
    active: 'all',
    images: [],
    viewList: [],
    compareMode: false,
    selected: [],
    comparePair: null
  },

  onLoad(query) {
    if (!requireRole('doctor')) return
    this.setData({ patientId: query.id })
    this.load()
  },

  load() {
    api.patientGet({ patientId: this.data.patientId }).then((res) => {
      this.setData({ images: res.patient.images || [] }, () => this.filter())
    })
  },

  filter() {
    const list = this.data.images
      .filter((i) => this.data.active === 'all' || i.category === this.data.active)
      .sort((a, b) => (a.takenAt < b.takenAt ? 1 : -1))
      .map((i) => Object.assign({}, i, { takenText: formatTime(i.takenAt, false) }))
    this.setData({ viewList: list })
  },

  switchCategory(e) {
    this.setData({ active: e.currentTarget.dataset.key }, () => this.filter())
  },

  async onAdd() {
    const category = this.data.active === 'all' ? 'scalp' : this.data.active
    try {
      const paths = await chooseImages(9)
      wx.showLoading({ title: '上传中', mask: true })
      const urls = await uploadFiles(paths, 'patient')
      const added = urls.map((url, i) => ({
        _id: `img_${Date.now()}_${i}`,
        category,
        name: (this.data.categories.find((c) => c.key === category) || {}).name || '临床影像',
        url,
        takenAt: new Date().toISOString(),
        uploadedBy: '本人'
      }))
      const images = this.data.images.concat(added)
      await api.patientSaveImages({ patientId: this.data.patientId, images })
      this.setData({ images }, () => this.filter())
      wx.hideLoading()
      wx.showToast({ title: `已上传 ${added.length} 张`, icon: 'success' })
    } catch (e) {
      wx.hideLoading()
    }
  },

  onRemove(e) {
    const { id } = e.currentTarget.dataset
    wx.showModal({
      title: '删除照片',
      content: '删除后不可恢复，确认删除？',
      success: (res) => {
        if (!res.confirm) return
        const images = this.data.images.filter((i) => i._id !== id)
        api.patientSaveImages({ patientId: this.data.patientId, images }).then(() => {
          this.setData({ images }, () => this.filter())
          wx.showToast({ title: '已删除', icon: 'success' })
        })
      }
    })
  },

  onPreview(e) {
    const { index } = e.currentTarget.dataset
    const urls = this.data.viewList.map((i) => i.url).filter(Boolean)
    preview(urls[index], urls)
  },

  toggleCompare() {
    this.setData({ compareMode: !this.data.compareMode, selected: [] })
  },

  toggleSelect(e) {
    const { id } = e.currentTarget.dataset
    const selected = this.data.selected.slice()
    const i = selected.indexOf(id)
    if (i > -1) selected.splice(i, 1)
    else {
      if (selected.length >= 2) return wx.showToast({ title: '最多选择 2 张对比', icon: 'none' })
      selected.push(id)
    }
    this.setData({ selected })
  },

  startCompare() {
    if (this.data.selected.length !== 2) return wx.showToast({ title: '请选择 2 张照片', icon: 'none' })
    const pair = this.data.selected.map((id) => this.data.images.find((i) => i._id === id))
    this.setData({ comparePair: pair })
  },

  closeCompare() {
    this.setData({ comparePair: null })
  },

  noop() {}
})
