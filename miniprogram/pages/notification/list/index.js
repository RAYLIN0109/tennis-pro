Page({
  data: {
    notificationList: [],
    total: 0,
    page: 1,
    pageSize: 20,
    loading: false,
    refreshing: false
  },

  onLoad() {
    this.loadNotifications()
  },

  async loadNotifications(refresh = false) {
    const { page, pageSize, notificationList } = this.data
    if (this.data.loading) return

    this.setData({ loading: true })

    try {
      const NotificationService = require('../../../services/notification')
      const res = await NotificationService.getList({ page, pageSize })
      
      const newList = refresh ? res.list : [...notificationList, ...res.list]
      
      this.setData({
        notificationList: newList,
        total: res.total,
        page: refresh ? 1 : page + 1,
        refreshing: false,
        loading: false
      })
    } catch (err) {
      console.error('加载通知失败:', err)
      this.setData({ loading: false, refreshing: false })
    }
  },

  onPullDownRefresh() {
    this.setData({ refreshing: true, page: 1, notificationList: [] })
    this.loadNotifications(true)
  },

  onReachBottom() {
    const { notificationList, total } = this.data
    if (notificationList.length >= total) return
    this.loadNotifications()
  },

  async markAsRead(e) {
    const { id } = e.currentTarget.dataset
    try {
      const NotificationService = require('../../../services/notification')
      await NotificationService.markRead(id)
      this.setData({
        notificationList: this.data.notificationList.map(n => 
          n._id === id ? { ...n, is_read: true } : n
        )
      })
    } catch (err) {
      console.error('标记已读失败:', err)
    }
  },

  async markAllRead() {
    try {
      const NotificationService = require('../../../services/notification')
      await NotificationService.markRead()
      this.setData({
        notificationList: this.data.notificationList.map(n => ({ ...n, is_read: true }))
      })
      wx.showToast({ title: '已全部标为已读', icon: 'success' })
    } catch (err) {
      console.error('全部标为已读失败:', err)
    }
  },

  goDetail(e) {
    const { notification } = e.currentTarget.dataset
    const { type, extra } = notification
    
    switch (type) {
      case 'order_update':
        wx.navigateTo({ url: `/pages/order/detail/index?id=${extra.order_id}` })
        break
      case 'coach_approval':
        wx.navigateTo({ url: '/pages/user/coach-apply/index' })
        break
      case 'activity_reminder':
        wx.navigateTo({ url: `/pages/activity/detail/index?id=${extra.activity_id}` })
        break
      default:
        break
    }
  },

  formatTime(dateStr) {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${month}月${day}日`
  },

  getIcon(type) {
    const icons = {
      order_update: '📋',
      coach_approval: '🎾',
      activity_reminder: '🏃',
      review_reply: '💬',
      system: '🔔'
    }
    return icons[type] || '📩'
  }
})