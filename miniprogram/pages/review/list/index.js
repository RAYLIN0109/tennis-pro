const ReviewService = require('../../services/review')

Page({
  data: {
    targetType: '',
    targetId: '',
    stats: null,
    list: [],
    page: 1,
    pageSize: 10,
    total: 0,
    loading: false,
    hasMore: true,
    sortBy: 'newest'
  },

  onLoad(options) {
    this.setData({ targetType: options.targetType, targetId: options.targetId })
    this.loadStats()
    this.loadData(true)
  },

  loadStats() {
    ReviewService.getStats(this.data.targetType, this.data.targetId).then((data) => {
      this.setData({ stats: data })
    })
  },

  onSortChange(e) {
    this.setData({ sortBy: e.currentTarget.dataset.sort })
    this.loadData(true)
  },

  loadData(reset) {
    if (this.data.loading) return Promise.resolve()
    const page = reset ? 1 : this.data.page
    this.setData({ loading: true })
    if (reset) this.setData({ list: [], hasMore: true })

    return ReviewService.getList({
      targetType: this.data.targetType,
      targetId: this.data.targetId,
      page,
      pageSize: this.data.pageSize,
      sortBy: this.data.sortBy
    }).then((res) => {
      const newList = reset ? res.list : [...this.data.list, ...res.list]
      this.setData({ list: newList, total: res.total, page: page + 1, hasMore: newList.length < res.total })
    }).catch(() => {}).finally(() => { this.setData({ loading: false }) })
  },

  onReachBottom() { if (this.data.hasMore && !this.data.loading) this.loadData(false) },

  previewImage(e) {
    const { src, urls } = e.currentTarget.dataset
    wx.previewImage({ current: src, urls })
  }
})
