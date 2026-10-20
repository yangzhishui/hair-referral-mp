const ENV = require('../config/env')

function isMock() {
  return ENV.useMock || !ENV.cloudEnv || !wx.cloud
}

/** 选择图片（拍照 / 相册，支持批量） */
function chooseImages(count = 9) {
  return new Promise((resolve, reject) => {
    wx.chooseMedia({
      count,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => resolve((res.tempFiles || []).map((f) => f.tempFilePath)),
      fail: reject
    })
  })
}

/** 上传单张图片到云存储，返回 fileID（MOCK 模式直接返回本地临时路径） */
async function uploadFile(filePath, dir = 'hair') {
  if (isMock()) return filePath
  const ext = (filePath.split('.').pop() || 'png').toLowerCase()
  const cloudPath = `${dir}/${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${ext}`
  const res = await wx.cloud.uploadFile({ cloudPath, filePath })
  return res.fileID
}

/** 批量上传 */
async function uploadFiles(paths = [], dir) {
  const out = []
  for (const p of paths) {
    out.push(await uploadFile(p, dir))
  }
  return out
}

/** 预览大图 */
function preview(current, urls = []) {
  const list = urls.filter(Boolean)
  if (!list.length) return
  wx.previewImage({ current, urls: list })
}

module.exports = { chooseImages, uploadFile, uploadFiles, preview, isMock }
