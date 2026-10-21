# 毛发专病医联体全国转诊小程序

微信小程序（**医生端 + 患者端双端**）· 微信原生框架 + 微信云开发（云函数 + 云数据库 + 云存储）

> 对应需求：《毛发专病医联体全国转诊小程序业务需求文档》
> 核心模式：医生实名认证入驻 → 挂靠医院 → 展示项目与价格 → 多医生抢单转诊 + 好友定向转诊

---

## 一、功能地图

### 通用（双端统一）
- 微信一键授权登录、手机号绑定、账号唯一（openid 为准）
- 图片：拍照 / 相册、批量上传、单张删除、大图预览、压缩存储（云存储）
- 转诊状态双端实时同步；全流程操作留痕（创建时间、操作人、操作记录）
- 消息体系：小程序订阅消息 / 系统消息中心 / 短信提醒
- 预留 AI 病历总结 API（`miniprogram/config/env.js` 的 `aiApi`）

### 医生端（底部四大菜单，自定义 tabBar）
| 菜单 | 页面 | 说明 |
| --- | --- | --- |
| 患者管理 | `pages/doctor/patients/list` | 列表 + 姓名/手机号搜索；字段含建档时间、最近转诊时间 |
| | `pages/doctor/patients/detail` | 三模块档案：基本信息 / 毛发影像 / 格式化病历 + 转诊记录 |
| | `pages/doctor/patients/edit` | 基本信息录入、脱发类型标签 |
| | `pages/doctor/patients/record` | 标准化病历模板；**确认后自动锁定**，医患双方不可改 |
| | `pages/doctor/patients/gallery` | 影像分类存档（头皮全景/发际线/头顶/皮肤镜/报告/化验单/处方），支持对比 |
| 转诊 | `pages/doctor/referral/list` | 四 Tab：我发起 / 待抢单 / 我接诊 / 历史记录 |
| | `pages/doctor/referral/create` | 6 步：选患者 → 自动带入资料 → 转诊目的 → 维度筛选（地区/项目/医生）→ 公开抢单 or 好友定向 → 提交 |
| | `pages/doctor/referral/detail` | 查看完整资料、立即接单、取消、一键复制重发 |
| | `pages/doctor/referral/close` | 上传诊疗照片 / 医嘱 / 诊疗小结 → 转诊结案 |
| 好友 | `pages/doctor/friends/list` | 搜索医生（姓名/医院）、申请列表、好友列表、待通过状态 |
| 我的 | `pages/doctor/mine/index` | 医生资料、未来 3 天可预约时段、审核状态、积分与转诊统计 |
| | `pages/doctor/mine/edit` | 修改资料 / 修改密码 / 排班 |
| | `pages/doctor/mine/hospital` | 医院信息（普通医生只读，管理员可编辑项目与价格） |
| | `pages/doctor/mine/messages` | 消息中心（转诊通知 / 系统通知 / 好友申请） |
| | `pages/auth/verify` | 身份资质核验（执业证上传、审核进度） |

### 患者端
- `pages/patient/home`：本人全部转诊记录与实时状态
- `pages/patient/referral/detail`：转诊目的与说明、医生上传的全部影像、锁定病历、诊疗小结与医嘱
- `pages/patient/mine`：基础信息自主维护（实时双向同步医生端）、影像与病历查看、消息提醒

### 核心业务规则（服务端强校验）
- 无驳回机制：不想接单无需操作
- 抢单唯一：一单仅一人接单，接单即锁定
- 72 小时无人接单自动作废（`timer` 云函数），支持一键复制资料重发
- 病历双端同步：医生端录入/修改 → 患者端实时更新；确认后锁定
- **医院项目与价格仅医生端可见，患者端隐藏**
- 好友定向转诊优先级高于公开抢单，且触发短信提醒

---

## 二、目录结构

```
hair-referral-mp
├── miniprogram/                  # 小程序前端
│   ├── app.js / app.json / app.wxss
│   ├── config/                   # env.js（环境开关）、index.js（业务字典）
│   ├── utils/                    # request（统一请求）、upload、guard、util
│   ├── components/               # empty、img-uploader
│   ├── custom-tab-bar/           # 双端动态 tabBar
│   ├── mock/                     # 本地演示数据（无云环境也能跑通全流程）
│   └── pages/
│       ├── entry/ auth/          # 双端入口、登录、资质核验
│       ├── doctor/               # 医生端
│       └── patient/              # 患者端
└── cloudfunctions/
    ├── api/                      # 统一网关云函数（auth/patient/referral/friend...）
    └── timer/                    # 定时任务：72 小时超时取消 + 出诊前 3/1 天短信提醒
```

