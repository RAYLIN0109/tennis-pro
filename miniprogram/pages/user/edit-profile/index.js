const UserService = require('../../../services/user')
const { validateForm } = require('../../../utils/validator')
const { TENNIS_LEVELS, GENDER_OPTIONS } = require('../../../common/constants/user')

Page({
  data: {
    form: { nickname: '', gender: 0, phone: '', tennis_level: '', bio: '' },
    tennisLevels: TENNIS_LEVELS,
    genderOptions: GENDER_OPTIONS,
    genderIndex: 0,
    levelIndex: -1,
    avatarUrl: '',
    submitting: false
  },

  onLoad() { this.loadProfile() },

  loadProfile() {
    UserService.getProfile().then((data) => {
      const genderIdx = GENDER_OPTIONS.findIndex((g) => g.value === data.gender)
      const levelIdx = TENNIS_LEVELS.findIndex((l) => l.value === data.tennis_level)
      this.setData({
        form: {
          nickname: data.nickname || '',
          gender: data.gender || 0,
          phone: data.phone || '',
          tennis_level: data.tennis_level || '',
          bio: data.bio || ''
        },
        avatarUrl: data.avatar_url || '',
        genderIndex: genderIdx >= 0 ? genderIdx : 0,
        levelIndex: levelIdx
      })
    }).catch(() => {})
  },

  onChooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: (res) => {
        const tempPath = res.tempFiles[0].tempFilePath
        this.setData({ avatarUrl: tempPath })
        const cloudPath = `avatars/${Date.now()}-${Math.random().toString(36).substr(2, 8)}.jpg`
        wx.showLoading({ title: '上传中...', mask: true })
        wx.cloud.uploadFile({
          cloudPath,
          filePath: tempPath,
          success: (uploadRes) => {
            this.setData({ 'form.avatar_url': uploadRes.fileID })
          },
          fail: () => {
            wx.showToast({ title: '头像上传失败，请重试', icon: 'none' })
          },
          complete: () => { wx.hideLoading() }
        })
      }
    })
  },

  onInputNickname(e) { this.setData({ 'form.nickname': e.detail.value }) },
  onGenderChange(e) {
    const idx = Number(e.detail.value)
    this.setData({ genderIndex: idx, 'form.gender': GENDER_OPTIONS[idx].value })
  },
  onInputPhone(e) { this.setData({ 'form.phone': e.detail.value }) },
  onLevelChange(e) {
    const idx = Number(e.detail.value)
    this.setData({ levelIndex: idx, 'form.tennis_level': TENNIS_LEVELS[idx].value })
  },
  onInputBio(e) { this.setData({ 'form.bio': e.detail.value }) },

  onSubmit() {
    const error = validateForm([
      { field: 'nickname', rules: [{ type: 'required', message: '昵称' }] },
      { field: 'phone', rules: [{ type: 'phone', message: '手机号格式不正确' }] }
    ], this.data.form)

    if (error) {
      wx.showToast({ title: error, icon: 'none' })
      return
    }

    this.setData({ submitting: true })
    UserService.updateProfile(this.data.form)
      .then(() => {
        wx.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 1000)
      })
      .catch((err) => {
        wx.showToast({ title: err.message || '保存失败', icon: 'none' })
      })
      .finally(() => { this.setData({ submitting: false }) })
  }
})
