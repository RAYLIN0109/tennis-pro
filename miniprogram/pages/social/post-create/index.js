const SocialService = require('../../../services/social')
const { checkLogin, ensureLogin } = require('../../../utils/auth')

Page({
  data: {
    content: '',
    images: [],
    topic: '其他',
    topics: ['约球', '技术', '装备', '赛事', '其他'],
    location: null,
    tags: [],
    tagInput: '',
    submitting: false,
    charsLeft: 5000,
    locationName: ''
  },

  onLoad() {
    if (!checkLogin()) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1000)
    }
  },

  onContentInput(e) {
    const content = e.detail.value
    this.setData({
      content,
      charsLeft: 5000 - content.length
    })
  },

  onTopicChange(e) {
    this.setData({ topic: this.data.topics[e.detail.value] })
  },

  /* ========== Images ========== */

  chooseImage() {
    const { images } = this.data
    const remaining = 9 - images.length

    if (remaining <= 0) {
      wx.showToast({ title: '最多9张图片', icon: 'none' })
      return
    }

    wx.chooseImage({
      count: remaining,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = [...images, ...res.tempFilePaths]
        this.setData({ images: newImages })
      }
    })
  },

  removeImage(e) {
    const { index } = e.currentTarget.dataset
    const images = this.data.images.filter((_, i) => i !== index)
    this.setData({ images })
  },

  /* ========== Location ========== */

  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          location: {
            lat: res.latitude,
            lng: res.longitude,
            name: res.name,
            address: res.address
          },
          locationName: res.name
        })
      },
      fail: () => {
        // User cancelled
      }
    })
  },

  clearLocation() {
    this.setData({ location: null, locationName: '' })
  },

  /* ========== Tags ========== */

  onTagInput(e) {
    this.setData({ tagInput: e.detail.value })
  },

  addTag() {
    const { tagInput, tags } = this.data
    const tag = tagInput.trim()
    if (!tag) return
    if (tags.includes(tag)) {
      wx.showToast({ title: '标签已存在', icon: 'none' })
      return
    }
    if (tags.length >= 5) {
      wx.showToast({ title: '最多5个标签', icon: 'none' })
      return
    }
    this.setData({
      tags: [...tags, tag],
      tagInput: ''
    })
  },

  removeTag(e) {
    const { index } = e.currentTarget.dataset
    const tags = this.data.tags.filter((_, i) => i !== index)
    this.setData({ tags })
  },

  /* ========== Submit ========== */

  async submit() {
    const { content, images, topic, location, tags } = this.data

    if (!content.trim()) {
      wx.showToast({ title: '请输入内容', icon: 'none' })
      return
    }

    if (content.length > 5000) {
      wx.showToast({ title: '内容不能超过5000字', icon: 'none' })
      return
    }

    this.setData({ submitting: true })

    try {
      // Upload images to cloud storage first
      const fileIds = []
      for (const filePath of images) {
        try {
          const uploadRes = await wx.cloud.uploadFile({
            cloudPath: `social/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`,
            filePath
          })
          fileIds.push(uploadRes.fileID)
        } catch (err) {
          console.error('上传图片失败:', err)
          wx.showToast({ title: '图片上传失败', icon: 'none' })
          this.setData({ submitting: false })
          return
        }
      }

      const params = {
        content: content.trim(),
        images: fileIds,
        topic,
        tags
      }

      if (location) {
        params.location = location
      }

      await SocialService.createPost(params)

      wx.showToast({ title: '发布成功', icon: 'success' })

      // Signal to tennis-circle to refresh
      const pages = getCurrentPages()
      const prevPage = pages[pages.length - 2]
      if (prevPage && prevPage.route === 'pages/tennis-circle/index') {
        prevPage._needRefresh = true
      }

      wx.navigateBack()
    } catch (err) {
      wx.showToast({ title: err.message || '发布失败', icon: 'none' })
      this.setData({ submitting: false })
    }
  },

  /* ========== Navigation ========== */

  goBack() {
    const { content, images } = this.data
    if (content || images.length > 0) {
      wx.showModal({
        title: '放弃发布',
        content: '确定要放弃编辑吗？内容将不会保存。',
        confirmText: '放弃',
        confirmColor: '#E53935',
        success: (res) => {
          if (res.confirm) wx.navigateBack()
        }
      })
    } else {
      wx.navigateBack()
    }
  }
})