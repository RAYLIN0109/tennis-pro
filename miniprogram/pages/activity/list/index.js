Page({
  data: {
    currentTab: 0,
    tabs: ['约球', '观赛', '我的活动'],
    typeMap: ['pickup_game', 'watch_party', 'joined'],
    activityList: [],
    total: 0,
    page: 1,
    pageSize: 10,
    loading: false,
    hasMore: true,
    refreshing: false
  },

  onLoad(options) {
    if (options.type) {
      const typeIndex = this.data.typeMap.indexOf(options.type)
      if (typeIndex >= 0) {
        this.setData({ currentTab: typeIndex })
      }
    }
    this.loadActivities()
  },

  onTabChange(e) {
    const index = e.currentTarget.dataset.index
    this.setData({
      currentTab: index,
      activityList: [],
      page: 1,
      hasMore: true
    })
    this.loadActivities()
  },

  async loadActivities(refresh = false) {
    const { page, pageSize, currentTab, activityList } = this.data
    if (this.data.loading || (!refresh && !this.data.hasMore)) return

    this.setData({ loading: true })

    try {
      const type = this.data.typeMap[currentTab]
      const params = { page, pageSize }

      if (type !== 'my') {
        params.type = type
      }

      const res = await this.getActivityList(params)

      const processedList = res.list.map(item => ({
        ...item,
        location_name: (item.location && item.location.name) || '未知地点'
      }))

      const newList = refresh ? processedList : [...activityList, ...processedList]

      this.setData({
        activityList: newList,
        total: res.total,
        hasMore: newList.length < res.total,
        page: refresh ? 1 : page + 1,
        refreshing: false,
        loading: false
      })
    } catch (err) {
      console.error('加载活动列表失败:', err)
      this.setData({ loading: false, refreshing: false })
    }
  },

  async getActivityList(params) {
    const ActivityService = require('../../../services/activity')
    return ActivityService.getList(params)
  },

  onPullDownRefresh() {
    this.setData({ refreshing: true, page: 1, activityList: [], hasMore: true })
    this.loadActivities(true)
  },

  onReachBottom() {
    this.loadActivities()
  },

  goDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/activity/detail/index?id=${id}` })
  },

  onCreate() {
    wx.navigateTo({ url: '/pages/activity/create/index' })
  },

  formatTime(dateStr) {
    const date = new Date(dateStr)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    return `${month}月${day}日 ${hour}:${minute}`
  },

  formatFee(fee) {
    return fee > 0 ? `¥${(fee / 100).toFixed(2)}` : '免费'
  },

  getStatusText(status) {
    const map = {
      open: '报名中',
      full: '已满',
      cancelled: '已取消',
      ended: '已结束'
    }
    return map[status] || status
  }
})