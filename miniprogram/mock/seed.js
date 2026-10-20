const HOUR = 3600000
const DAY = 86400000

const now = Date.now()
const t = (ms) => new Date(now - ms).toISOString()

function img(category, name, daysAgo) {
  return {
    _id: `img_${category}_${daysAgo}_${Math.random().toString(36).slice(2, 7)}`,
    category,
    name,
    url: '',
    takenAt: t(daysAgo * DAY),
    uploadedBy: '张明'
  }
}

const hospitals = [
  {
    _id: 'hosp_1',
    name: '北京毛发医学中心',
    address: '北京市朝阳区建国路 88 号',
    department: '毛发专病中心 / 皮肤科',
    intro:
      '北京毛发医学中心是医联体核心单位，集毛发疾病诊断、药物治疗、植发手术、头皮微生态治疗于一体，年门诊量逾 10 万人次，承担全国毛发专病疑难病例会诊工作。',
    projects: [
      { name: 'FUE 毛囊单位提取植发', desc: '单株提取，自然发际线设计，术后 7 天恢复', priceRange: '15000 - 40000 元' },
      { name: '药物治疗方案（内服 + 外用）', desc: '非那雄胺 / 米诺地尔规范化用药管理', priceRange: '800 - 3000 元 / 疗程' },
      { name: 'CGF 浓缩生长因子治疗', desc: '自体血液提取生长因子头皮注射，每月 1 次', priceRange: '3000 - 8000 元 / 次' },
      { name: '头皮微生态治疗', desc: '头皮菌群检测 + 定制护理方案', priceRange: '1200 - 3600 元 / 疗程' }
    ],
    outpatientTime: '周一至周五 08:30 - 17:30',
    weekendTime: '周六 09:00 - 16:00（周日休诊）',
    region: { province: '北京市', city: '北京市', district: '朝阳区' },
    adminDoctorId: 'doc_1'
  },
  {
    _id: 'hosp_2',
    name: '上海皮肤与毛发专科医院',
    address: '上海市徐汇区宛平南路 600 号',
    department: '皮肤科 / 毛发移植中心',
    intro:
      '华东地区毛发专病诊疗中心，擅长斑秃免疫干预、瘢痕性脱发修复及 SMP 头皮文饰，承担多项国家级毛发疾病临床研究。',
    projects: [
      { name: '斑秃专项免疫干预', desc: 'JAK 抑制剂 + 局部免疫治疗联合方案', priceRange: '5000 - 18000 元 / 疗程' },
      { name: 'SMP 头皮微色素文饰', desc: '仿真毛囊点阵文饰，遮盖稀疏区域', priceRange: '5000 - 15000 元' },
      { name: '疑难病例多学科会诊', desc: '三位以上副高专家联合会诊', priceRange: '2000 - 5000 元 / 次' }
    ],
    outpatientTime: '周一至周六 08:00 - 17:00',
    weekendTime: '周日 09:00 - 12:00',
    region: { province: '上海市', city: '上海市', district: '徐汇区' },
    adminDoctorId: 'doc_2'
  },
  {
    _id: 'hosp_3',
    name: '广州毛发专科医院',
    address: '广东省广州市天河区天河路 218 号',
    department: '毛发外科 / 植发中心',
    intro: '华南地区植发手术量领先单位，配备百级层流手术室，开展大面积植发修复与疑难手术转诊。',
    projects: [
      { name: '大面积植发修复', desc: '单次 4000 单位以上，适用于重度雄秃', priceRange: '30000 - 80000 元' },
      { name: '药物治疗方案', desc: '规范化用药与随访管理', priceRange: '600 - 2600 元 / 疗程' }
    ],
    outpatientTime: '周一至周日 09:00 - 18:00',
    weekendTime: '周末正常门诊',
    region: { province: '广东省', city: '广州市', district: '天河区' },
    adminDoctorId: 'doc_3'
  }
]

