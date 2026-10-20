const api = require('../../../../utils/request')
const { requireRole } = require('../../../../utils/guard')
const { REFERRAL_PURPOSES, REGIONS } = require('../../../../config/index')

Page({
  data: {
    step: 1,
    patientId: '',
    patient: null,
    records: [],
    imageCount: 0,

    purposes: REFERRAL_PURPOSES,
    purpose: [],
    remark: '',

    provinces: REGIONS,
    selectedProvinces: [],
    selectedCities: [],
    cityOptions: [],
    allCountry: false,

    projectOptions: [],
    selectedProject: '',

    doctorKeyword: '',
    hospitals: [],
    doctors: [],
    candidateHospitals: [],
    candidateDoctors: [],

    mode: 'public',
    friends: [],
    selectedHospitalIds: [],
    selectedDoctorIds: [],

    submitting: false
  },

  onLoad(query) {
    if (!requireRole('doctor')) return
    this.setData({ patientId: query.patientId || '' })
    this.loadMeta()
    if (this.data.patientId) this.loadPatient(this.data.patientId)
  },

  loadMeta() {
    api.hospitalList().then((hospitals) => {
      const projects = []
      hospitals.forEach((h) =>
        (h.projects || []).forEach((p) => {
          if (projects.indexOf(p.name) < 0) projects.push(p.name)
        })
      )
      this.setData({ hospitals, projectOptions: projects }, () => this.updateCandidates())
    })
    api.doctor.search({}).then((doctors) => {
      this.setData({ doctors }, () => this.updateCandidates())
    })
    api.friendList().then((friends) => this.setData({ friends }))
  },

  loadPatient(id) {
    api.patientGet({ patientId: id }).then((res) => {
      this.setData({
        patientId: id,
        patient: res.patient,
        records: res.records,
        imageCount: (res.patient.images || []).length
      })
    })
  },

  /* ---------- step 1 ---------- */
  onPickPatient() {
    wx.navigateTo({ url: '/pages/doctor/patients/list/index?pick=1' })
  },

  onShow() {
    // 患者列表页回选后写入 pickPatientId
    const id = wx.getStorageSync('pickPatientId')
    if (id) {
      wx.removeStorageSync('pickPatientId')
      this.loadPatient(id)
    }
  },

  /* ---------- step 2 ---------- */
  togglePurpose(e) {
    const p = e.currentTarget.dataset.item
    const list = this.data.purpose.slice()
    const i = list.indexOf(p)
    if (i > -1) list.splice(i, 1)
    else list.push(p)
    this.setData({ purpose: list })
  },

  onRemark(e) {
    this.setData({ remark: e.detail.value })
  },

  /* ---------- step 3：筛选 ---------- */
  toggleAllCountry() {
    const all = !this.data.allCountry
    this.setData({
      allCountry: all,
      selectedProvinces: all ? [] : this.data.selectedProvinces,
      selectedCities: [],
      cityOptions: []
    }, () => this.updateCandidates())
  },

  toggleProvince(e) {
    const name = e.currentTarget.dataset.name
    const list = this.data.selectedProvinces.slice()
    const i = list.indexOf(name)
    if (i > -1) list.splice(i, 1)
    else list.push(name)
    const cities = []
    this.data.provinces.forEach((p) => {
      if (list.indexOf(p.name) > -1) {
        p.cities.forEach((c) => cities.push(c.name))
      }
    })
    this.setData({
      selectedProvinces: list,
      cityOptions: cities,
      selectedCities: this.data.selectedCities.filter((c) => cities.indexOf(c) > -1),
      allCountry: false
    }, () => this.updateCandidates())
  },

  toggleCity(e) {
    const name = e.currentTarget.dataset.name
    const list = this.data.selectedCities.slice()
    const i = list.indexOf(name)
    if (i > -1) list.splice(i, 1)
    else list.push(name)
    this.setData({ selectedCities: list }, () => this.updateCandidates())
  },

  onProject(e) {
    this.setData({ selectedProject: e.currentTarget.dataset.name }, () => this.updateCandidates())
  },

  onDoctorKeyword(e) {
    this.setData({ doctorKeyword: e.detail.value }, () => this.updateCandidates())
  },

  updateCandidates() {
    const { hospitals, doctors, selectedProvinces, selectedCities, selectedProject, doctorKeyword, allCountry } = this.data
    const matchRegion = (h) => {
      if (allCountry || (!selectedProvinces.length && !selectedCities.length)) return true
      const r = h.region || {}
      if (selectedProvinces.length && selectedProvinces.indexOf(r.province) < 0) return false
      if (selectedCities.length && selectedCities.indexOf(r.city) < 0) return false
      return true
    }
    const matchProject = (h) =>
      !selectedProject || (h.projects || []).some((p) => p.name === selectedProject)

    const hs = hospitals.filter((h) => matchRegion(h) && matchProject(h))
    const kw = (doctorKeyword || '').trim()
    const ds = doctors.filter((d) => {
      const inHospital = hs.some((h) => h._id === d.hospitalId)
      const byKw = !kw || d.name.indexOf(kw) > -1 || d.hospitalName.indexOf(kw) > -1
      return inHospital && byKw
    })
    this.setData({ candidateHospitals: hs, candidateDoctors: ds })
  },

  /* ---------- step 3：选择接诊对象 ---------- */
  onMode(e) {
    this.setData({
      mode: e.currentTarget.dataset.mode,
      selectedHospitalIds: [],
      selectedDoctorIds: []
    })
  },

  toggleHospital(e) {
    const id = e.currentTarget.dataset.id
    const list = this.data.selectedHospitalIds.slice()
    const i = list.indexOf(id)
    if (i > -1) list.splice(i, 1)
    else list.push(id)
    this.setData({ selectedHospitalIds: list })
  },

  selectAllHospitals() {
    this.setData({ selectedHospitalIds: this.data.candidateHospitals.map((h) => h._id) })
  },

  toggleDoctor(e) {
    const id = e.currentTarget.dataset.id
    const list = this.data.selectedDoctorIds.slice()
    const i = list.indexOf(id)
    if (i > -1) list.splice(i, 1)
    else list.push(id)
    this.setData({ selectedDoctorIds: list })
  },

  /* ---------- 步骤控制 ---------- */
  next() {
    if (this.data.step === 1 && !this.data.patientId) {
      return wx.showToast({ title: '请先选择患者', icon: 'none' })
    }
    if (this.data.step === 2 && !this.data.purpose.length) {
      return wx.showToast({ title: '转诊目的为必填项', icon: 'none' })
    }
    this.setData({ step: Math.min(3, this.data.step + 1) })
    wx.pageScrollTo({ scrollTop: 0 })
  },

  prev() {
    this.setData({ step: Math.max(1, this.data.step - 1) })
    wx.pageScrollTo({ scrollTop: 0 })
  },

  submit() {
    if (!this.data.purpose.length) return wx.showToast({ title: '转诊目的为必填项', icon: 'none' })
    const isFriend = this.data.mode === 'friend'
    if (isFriend && !this.data.selectedDoctorIds.length) {
      return wx.showToast({ title: '请选择至少一位好友医生', icon: 'none' })
    }
    if (!isFriend && !this.data.selectedDoctorIds.length && !this.data.selectedHospitalIds.length) {
      return wx.showToast({ title: '请选择接诊医院或医生', icon: 'none' })
    }
    this.setData({ submitting: true })
    wx.showLoading({ title: '提交中', mask: true })
    api
      .referralCreate({
        patientId: this.data.patientId,
        purpose: this.data.purpose,
        remark: this.data.remark,
        targetType: this.data.mode,
        targetDoctorIds: this.data.selectedDoctorIds,
        targetHospitalIds: isFriend ? [] : this.data.selectedHospitalIds,
        regions: this.data.allCountry ? ['全国'] : this.data.selectedProvinces
      })
      .then((r) => {
        wx.hideLoading()
        wx.showToast({ title: '转诊已发起', icon: 'success' })
        setTimeout(() => {
          wx.redirectTo({ url: `/pages/doctor/referral/detail/index?id=${r._id}` })
        }, 600)
      })
      .catch(() => {
        wx.hideLoading()
        this.setData({ submitting: false })
      })
  }
})