---

## 三、快速开始

### A. 无 AppID / 无云环境「先看效果」（推荐先跑通）
项目默认 `miniprogram/config/env.js` 中 `cloudEnv: ''`、`useMock: true`，
内置 3 家医院、5 位医生、4 位患者、7 张转诊单、好友与消息数据。

1. 微信开发者工具 → 导入项目 → 目录选择本仓库根目录 → AppID 选「测试号」
2. 直接编译：入口页可选「医生端 / 患者端」→ 一键登录即可点通全流程

> MOCK 数据保存在 Storage，可在「我的 → 退出登录」或清除缓存后重置。

### B. 接入真实云开发
1. 微信公众平台申请小程序 AppID，开通「云开发」，复制**环境 ID**
2. 修改 `project.config.json` 的 `appid`
3. 修改 `miniprogram/config/env.js`：
   ```js
   module.exports = { cloudEnv: '你的环境ID', useMock: false, cloudFn: 'api', aiApi: { enabled: false, url: '' } }
   ```
4. 右键 `cloudfunctions/api` → 「上传并部署：云端安装依赖」；`cloudfunctions/timer` 同样操作
5. 云数据库新建集合（见第四节），权限建议设为「仅创建者可读写」或「自定义安全规则」
6. 初始化演示医院：在云开发控制台调用云函数 `api`，参数 `{"action":"system.seed"}`
7. 定时触发器：`timer` 上传后，在云开发「定时触发器」中确认 `0 30 * * * * *`（每小时第 30 分）已生效

### C. 图片上传
- MOCK 模式：使用本地临时路径，仅当前会话可见
- 云开发模式：`utils/upload.js` 自动上传到云存储目录 `hair/`、`patient/`、`cert/`、`treatment/`

---

## 四、云数据库集合

| 集合 | 说明 | 主要字段 |
| --- | --- | --- |
| `users` | 统一账号 | openid、role(doctor/patient)、phone、doctorId、patientId |
| `doctors` | 医生资料 | name、title、licenseNo、hospitalId、department、specialties、projects、schedule、auditStatus、points、isAdmin |
| `hospitals` | 医院 | name、address、department、intro、projects[{name,desc,priceRange}]、outpatientTime、weekendTime、region |
| `patients` | 患者档案 | creatorDoctorId、name、gender、age、phone、pastHistory、allergy、chiefComplaint、diagnosisTags、images、patientUserId |
| `records` | 格式化病历 | patientId、doctorId、locked、confirmedAt、chiefComplaint…advice |
| `referrals` | 转诊单 | patientSnapshot、purpose、targetType(public/friend)、targetHospitalIds、targetDoctorIds、status、acceptedBy、expireAt、logs、treatment |
| `friends` | 好友关系 | doctorId、friendId、status(pending/accepted) |
| `messages` | 消息中心 | userId、type、title、content、refId、read |
| `sms_tasks` | 短信留痕 | phone、content、stage、status、taskKey |

**建议索引**：`users.openid`、`doctors.userId`、`patients.creatorDoctorId`、`referrals.initiatorId`、`referrals.status`、`referrals.acceptedBy`、`friends.doctorId+status`、`messages.userId`

**转诊单状态机**：`pending → accepted → in_progress → closed`，或 `pending → cancelled`（72h 超时 / 主动取消）

---

## 五、短信提醒

- 定向转诊：发起时立即推送（写入 `sms_tasks`）
- 出诊提醒：`timer` 扫描医生 `schedule`，出诊前 3 天、前 1 天分别触发，已用 `taskKey` 去重
- 接入真实通道：在云函数 `api` / `timer` 的环境变量配置
  `SMS_SECRET_ID / SMS_SECRET_KEY / SMS_SDK_APP_ID / SMS_TEMPLATE_ID / SMS_SIGN`，
  并在 `cloudfunctions/api/services/sms.js` 中替换为你使用的短信 SDK（默认仅写库留痕）