const doctors = [
  {
    _id: 'doc_1',
    userId: 'user_doc_1',
    name: '张明',
    avatar: '',
    title: '主任医师',
    licenseNo: '110120261001',
    phone: '13800001001',
    hospitalId: 'hosp_1',
    hospitalName: '北京毛发医学中心',
    department: '毛发专病中心',
    specialties: ['雄激素性脱发', '瘢痕性脱发'],
    projects: ['FUE 植发', '药物治疗', 'CGF 治疗'],
    schedule: [
      { date: new Date(now + 3 * DAY).toISOString().slice(0, 10), period: '上午 08:30 - 12:00' },
      { date: new Date(now + 3 * DAY).toISOString().slice(0, 10), period: '下午 13:30 - 17:30' },
      { date: new Date(now + 5 * DAY).toISOString().slice(0, 10), period: '上午 08:30 - 12:00' }
    ],
    auditStatus: 'approved',
    points: 1280,
    stats: { initiated: 12, accepted: 8, closed: 7, closeRate: '88%' },
    isAdmin: true
  },
  {
    _id: 'doc_2',
    userId: 'user_doc_2',
    name: '李慧',
    avatar: '',
    title: '副主任医师',
    licenseNo: '110120261002',
    phone: '13800001002',
    hospitalId: 'hosp_2',
    hospitalName: '上海皮肤与毛发专科医院',
    department: '皮肤科',
    specialties: ['斑秃', '头皮炎症'],
    projects: ['斑秃专项干预', 'SMP 文饰'],
    schedule: [{ date: new Date(now + 2 * DAY).toISOString().slice(0, 10), period: '上午 09:00 - 12:00' }],
    auditStatus: 'approved',
    points: 860,
    stats: { initiated: 9, accepted: 6, closed: 5, closeRate: '83%' },
    isAdmin: true
  },
  {
    _id: 'doc_3',
    userId: 'user_doc_3',
    name: '王强',
    avatar: '',
    title: '主治医师',
    licenseNo: '110120261003',
    phone: '13800001003',
    hospitalId: 'hosp_3',
    hospitalName: '广州毛发专科医院',
    department: '毛发外科',
    specialties: ['植发手术', '大面积修复'],
    projects: ['大面积植发修复', '药物治疗'],
    schedule: [{ date: new Date(now + 4 * DAY).toISOString().slice(0, 10), period: '全天 09:00 - 18:00' }],
    auditStatus: 'approved',
    points: 540,
    stats: { initiated: 5, accepted: 4, closed: 3, closeRate: '75%' },
    isAdmin: true
  },
  {
    _id: 'doc_4',
    userId: 'user_doc_4',
    name: '陈静',
    avatar: '',
    title: '主治医师',
    licenseNo: '110120261004',
    phone: '13800001004',
    hospitalId: 'hosp_1',
    hospitalName: '北京毛发医学中心',
    department: '毛发专病中心',
    specialties: ['休止期脱发', '产后脱发'],
    projects: ['头皮微生态治疗'],
    schedule: [],
    auditStatus: 'approved',
    points: 320,
    stats: { initiated: 3, accepted: 2, closed: 2, closeRate: '100%' },
    isAdmin: false
  },
  {
    _id: 'doc_5',
    userId: 'user_doc_5',
    name: '刘洋',
    avatar: '',
    title: '副主任医师',
    licenseNo: '110120261005',
    phone: '13800001005',
    hospitalId: 'hosp_2',
    hospitalName: '上海皮肤与毛发专科医院',
    department: '皮肤科',
    specialties: ['疑难病例会诊'],
    projects: ['疑难病例多学科会诊'],
    schedule: [],
    auditStatus: 'pending',
    points: 60,
    stats: { initiated: 0, accepted: 0, closed: 0, closeRate: '-' },
    isAdmin: false
  }
]

