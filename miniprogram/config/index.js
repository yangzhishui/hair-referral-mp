/** 业务字典：与需求文档一一对应 */

// 脱发类型标签（初诊诊断）
const DIAGNOSIS_TAGS = [
  '雄激素性脱发',
  '斑秃',
  '休止期脱发',
  '头皮炎症',
  '瘢痕性脱发',
  '产后脱发',
  '营养性脱发',
  '其他'
]

// 本次转诊核心诉求（转诊目的）
const REFERRAL_PURPOSES = [
  '植发评估',
  '药物治疗',
  '斑秃专项干预',
  '头皮微生态治疗',
  'CGF 治疗',
  'SMP 文饰',
  '疑难病例会诊',
  '手术转诊'
]

// 转诊单状态
const REFERRAL_STATUS = {
  pending: { key: 'pending', text: '待接单（抢单中）', color: '#ff9800' },
  accepted: { key: 'accepted', text: '已被接诊', color: '#2b7cff' },
  in_progress: { key: 'in_progress', text: '诊疗进行中', color: '#2b7cff' },
  closed: { key: 'closed', text: '已结案', color: '#12a89c' },
  cancelled: { key: 'cancelled', text: '已取消', color: '#9aa0a6' }
}

// 毛发临床影像分类
const IMAGE_CATEGORIES = [
  { key: 'scalp', name: '头皮全景照' },
  { key: 'hairline', name: '发际线照片' },
  { key: 'vertex', name: '头顶稀疏照' },
  { key: 'dermoscopy', name: '皮肤镜检查' },
  { key: 'report', name: '检查报告' },
  { key: 'lab', name: '化验单' },
  { key: 'prescription', name: '用药处方' }
]

// 极简格式化病历字段（标准化模板，医患双端同步）
const RECORD_FIELDS = [
  { key: 'chiefComplaint', name: '主诉', type: 'textarea', placeholder: '如：头顶稀疏 2 年，近半年加重' },
  { key: 'presentIllness', name: '现病史', type: 'textarea', placeholder: '脱发持续时间、进展、加重因素等' },
  { key: 'pastHistory', name: '既往史', type: 'textarea', placeholder: '既往疾病、手术史等' },
  { key: 'personalHistory', name: '个人史', type: 'textarea', placeholder: '作息、饮食、压力、家族史等' },
  { key: 'exam', name: '专科查体（头皮、毛发情况）', type: 'textarea', placeholder: '头皮油脂、毛发密度、拉发试验等' },
  { key: 'diagnosis', name: '初步诊断', type: 'textarea', placeholder: '如：雄激素性脱发（III 型）' },
  { key: 'advice', name: '处理意见', type: 'textarea', placeholder: '用药建议、进一步检查建议等' }
]

// 医生职称
const DOCTOR_TITLES = ['主任医师', '副主任医师', '主治医师', '住院医师', '执业医师']

// 演示用地区数据（正式环境可替换为行政区划接口）
const REGIONS = [
  {
    name: '北京市',
    cities: [
      { name: '北京市', districts: ['朝阳区', '海淀区', '西城区', '东城区'] }
    ]
  },
  {
    name: '上海市',
    cities: [
      { name: '上海市', districts: ['黄浦区', '徐汇区', '静安区', '浦东新区'] }
    ]
  },
  {
    name: '广东省',
    cities: [
      { name: '广州市', districts: ['天河区', '越秀区', '海珠区'] },
      { name: '深圳市', districts: ['福田区', '南山区', '罗湖区'] }
    ]
  },
  {
    name: '浙江省',
    cities: [
      { name: '杭州市', districts: ['西湖区', '拱墅区', '滨江区'] },
      { name: '宁波市', districts: ['海曙区', '鄞州区'] }
    ]
  },
  {
    name: '四川省',
    cities: [
      { name: '成都市', districts: ['武侯区', '锦江区', '高新区'] }
    ]
  },
  {
    name: '江苏省',
    cities: [
      { name: '南京市', districts: ['鼓楼区', '玄武区', '建邺区'] },
      { name: '苏州市', districts: ['姑苏区', '工业园区'] }
    ]
  }
]

module.exports = {
  DIAGNOSIS_TAGS,
  REFERRAL_PURPOSES,
  REFERRAL_STATUS,
  IMAGE_CATEGORIES,
  RECORD_FIELDS,
  DOCTOR_TITLES,
  REGIONS
}
