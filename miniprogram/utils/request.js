const ENV = require('../config/env')
const mockRouter = require('../mock/index')

function useMock() {
  return ENV.useMock || !ENV.cloudEnv || !wx.cloud
}

/**
 * 统一请求入口
 * @param {string} action  形如 'patient.list'
 * @param {object} payload
 * @returns Promise<data>
 */
function call(action, payload = {}, opts = {}) {
  const silent = opts.silent
  if (useMock()) {
    return mockRouter(action, payload).then((res) => {
      if (res.code !== 0) {
        if (!silent) wx.showToast({ title: res.msg || '请求失败', icon: 'none' })
        return Promise.reject(new Error(res.msg))
      }
      return res.data
    })
  }

  return wx.cloud
    .callFunction({
      name: ENV.cloudFn,
      data: { action, payload }
    })
    .then((res) => {
      const result = res.result || {}
      if (result.code !== 0) {
        if (!silent) wx.showToast({ title: result.msg || '请求失败', icon: 'none' })
        return Promise.reject(new Error(result.msg))
      }
      return result.data
    })
    .catch((err) => {
      if (!silent) wx.showToast({ title: err.message || '网络异常', icon: 'none' })
      return Promise.reject(err)
    })
}

const api = {
  call,
  // 认证
  login: (payload) => call('auth.login', payload),
  bindPhone: (payload) => call('auth.bindPhone', payload),
  myProfile: () => call('auth.profile'),
  updateProfile: (payload) => call('auth.updateProfile', payload),
  submitVerify: (payload) => call('auth.submitVerify', payload),

  // 医生 / 医院
  searchDoctors: (payload) => call('doctor.search', payload),
  doctorProfile: (payload) => call('doctor.profile', payload),
  hospitalGet: (payload) => call('hospital.get', payload),
  hospitalUpdate: (payload) => call('hospital.update', payload),
  hospitalList: (payload) => call('hospital.list', payload),

  // 患者
  patientList: (payload) => call('patient.list', payload),
  patientGet: (payload) => call('patient.get', payload),
  patientCreate: (payload) => call('patient.create', payload),
  patientUpdate: (payload) => call('patient.update', payload),
  patientSaveImages: (payload) => call('patient.saveImages', payload),

  // 病历
  recordSave: (payload) => call('record.save', payload),
  recordConfirm: (payload) => call('record.confirm', payload),
  recordList: (payload) => call('record.list', payload),

  // 转诊
  referralCreate: (payload) => call('referral.create', payload),
  referralList: (payload) => call('referral.list', payload),
  referralGet: (payload) => call('referral.get', payload),
  referralAccept: (payload) => call('referral.accept', payload),
  referralClose: (payload) => call('referral.close', payload),
  referralCancel: (payload) => call('referral.cancel', payload),

  // 好友
  friendList: () => call('friend.list'),
  friendPending: () => call('friend.pending'),
  friendApply: (payload) => call('friend.apply', payload),
  friendHandle: (payload) => call('friend.handle', payload),

  // 消息 / 统计 / 系统
  messageList: () => call('message.list'),
  messageRead: (payload) => call('message.read', payload),
  myStats: () => call('stats.mine'),
  resetDemo: () => call('system.reset')
}

module.exports = api
