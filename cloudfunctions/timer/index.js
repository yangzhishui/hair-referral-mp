const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command
const DAY = 86400000

/**
 * 定时触发器（默认每小时执行一次）
 * 1. 72 小时无人接单 -> 自动取消并通知发起医生与患者
 * 2. 出诊前 3 天 / 前 1 天 -> 短信 + 小程序消息双重提醒接诊医生
 */
async function cancelExpired() {
  const now = Date.now()
  const res = await db
    .collection('referrals')
    .where({ status: 'pending', expireAt: _.lt(new Date(now).toISOString()) })
    .limit(100)
    .get()

  let count = 0
  for (const r of res.data) {
    const logs = (r.logs || []).concat([
      { action: '72 小时无人接单，系统自动取消', operator: '系统', at: new Date().toISOString() }
    ])
    await db.collection('referrals').doc(r._id).update({
      data: { status: 'cancelled', cancelReason: '72 小时无人接单，系统自动取消', logs }
    })

    const initiator = await db.collection('doctors').doc(r.initiatorId).get().catch(() => null)
    if (initiator && initiator.data) {
      await db.collection('messages').add({
        data: {
          userId: initiator.data.userId,
          type: 'referral',
          title: '转诊已自动取消',
          content: `您发起的转诊（${r.patientName}）超过 72 小时无人接单，已自动取消，可复制资料重新发起`,
          refId: r._id,
          read: false,
          createdAt: new Date().toISOString()
        }
      })
    }

    const patient = await db.collection('patients').doc(r.patientId).get().catch(() => null)
    if (patient && patient.data && patient.data.patientUserId) {
      await db.collection('messages').add({
        data: {
          userId: patient.data.patientUserId,
          type: 'referral',
          title: '转诊已取消',
          content: '本次转诊超过 72 小时无人接单，已自动取消，请联系您的主诊医生',
          refId: r._id,
          read: false,
          createdAt: new Date().toISOString()
        }
      })
    }
    count += 1
  }
  return count
}

async function remindVisits() {
  const doctors = (await db.collection('doctors').where({ auditStatus: 'approved' }).limit(100).get()).data
  let sent = 0

  for (const doctor of doctors) {
    if (!doctor.schedule || !doctor.schedule.length) continue

    // 待接诊患者数
    const pending = (
      await db
        .collection('referrals')
        .where({ acceptedBy: doctor._id, status: _.in(['accepted', 'in_progress']) })
        .limit(50)
        .get()
    ).data

    if (!pending.length) continue

    for (const s of doctor.schedule) {
      const visitTs = new Date(s.date).getTime()
      if (isNaN(visitTs)) continue
      const diffDays = Math.floor((visitTs - Date.now()) / DAY)

      for (const stage of [3, 1]) {
        if (diffDays !== stage) continue
        const key = `${doctor._id}_${s.date}_T-${stage}`
        const dup = await db.collection('sms_tasks').where({ taskKey: key }).limit(1).get()
        if (dup.data.length) continue

        const content = `【毛发医联体】您有 ${pending.length} 位待接诊患者，出诊日前 ${stage} 天提醒（${s.date} ${s.period}），请登录小程序查看。`
        await db.collection('sms_tasks').add({
          data: {
            taskKey: key,
            doctorId: doctor._id,
            phone: doctor.phone || '',
            visitDate: s.date,
            stage: `T-${stage}`,
            content,
            status: 'pending',
            createdAt: new Date().toISOString()
          }
        })
        await db.collection('messages').add({
          data: {
            userId: doctor.userId,
            type: 'system',
            title: `出诊提醒（前 ${stage} 天）`,
            content,
            refId: '',
            read: false,
            createdAt: new Date().toISOString()
          }
        })
        sent += 1
      }
    }
  }
  return sent
}

exports.main = async () => {
  try {
    const cancelled = await cancelExpired()
    const reminded = await remindVisits()
    return { code: 0, data: { cancelled, reminded, at: new Date().toISOString() } }
  } catch (err) {
    console.error('[timer] 执行失败', err)
    return { code: -1, msg: err.message }
  }
}
