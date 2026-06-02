const CoachService = require('../../../services/coach')

Page({
  data: {
    real_name: '',
    phone: '',
    teaching_years: 0,
    hourly_rate: '',
    trial_rate: '',
    bio: '',
    specialties: [],
    certification_labels: [],
    certifications: [],
    photos: [],
    service_areas: [],

    submitting: false,
    agreed: false,
    errors: {},
    PRESET_TAGS: ['青少年', '成人', '初学者', '进阶', '双打', '体能', '备战比赛'],
    teachingYearsOptions: Array.from({ length: 51 }, (_, i) => `${i}年`),
    customTag: ''
  },

  onLoad(options) {
    if (options.mode === 'edit') {
      this.loadExistingData()
    }
  },

  loadExistingData() {
    CoachService.getMyCoachStatus().then(res => {
      if (res.has_apply && res.coach) {
        const c = res.coach
        this.setData({
          real_name: c.real_name || '',
          phone: c.phone || '',
          teaching_years: c.teaching_years || 0,
          hourly_rate: String((c.hourly_rate || 0) / 100),
          trial_rate: String((c.trial_rate || 0) / 100),
          bio: c.bio || '',
          specialties: c.specialties || [],
          certification_labels: c.certification_labels || [],
          certifications: c.certifications || [],
          photos: c.photos || [],
          service_areas: c.service_areas || []
        })
      }
    }).catch(() => {})
  },

  // === Input Handlers ===
  onInputRealName(e) { this.setData({ real_name: e.detail.value }) },
  onInputPhone(e) { this.setData({ phone: e.detail.value }) },
  onInputBio(e) { this.setData({ bio: e.detail.value }) },
  onInputHourlyRate(e) { this.setData({ hourly_rate: e.detail.value }) },
  onInputTrialRate(e) { this.setData({ trial_rate: e.detail.value }) },
  onInputCustomTag(e) { this.setData({ customTag: e.detail.value }) },

  onTeachingYearsChange(e) {
    this.setData({ teaching_years: Number(e.detail.value) })
  },

  // === Agreement ===
  onToggleAgreed() {
    this.setData({ agreed: !this.data.agreed })
  },

  // === Tag Management ===
  addPresetTag(e) {
    const tag = e.currentTarget.dataset.tag
    if (!this.data.specialties.includes(tag)) {
      this.setData({ specialties: [...this.data.specialties, tag] })
    }
  },

  addCustomTag() {
    const tag = this.data.customTag.trim()
    if (!tag) return
    if (this.data.specialties.includes(tag)) {
      wx.showToast({ title: '标签已存在', icon: 'none' })
      return
    }
    this.setData({
      specialties: [...this.data.specialties, tag],
      customTag: ''
    })
  },

  removeSpecialty(e) {
    const idx = e.currentTarget.dataset.index
    const specialties = [...this.data.specialties]
    specialties.splice(idx, 1)
    this.setData({ specialties })
  },

  // === Photo Upload ===
  async uploadPhoto() {
    try {
      const { tempFiles } = await wx.chooseMedia({
        count: 9 - this.data.photos.length,
        mediaType: ['image']
      })

      wx.showLoading({ title: '上传中...', mask: true })

      const uploadResults = await Promise.all(
        tempFiles.map(f => wx.cloud.uploadFile({
          cloudPath: `coach_photos/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`,
          filePath: f.tempFilePath
        }))
      )

      const photos = [...this.data.photos, ...uploadResults.map(r => r.fileID)]
      this.setData({ photos })
      wx.hideLoading()
    } catch (err) {
      wx.hideLoading()
      if (err.errMsg && err.errMsg.includes('cancel')) return
      wx.showToast({ title: '上传失败', icon: 'none' })
    }
  },

  removePhoto(e) {
    const idx = e.currentTarget.dataset.index
    const photos = [...this.data.photos]
    photos.splice(idx, 1)
    this.setData({ photos })
  },

  // === Certification Label ===
  addCertLabel() {
    const label = this.data.certLabelInput || ''
    if (!label.trim()) return
    this.setData({
      certification_labels: [...this.data.certification_labels, label.trim()],
      certLabelInput: ''
    })
  },

  onInputCertLabel(e) { this.setData({ certLabelInput: e.detail.value }) },

  removeCertLabel(e) {
    const idx = e.currentTarget.dataset.index
    const labels = [...this.data.certification_labels]
    labels.splice(idx, 1)
    this.setData({ certification_labels: labels })
  },

  // === Validation ===
  validate() {
    const errors = {}
    const { real_name, phone, specialties, teaching_years, hourly_rate } = this.data

    if (!real_name || real_name.length < 2 || real_name.length > 20) {
      errors.real_name = '请输入2-20位真实姓名'
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      errors.phone = '请输入正确的手机号'
    }
    if (!specialties.length) {
      errors.specialties = '至少选择一个特长标签'
    }
    if (teaching_years < 0 || teaching_years > 50) {
      errors.teaching_years = '教学年限 0-50年'
    }
    if (!hourly_rate || Number(hourly_rate) <= 0 || Number(hourly_rate) > 10000) {
      errors.hourly_rate = '每小时费用 1-10000元'
    }
    if (!this.data.agreed) {
      errors.agreed = '请先阅读并同意入驻协议'
    }

    this.setData({ errors })
    return Object.keys(errors).length === 0
  },

  // === Submit ===
  async onSubmit() {
    if (!this.validate()) return
    if (this.data.submitting) return

    this.setData({ submitting: true })
    wx.showLoading({ title: '提交中...', mask: true })

    try {
      const res = await CoachService.apply({
        real_name: this.data.real_name,
        phone: this.data.phone,
        specialties: this.data.specialties,
        teaching_years: this.data.teaching_years,
        hourly_rate: Math.round(Number(this.data.hourly_rate) * 100),
        trial_rate: Math.round(Number(this.data.trial_rate || 0) * 100),
        bio: this.data.bio,
        certification_labels: this.data.certification_labels,
        certifications: this.data.certifications,
        photos: this.data.photos,
        service_areas: this.data.service_areas
      })

      wx.hideLoading()
      wx.showToast({ title: '提交成功', icon: 'success' })
      setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 1500)
    } catch (err) {
      wx.hideLoading()
      if (err.code === 2001) {
        wx.showModal({
          title: '提示',
          content: '您已提交过教练申请，请耐心等待审核。',
          showCancel: false,
          success: () => wx.switchTab({ url: '/pages/index/index' })
        })
      } else {
        wx.showModal({
          title: '提交失败',
          content: err.message || '请稍后重试',
          showCancel: false
        })
      }
    } finally {
      this.setData({ submitting: false })
    }
  }
})