const patients = [
  {
    _id: 'pat_1',
    patientUserId: 'user_pat_1',
    creatorDoctorId: 'doc_1',
    creatorName: '张明',
    name: '王建国',
    gender: '男',
    age: 38,
    phone: '13820192019',
    pastHistory: '高血压 2 年，规律服药',
    allergy: '青霉素过敏',
    chiefComplaint: '头顶稀疏 3 年，近半年加重',
    diagnosisTags: ['雄激素性脱发'],
    images: [
      img('scalp', '头皮全景照', 60),
      img('vertex', '头顶稀疏照', 60),
      img('hairline', '发际线照片', 30),
      img('dermoscopy', '皮肤镜检查', 30),
      img('report', '检查报告', 10)
    ],
    createdAt: t(60 * DAY),
    lastReferralAt: t(2 * DAY)
  },
  {
    _id: 'pat_2',
    patientUserId: 'user_pat_2',
    creatorDoctorId: 'doc_1',
    creatorName: '张明',
    name: '李思颖',
    gender: '女',
    age: 29,
    phone: '13977887788',
    pastHistory: '甲状腺功能减退',
    allergy: '无',
    chiefComplaint: '枕部圆形脱发斑 2 个月',
    diagnosisTags: ['斑秃'],
    images: [img('scalp', '头皮全景照', 40), img('dermoscopy', '皮肤镜检查', 12), img('lab', '化验单', 12)],
    createdAt: t(40 * DAY),
    lastReferralAt: t(1 * DAY)
  },
  {
    _id: 'pat_3',
    patientUserId: 'user_pat_3',
    creatorDoctorId: 'doc_1',
    creatorName: '张明',
    name: '赵天宇',
    gender: '男',
    age: 24,
    phone: '13733213321',
    pastHistory: '体健',
    allergy: '无',
    chiefComplaint: '洗头掉发明显增多 3 个月',
    diagnosisTags: ['休止期脱发'],
    images: [img('scalp', '头皮全景照', 20), img('hairline', '发际线照片', 20)],
    createdAt: t(20 * DAY),
    lastReferralAt: t(5 * HOUR)
  },
  {
    _id: 'pat_4',
    patientUserId: 'user_pat_4',
    creatorDoctorId: 'doc_1',
    creatorName: '张明',
    name: '孙丽',
    gender: '女',
    age: 45,
    phone: '13590879087',
    pastHistory: '脂溢性皮炎史',
    allergy: '尘螨',
    chiefComplaint: '头皮反复瘙痒、红斑伴脱发',
    diagnosisTags: ['头皮炎症'],
    images: [img('scalp', '头皮全景照', 15), img('prescription', '用药处方', 3)],
    createdAt: t(15 * DAY),
    lastReferralAt: t(3 * DAY)
  }
]

