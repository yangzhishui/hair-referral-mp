const h = require('./helper')

const DEMO_HOSPITALS = [
  {
    name: '北京毛发医学中心',
    address: '北京市朝阳区建国路 88 号',
    department: '毛发专病中心 / 皮肤科',
    intro: '医联体核心单位，集毛发疾病诊断、药物治疗、植发手术、头皮微生态治疗于一体。',
    projects: [
      { name: 'FUE 毛囊单位提取植发', desc: '单株提取，自然发际线设计', priceRange: '15000 - 40000 元' },
      { name: '药物治疗方案（内服 + 外用）', desc: '非那雄胺 / 米诺地尔规范化用药管理', priceRange: '800 - 3000 元 / 疗程' },
      { name: 'CGF 浓缩生长因子治疗', desc: '自体血液提取生长因子头皮注射', priceRange: '3000 - 8000 元 / 次' },
      { name: '头皮微生态治疗', desc: '头皮菌群检测 + 定制护理方案', priceRange: '1200 - 3600 元 / 疗程' }
    ],
    outpatientTime: '周一至周五 08:30 - 17:30',
    weekendTime: '周六 09:00 - 16:00（周日休诊）',
    region: { province: '北京市', city: '北京市', district: '朝阳区' }
  },
  {
    name: '上海皮肤与毛发专科医院',
    address: '上海市徐汇区宛平南路 600 号',
    department: '皮肤科 / 毛发移植中心',
    intro: '华东地区毛发专病诊疗中心，擅长斑秃免疫干预、瘢痕性脱发修复及 SMP 头皮文饰。',
    projects: [
      { name: '斑秃专项免疫干预', desc: 'JAK 抑制剂 + 局部免疫治疗联合方案', priceRange: '5000 - 18000 元 / 疗程' },
      { name: 'SMP 头皮微色素文饰', desc: '仿真毛囊点阵文饰', priceRange: '5000 - 15000 元' },
      { name: '疑难病例多学科会诊', desc: '三位以上副高专家联合会诊', priceRange: '2000 - 5000 元 / 次' }
    ],
    outpatientTime: '周一至周六 08:00 - 17:00',
    weekendTime: '周日 09:00 - 12:00',
    region: { province: '上海市', city: '上海市', district: '徐汇区' }
  },
  {
    name: '广州毛发专科医院',
    address: '广东省广州市天河区天河路 218 号',
    department: '毛发外科 / 植发中心',
    intro: '华南地区植发手术量领先单位，开展大面积植发修复与疑难手术转诊。',
    projects: [
      { name: '大面积植发修复', desc: '单次 4000 单位以上', priceRange: '30000 - 80000 元' },
      { name: '药物治疗方案', desc: '规范化用药与随访管理', priceRange: '600 - 2600 元 / 疗程' }
    ],
    outpatientTime: '周一至周日 09:00 - 18:00',
    weekendTime: '周末正常门诊',
    region: { province: '广东省', city: '广州市', district: '天河区' }
  }
]

/** 初始化演示医院数据（幂等：已存在则跳过） */
exports.seed = async (ctx) => {
  const exist = await h.list(ctx, 'hospitals', {})
  let created = 0
  for (const item of DEMO_HOSPITALS) {
    const found = exist.find((x) => x.name === item.name)
    if (!found) {
      await h.insert(ctx, 'hospitals', item)
      created += 1
    }
  }
  const hospitals = await h.list(ctx, 'hospitals', {})
  return { created, total: hospitals.length, hospitals }
}
