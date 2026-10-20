/**
 * 运行环境配置
 *
 * cloudEnv  : 微信云开发环境 ID，填写后走真实云函数；留空则自动使用本地 MOCK 数据
 * useMock   : 强制使用本地 MOCK 数据（方便无 AppID / 无云环境时预览全流程）
 * cloudFn   : 统一网关云函数名
 * aiApi     : 二期预留 —— AI 病历总结接口
 */
module.exports = {
  cloudEnv: '',
  useMock: true,
  cloudFn: 'api',
  aiApi: {
    enabled: false,
    url: ''
  }
}
