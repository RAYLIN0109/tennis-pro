const ReviewService = require('../../../services/review')

Page({
  data: {
    orderId: '',
    targetType: '',
    targetId: '',
    rating: 0,
    content: '',
    images: [],
    submitting: false
  },

  onLoad(options) {
    this.setData({ orderId: options.orderId || '', targetType: options.targetType || '', targetId: options.targetId || '' })
  },

  onRatingChange(e) { this.setData({ rating: e.detail.value }) },
  onContentInput(e) { this.setData({ content: e.detail.value }) },

  onChooseImage() {
    const remaining = 3 - this.data.images.length
    if (remaining <= 0) { wx.showToast({ title: '最多3张图片', icon: 'none' }); return }
    wx.chooseMedia({
      count: remaining, mediaType: ['image'], sizeType: ['compressed'],
      success: (res) => {
        const newImages = res.tempFiles.map((f) => f.tempFilePath)
        this.setData({ images: [...this.data.images, ...newImages] })
      }
    })
  },

  onRemoveImage(e) {
    const idx = e.currentTarget.dataset.index
    const images = [...this.data.images]
    images.splice(idx, 1)
    this.setData({ images })
  },

  onSubmit() {
    if (!this.data.rating) { wx.showToast({ title: '请选择评分', icon: 'none' }); return }
    this.setData({ submitting: true })

    // Upload images first
    const uploadPromises = this.data.images.map((path, i) => {
      const ext = path.split('.').pop()
      return new Promise((resolve, reject) => {
        wx.cloud.uploadFile({
          cloudPath: `reviews/${Date.now()}_${i}.${ext}`,
          filePath: path,
          success: (res) => resolve(res.fileID),
          fail: reject
        })
      })
    })

    Promise.all(uploadPromises).then((imageIds) => {
      return ReviewService.create({
        orderId: this.data.orderId,
        targetType: this.data.targetType,
        targetId: this.data.targetId,
        rating: this.data.rating,
        content: this.data.content,
        images: imageIds
      })
    }).then(() => {
      wx.showToast({ title: '评价成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1000)
    }).catch((err) => {
      wx.showToast({ title: err.message || '提交失败', icon: 'none' })
    }).finally(() => {
      this.setData({ submitting: false })
    })
  }
})
