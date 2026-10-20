const { chooseImages, uploadFiles, preview } = require('../../utils/upload')

Component({
  properties: {
    list: { type: Array, value: [] },
    max: { type: Number, value: 9 },
    dir: { type: String, value: 'hair' },
    disabled: { type: Boolean, value: false }
  },

  data: {
    items: []
  },

  observers: {
    'list': function (list) {
      this.setData({ items: list || [] })
    }
  },

  methods: {
    async onAdd() {
      if (this.data.disabled) return
      const rest = this.data.max - this.data.items.length
      if (rest <= 0) {
        wx.showToast({ title: `最多上传 ${this.data.max} 张`, icon: 'none' })
        return
      }
      try {
        const paths = await chooseImages(rest)
        wx.showLoading({ title: '上传中', mask: true })
        const urls = await uploadFiles(paths, this.data.dir)
        const items = this.data.items.concat(
          urls.map((url, i) => ({
            url,
            local: paths[i],
            takenAt: new Date().toISOString()
          }))
        )
        this.setData({ items })
        this.triggerEvent('change', { list: items })
      } catch (e) {
        wx.showToast({ title: '已取消', icon: 'none' })
      } finally {
        wx.hideLoading()
      }
    },

    onPreview(e) {
      const { index } = e.currentTarget.dataset
      const urls = this.data.items.map((i) => i.url || i.local).filter(Boolean)
      preview(urls[index], urls)
    },

    onRemove(e) {
      const { index } = e.currentTarget.dataset
      const items = this.data.items.slice()
      items.splice(index, 1)
      this.setData({ items })
      this.triggerEvent('change', { list: items })
    }
  }
})
