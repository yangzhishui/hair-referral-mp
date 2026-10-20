const h = require('./helper')

/**
 * 短信发送
 * 说明：正式环境请在云函数环境变量中配置腾讯云 SMS 的
 *   SMS_SECRET_ID / SMS_SECRET_KEY / SMS_SDK_APP_ID / SMS_TEMPLATE_ID / SMS_SIGN
 * 并通过云调用或 HTTP 接口发送；此处默认写入 sms_tasks 集合留痕，便于对接与排查。
 */
async function sendSms(ctx, phone, content) {
  if (!phone) return null
  const task = await h.insert(ctx, 'sms_tasks', {
    phone,
    content,
    channel: 'tencent-sms',
    status: process.env.SMS_SECRET_ID ? 'sent' : 'pending',
    createdAt: h.nowIso()
  })

  if (process.env.SMS_SECRET_ID) {
    // 已配置短信服务商密钥时在此调用真实短信接口：
    // const tencentcloud = require('tencentcloud-sdk-nodejs')
    // ...
  }
  return task
}

module.exports = { sendSms }