const records = [
  {
    _id: 'rec_1',
    patientId: 'pat_1',
    doctorId: 'doc_1',
    doctorName: '张明',
    locked: true,
    confirmedAt: t(55 * DAY),
    chiefComplaint: '头顶稀疏 3 年，近半年加重，发缝明显变宽',
    presentIllness: '3 年前无明显诱因出现头顶毛发变细软，近半年加重，每日掉发约 100 根',
    pastHistory: '高血压 2 年，服用氨氯地平控制良好',
    personalHistory: '父亲及外祖父均有类似脱发，工作压力大，熬夜较多',
    exam: '头顶区毛发密度下降，毳毛比例增高，皮肤镜示毛干粗细不均，拉发试验阴性',
    diagnosis: '雄激素性脱发（Hamilton III 型）',
    advice: '外用 5% 米诺地尔每日两次；口服非那雄胺 1mg/日；建议植发评估',
    createdAt: t(56 * DAY),
    updatedAt: t(55 * DAY)
  },
  {
    _id: 'rec_2',
    patientId: 'pat_2',
    doctorId: 'doc_1',
    doctorName: '张明',
    locked: false,
    confirmedAt: '',
    chiefComplaint: '枕部圆形脱发斑 2 个月',
    presentIllness: '2 个月前发现枕部 2 处圆形脱发斑，边界清楚，无自觉症状',
    pastHistory: '甲状腺功能减退，服用左甲状腺素',
    personalHistory: '近期工作强度大，睡眠欠佳',
    exam: '枕部两处约 2cm 脱发斑，皮肤镜下见黄点征、短毳毛',
    diagnosis: '斑秃（局限型）',
    advice: '建议转诊斑秃专项免疫干预',
    createdAt: t(10 * DAY),
    updatedAt: t(10 * DAY)
  },
  {
    _id: 'rec_3',
    patientId: 'pat_3',
    doctorId: 'doc_1',
    doctorName: '张明',
    locked: true,
    confirmedAt: t(18 * DAY),
    chiefComplaint: '洗头掉发明显增多 3 个月',
    presentIllness: '3 个月来洗头时掉发明显增多，无明显斑片，整体稀疏',
    pastHistory: '体健',
    personalHistory: '近半年减重 8kg，饮食偏单一',
    exam: '弥漫性稀疏，拉发试验阳性，毛发直径较均匀',
    diagnosis: '休止期脱发',
    advice: '营养补充 + 头皮微生态治疗，3 个月后复评',
    createdAt: t(19 * DAY),
    updatedAt: t(18 * DAY)
  }
]

function log(action, operator, at) {
  return { action, operator, at }
}

