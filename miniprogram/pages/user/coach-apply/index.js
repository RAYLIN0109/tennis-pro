const CoachService = require('../../../services/coach')
const { getProfile } = require('../../../utils/auth')

const PRESET_TAGS = ['青少年', '成人', '初学者', '进阶', '双打', '体能', '备战比赛']

Page({
  data: {
    form: {
      real_name: '',
      phone: '',
      specialties: [],
      teaching_years: 0,
      hourly_rate: '',
      trial_rate: '',
      bio: '',
      certification_labels: [],
      certifications: [],
      photos: [],
      service_areas: []
    },
    presetTags: PRESET_TAGS,
    submitting: false,
    agreed: false,
    errors: {},
    editMode: false
  },

  onLoad(options) {
    if (options.mode === 'edit') {
      this.setData({ editMode: true })
      this.loadExisting()
    } else {
      this.prefillFromUser()
    }
  },

  prefillFromUser() {
    getProfile().then(u => {
      this.setData({
        'form.real_name': u.nickname || '',
        'form.phone': u.phone || ''
      })
    }).catch(() => {})
  },

  loadExisting() {
    // 调 getMyCoachStatus 拉已有数据
    CoachService.getMyCoachStatus().then(res => {
      if (res.has_apply) {
        const c = res.coach
        this.setData({
          form: {
            real_name: c.real_name || '',
            phone: c.phone || '',
            specialties: c.specialties || [],
            teaching_years: c.teaching_years || 0,
            hourly_rate: c.hourly_rate ? (c.hourly_rate / 100).toString() : '',
            trial_rate: c.trial_rate ? (c.trial_rate / 100).toString() : '',
            bio: c.bio || '',
            certification_labels: c.certification_labels || [],
            certifications: c.certifications || [],
            photos: c.photos || [],
            service_areas: c.service_areas || []
          }
        })
      }
    }).catch(() => {})
  },

  // === 校验 ===
  validate() {
    const errors = {}
    const { real_name, phone, specialties, teaching_years, hourly_rate } = this.data.form

    if (!real_name || real_name.length < 2 || real_name.length > 20) {
      errors.real_name = '请输入 2-20 位真实姓名'
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      errors.phone = '请输入正确的手机号'
    }
    if (!specialties.length) {
      errors.specialties = '至少选择一个特长标签'
    }
    if (teaching_years < 0 || teaching_years > 50) {
      errors.teaching_years = '教学年限 0-50 年'
    }
    if (!hourly_rate || hourly_rate <= 0 || hourly_rate > 10000) {
      errors.hourly_rate = '每小时费用 1-10000 元'
    }
    if (!this.data.agreed) {
      errors.agreed = '请先阅读并同意入驻协议'
    }

    this.setData({ errors })
    return Object.keys(errors).length === 0
  },

  // === 提交 ===
  onSubmit() {
    if (!this.validate()) return
    if (this.data.submitting) return

    this.setData({ submitting: true })
    wx.showLoading({ title: '提交中...', mask: true })

    const formData = {
      real_name: this.data.form.real_name,
      phone: this.data.form.phone,
      specialties: this.data.form.specialties,
      teaching_years: Number(this.data.form.teaching_years),
      hourly_rate: Math.round(Number(this.data.form.hourly_rate) * 100),
      trial_rate: Math.round(Number(this.data.form.trial_rate || 0) * 100),
      bio: this.data.form.bio,
      certification_labels: this.data.form.certification_labels,
      certifications: this.data.form.certifications,
      photos: this.data.form.photos,
      service_areas: this.data.form.service_areas
    }

    CoachService.apply(formData).then(res => {
      wx.hideLoading()
      if (res.code === 0 || res._id) {
        wx.showToast({ title: '提交成功', icon: 'success' })
        setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 1500)
      } else if (res.code === 2001) {
        wx.showModal({
          title: '提示',
          content: '您已提交过教练申请，请耐心等待审核',
          showCancel: false,
          success: () => wx.switchTab({ url: '/pages/index/index' })
        })
      } else {
        wx.showModal({ title: '提交失败', content: res.message || '请稍后重试', showCancel: false })
      }
    }).catch(() => {
      wx.hideLoading()
      wx.showModal({ title: '网络错误', content: '请检查网络后重试', showCancel: false })
    }).finally(() => {
      this.setData({ submitting: false })
    })
  },

  // === 图片上传 ===
  uploadPhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: (res) => {
        const tempPath = res.tempFiles[0].tempFilePath
        const cloudPath = `coach_photos/${Date.now()}_${Math.random().toString(36).substr(2)}.jpg`
        wx.showLoading({ title: '上传中...', mask: true })
        wx.cloud.uploadFile({
          cloudPath,
          filePath: tempPath,
          success: (uploadRes) => {
            const photos = [...this.data.form.photos, uploadRes.fileID]
            this.setData({ 'form.photos': photos })
          },
          fail: () => {
            wx.showToast({ title: '图片上传失败', icon: 'none' })
          },
          complete: () => { wx.hideLoading() }
        })
      }
    })
  },

  removePhoto(e) {
    const idx = e.currentTarget.dataset.index
    const photos = [...this.data.form.photos]
    photos.splice(idx, 1)
    this.setData({ 'form.photos': photos })
  },

  // === 标签 ===
  toggleTag(e) {
    const tag = e.currentTarget.dataset.tag
    const specialties = this.data.form.specialties
    if (specialties.includes(tag)) {
      this.setData({ 'form.specialties': specialties.filter(t => t !== tag) })
    } else {
      this.setData({ 'form.specialties': [...specialties, tag] })
    }
  },

  // === 表单输入 ===
  onInputName(e) { this.setData({ 'form.real_name': e.detail.value }) },
  onInputPhone(e) { this.setData({ 'form.phone': e.detail.value }) },
  onInputYears(e) { this.setData({ 'form.teaching_years': e.detail.value }) },
  onInputRate(e) { this.setData({ 'form.hourly_rate': e.detail.value }) },
  onInputTrial(e) { this.setData({ 'form.trial_rate': e.detail.value }) },
  onInputBio(e) { this.setData({ 'form.bio': e.detail.value }) },
  toggleAgree() { this.setData({ agreed: !this.data.agreed }) }
})