---

## 六、接口一览（云函数 `api`）

调用方式：`wx.cloud.callFunction({ name: 'api', data: { action, payload } })`

```
auth.login / auth.profile / auth.bindPhone / auth.updateProfile / auth.submitVerify
doctor.search / doctor.profile
hospital.list / hospital.get / hospital.update
patient.list / patient.get / patient.create / patient.update / patient.saveImages
record.list / record.save / record.confirm
referral.create / referral.list(tab=mine|pool|accepted|history) / referral.get
referral.accept / referral.close / referral.cancel
friend.list / friend.pending / friend.apply / friend.handle
message.list / message.read
stats.mine / system.seed
```

前端已封装在 `miniprogram/utils/request.js`，页面直接 `api.xxx()` 调用，MOCK 与云函数自动切换。

---

## 七、二期预留

AI 病历总结（`config/env.js` 的 `aiApi`）、医生积分排行榜、患者随访、院内排班精细化管理、
转诊数据报表、患者评价体系 —— 均已在目录与配置中留出入口。

## 八、提交到 GitHub

1. 在 GitHub 网页端新建一个**空仓库**（不要勾选 README / .gitignore / License），例如 `hair-referral-mp`
2. 在本机执行（SSH 方式需已把公钥添加到 GitHub）：

```bash
cd hair-referral-mp
chmod +x scripts/push-to-github.sh
./scripts/push-to-github.sh <你的GitHub用户名> hair-referral-mp ssh
# 若使用 HTTPS：./scripts/push-to-github.sh <用户名> hair-referral-mp https
```

脚本会完成 `git init` → `git add -A` → 首次提交 → 绑定 remote → `git push -u origin main`。
也可以在微信开发者工具「版本管理」面板中直接初始化并推送。

## 九、许可证

MIT

---

## 十、交付文档清单

文档统一放在 `docs/` 目录，共 15 份，均为可编辑的 Word 文件（A4，含封面、页眉页脚与签署栏）。

### 01-商务（对外商务与合同）
| 文件 | 用途 |
| --- | --- |
| `01-项目报价函.docx` | 首次谈判报价：范围、开发费、云资源年费、维护费三档、付款节点、不含项 |
| `02-需求规格说明书（功能清单确认表）.docx` | **验收基线**：术语、角色权限、F01–F34 功能清单（优先级 + 验收标准），需双方签字 |
| `03-技术服务合同（模板）.docx` | 标的、金额、支付、交付验收、知产、保密、数据合规、违约、争议解决 |
| `04-保密协议（模板）.docx` | 商业秘密与患者数据的保密范围、义务、例外、期限 |
| `05-个人信息处理协议（模板）.docx` | 控制者 / 受托处理者角色、处理目的与范围、安全措施、留存与删除、事件通知 |

### 02-技术（设计与交付）
| 文件 | 用途 |
| --- | --- |
| `01-技术方案说明书.docx` | 架构分层、技术选型、双端 tabBar 方案、鉴权设计、状态机、目录结构、容量估算 |
| `02-数据库设计说明书.docx` | 9 张集合字段设计、索引建议、安全规则建议、初始化步骤 |
| `03-接口文档（云函数 api）.docx` | 20+ 接口的 action / payload / 返回说明 |
| `04-部署与运维手册.docx` | 部署 10 步、环境变量、定时触发器、监控备份、故障排查表、应急响应 |
| `05-测试用例与缺陷报告（模板）.docx` | 20 条核心用例 + 缺陷报告表 + 测试结论 |

### 03-交付（培训与验收）
| 文件 | 用途 |
| --- | --- |
| `01-小程序使用手册（医生端+患者端）.docx` | 逐菜单操作说明 + 常见问题 |
| `02-上线检查与资质清单.docx` | 12 项上线检查 + 9 类资质材料清单 |
| `03-交付确认单.docx` | 交付物逐项确认与签署 |

### 04-合规（医疗行业专项）
| 文件 | 用途 |
| --- | --- |
| `01-医疗行业合规与风险清单.docx` | 10 类风险（等级 / 责任方 / 处理建议）+ 落地检查表 + 责任边界条款建议 |
| `02-患者知情同意书与隐私政策（模板）.docx` | 知情同意书与隐私政策通用文本，需甲方法务审核后使用 |