const referrals = [
  {
    _id: 'ref_1',
    patientId: 'pat_3',
    patientName: '赵天宇',
    patientSnapshot: patients[2],
    purpose: ['药物治疗', '头皮微生态治疗'],
    remark: '年轻患者，希望先药物 + 头皮微生态保守治疗，暂不考虑手术',
    targetType: 'public',
    targetHospitalIds: ['hosp_1'],
    targetDoctorIds: [],
    regions: ['北京市'],
    initiatorId: 'doc_2',
    initiatorName: '李慧',
    initiatorHospital: '上海皮肤与毛发专科医院',
    status: 'pending',
    acceptedBy: '',
    acceptedByName: '',
    createdAt: t(5 * HOUR),
    expireAt: new Date(now + 67 * HOUR).toISOString(),
    logs: [log('创建转诊单（公开抢单）', '李慧', t(5 * HOUR))],
    treatment: null
  },
  {
    _id: 'ref_2',
    patientId: 'pat_1',
    patientName: '王建国',
    patientSnapshot: patients[0],
    purpose: ['植发评估', '疑难病例会诊'],
    remark: '患者合并高血压，希望评估手术风险与植发方案',
    targetType: 'friend',
    targetHospitalIds: [],
    targetDoctorIds: ['doc_1'],
    regions: [],
    initiatorId: 'doc_3',
    initiatorName: '王强',
    initiatorHospital: '广州毛发专科医院',
    status: 'pending',
    acceptedBy: '',
    acceptedByName: '',
    createdAt: t(2 * HOUR),
    expireAt: new Date(now + 70 * HOUR).toISOString(),
    logs: [log('创建转诊单（好友定向）', '王强', t(2 * HOUR))],
    treatment: null
  },
  {
    _id: 'ref_3',
    patientId: 'pat_2',
    patientName: '李思颖',
    patientSnapshot: patients[1],
    purpose: ['斑秃专项干预'],
    remark: '局限型斑秃，建议免疫干预方案',
    targetType: 'public',
    targetHospitalIds: ['hosp_2'],
    targetDoctorIds: [],
    regions: ['上海市'],
    initiatorId: 'doc_1',
    initiatorName: '张明',
    initiatorHospital: '北京毛发医学中心',
    status: 'pending',
    acceptedBy: '',
    acceptedByName: '',
    createdAt: t(1 * DAY),
    expireAt: new Date(now + 48 * HOUR).toISOString(),
    logs: [log('创建转诊单（公开抢单）', '张明', t(1 * DAY))],
    treatment: null
  },
  {
    _id: 'ref_4',
    patientId: 'pat_4',
    patientName: '孙丽',
    patientSnapshot: patients[3],
    purpose: ['SMP 文饰', '头皮微生态治疗'],
    remark: '头皮炎症控制后考虑文饰遮盖',
    targetType: 'public',
    targetHospitalIds: ['hosp_2'],
    targetDoctorIds: [],
    regions: ['上海市'],
    initiatorId: 'doc_2',
    initiatorName: '李慧',
    initiatorHospital: '上海皮肤与毛发专科医院',
    status: 'in_progress',
    acceptedBy: 'doc_1',
    acceptedByName: '张明',
    acceptedAt: t(3 * DAY),
    createdAt: t(4 * DAY),
    expireAt: new Date(now + 20 * HOUR).toISOString(),
    logs: [
      log('创建转诊单（公开抢单）', '李慧', t(4 * DAY)),
      log('张明 立即接单', '张明', t(3 * DAY))
    ],
    treatment: null
  },
  {
    _id: 'ref_5',
    patientId: 'pat_1',
    patientName: '王建国',
    patientSnapshot: patients[0],
    purpose: ['植发评估'],
    remark: '首次植发评估',
    targetType: 'public',
    targetHospitalIds: ['hosp_3'],
    targetDoctorIds: [],
    regions: ['广东省'],
    initiatorId: 'doc_1',
    initiatorName: '张明',
    initiatorHospital: '北京毛发医学中心',
    status: 'closed',
    acceptedBy: 'doc_3',
    acceptedByName: '王强',
    acceptedAt: t(20 * DAY),
    closedAt: t(12 * DAY),
    createdAt: t(30 * DAY),
    expireAt: new Date(now - 5 * DAY).toISOString(),
    logs: [
      log('创建转诊单（公开抢单）', '张明', t(30 * DAY)),
      log('王强 立即接单', '王强', t(20 * DAY)),
      log('王强 转诊结案', '王强', t(12 * DAY))
    ],
    treatment: {
      images: [],
      advice: '建议先行 3 个月规范药物治疗，若效果不佳再行 FUE 植发，预计 3500 单位',
      summary: '头顶区 Hamilton III 型脱发，供区资源充足，可择期手术',
      closedBy: '王强',
      closedAt: t(12 * DAY)
    }
  },
  {
    _id: 'ref_6',
    patientId: 'pat_2',
    patientName: '李思颖',
    patientSnapshot: patients[1],
    purpose: ['疑难病例会诊'],
    remark: '斑秃合并甲减，需多学科会诊',
    targetType: 'public',
    targetHospitalIds: ['hosp_2'],
    targetDoctorIds: [],
    regions: ['上海市'],
    initiatorId: 'doc_1',
    initiatorName: '张明',
    initiatorHospital: '北京毛发医学中心',
    status: 'cancelled',
    cancelReason: '72 小时无人接单，系统自动取消',
    createdAt: t(8 * DAY),
    expireAt: new Date(now - 2 * DAY).toISOString(),
    logs: [
      log('创建转诊单（公开抢单）', '张明', t(8 * DAY)),
      log('72 小时无人接单，系统自动取消', '系统', t(2 * DAY))
    ],
    treatment: null
  },
  {
    _id: 'ref_7',
    patientId: 'pat_1',
    patientName: '王建国',
    patientSnapshot: patients[0],
    purpose: ['CGF 治疗'],
    remark: '患者希望尝试 CGF 治疗',
    targetType: 'public',
    targetHospitalIds: ['hosp_1'],
    targetDoctorIds: [],
    regions: ['北京市'],
    initiatorId: 'doc_2',
    initiatorName: '李慧',
    initiatorHospital: '上海皮肤与毛发专科医院',
    status: 'pending',
    acceptedBy: '',
    acceptedByName: '',
    createdAt: t(30 * 60000),
    expireAt: new Date(now + 71 * HOUR).toISOString(),
    logs: [log('创建转诊单（公开抢单）', '李慧', t(30 * 60000))],
    treatment: null
  }
]

