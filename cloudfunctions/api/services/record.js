const h = require('./helper')

exports.list = async (ctx, payload = {}) => h.list(ctx, 'records', { patientId: payload.patientId })

/** 保存草稿（锁定后不可修改） */
exports.save = async (ctx, payload = {}) => {
  const me = await h.requireDoctor(ctx)
  const rows = await h.list(ctx, 'records', { patientId: payload.patientId })
  const draft = rows.find((r) => !r.locked)
  const fields = payload.fields || {}

  if (draft) {
    return h.update(ctx, 'records', draft._id, fields)
  }
  return h.insert(ctx, 'records', Object.assign({}, fields, {
    patientId: payload.patientId,
    doctorId: me._id,
    doctorName: me.name,
    locked: false,
    confirmedAt: ''
  }))
}

/** 确认病历 -> 自动锁定，医患双方不可修改 */
exports.confirm = async (ctx, payload = {}) => {
  const me = await h.requireDoctor(ctx)
  const record = await h.findOne(ctx, 'records', { _id: payload.recordId })
  if (!record) throw new Error('病历不存在')
  if (record.locked) throw new Error('病历已锁定，不可修改')
  if (record.doctorId !== me._id) throw new Error('仅创建医生可确认病历')

  const updated = await h.update(ctx, 'records', record._id, {
    locked: true,
    confirmedAt: h.nowIso()
  })

  const patient = await h.findOne(ctx, 'patients', { _id: record.patientId })
  if (patient && patient.patientUserId) {
    await h.pushMessage(ctx, patient.patientUserId, {
      type: 'record',
      title: '病历已生成',
      content: `${me.name}医生已为您创建病历，可在个人中心查看`,
      refId: record._id
    })
  }
  return updated
}