const friends = [
  { _id: 'fr_1', doctorId: 'doc_1', friendId: 'doc_2', status: 'accepted', createdAt: t(90 * DAY) },
  { _id: 'fr_2', doctorId: 'doc_2', friendId: 'doc_1', status: 'accepted', createdAt: t(90 * DAY) },
  { _id: 'fr_3', doctorId: 'doc_3', friendId: 'doc_1', status: 'pending', createdAt: t(2 * DAY) },
  { _id: 'fr_4', doctorId: 'doc_1', friendId: 'doc_4', status: 'accepted', createdAt: t(30 * DAY) },
  { _id: 'fr_5', doctorId: 'doc_4', friendId: 'doc_1', status: 'accepted', createdAt: t(30 * DAY) }
]

const messages = [
  {
    _id: 'msg_1',
    userId: 'user_doc_1',
    type: 'friend',
    title: '好友申请',
    content: '王强（广州毛发专科医院）申请添加您为好友',
    refId: 'fr_3',
    read: false,
    createdAt: t(2 * DAY)
  },
  {
    _id: 'msg_2',
    userId: 'user_doc_1',
    type: 'referral',
    title: '转诊已接单',
    content: '您发起的转诊（李思颖）尚无医生接单，已进入全国抢单池',
    refId: 'ref_3',
    read: false,
    createdAt: t(1 * DAY)
  },
  {
    _id: 'msg_3',
    userId: 'user_doc_1',
    type: 'referral',
    title: '转诊已结案',
    content: '王强已完成（王建国）的转诊结案，可查看诊疗小结',
    refId: 'ref_5',
    read: true,
    createdAt: t(12 * DAY)
  },
  {
    _id: 'msg_4',
    userId: 'user_doc_1',
    type: 'system',
    title: '出诊提醒',
    content: '您有 1 位待接诊患者，出诊前 3 天提醒已发送短信',
    refId: '',
    read: true,
    createdAt: t(3 * DAY)
  },
  {
    _id: 'msg_5',
    userId: 'user_pat_1',
    type: 'referral',
    title: '已被接诊',
    content: '您的转诊已被北京毛发医学中心 张明 医生接诊',
    refId: 'ref_5',
    read: false,
    createdAt: t(20 * DAY)
  },
  {
    _id: 'msg_6',
    userId: 'user_pat_1',
    type: 'referral',
    title: '转诊已结案',
    content: '王强医生已为您完成本次转诊，可查看诊疗小结与医嘱',
    refId: 'ref_5',
    read: false,
    createdAt: t(12 * DAY)
  }
]

module.exports = function buildSeed() {
  return {
    hospitals: JSON.parse(JSON.stringify(hospitals)),
    doctors: JSON.parse(JSON.stringify(doctors)),
    patients: JSON.parse(JSON.stringify(patients)),
    records: JSON.parse(JSON.stringify(records)),
    referrals: JSON.parse(JSON.stringify(referrals)),
    friends: JSON.parse(JSON.stringify(friends)),
    messages: JSON.parse(JSON.stringify(messages)),
    sms_tasks: [
      {
        _id: 'sms_1',
        doctorId: 'doc_1',
        phone: '13800001001',
        visitDate: new Date(now + 3 * DAY).toISOString().slice(0, 10),
        stage: 'T-3',
        status: 'sent',
        content: '【毛发医联体】您有 1 位待接诊患者，出诊日前 3 天提醒，请登录小程序查看。'
      }
    ],
    _meta: { seededAt: new Date().toISOString() }
  }
}

module.exports.DEMO_DOCTOR_ID = 'doc_1'
module.exports.DEMO_PATIENT_USER_ID = 'user_pat_1'
