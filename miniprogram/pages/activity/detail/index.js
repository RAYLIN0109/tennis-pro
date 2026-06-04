Page({
  data: {
    activity: {},
    participants: [],
    displayParticipants: [],
    extraParticipantCount: 0,
    displayCount: 8,
    isJoined: false,
    isCreator: false,
    loading: true,
    countdownText: '计算中...',
    countdownClass: '',
    showManageMenuOverlay: false
  },

  onLoad(options) {
    const { id } = options
    if (id) {
      this.activityId = id
      this.loadActivity(id)
    }
  },

  onUnload() {
    this.clearCountdown()
  },

  onShareAppMessage() {
    const { activity } = this.data
    return {
      title: activity.title || '一起打网球吧！',
      path: `/pages/activity/detail/index?id=${activity._id}`,
      imageUrl: activity.cover_image || ''
    }
  },

  /* ========== Data Loading ========== */

  async loadActivity(id) {
    this.setData({ loading: true })
    try {
      const ActivityService = require('../../../services/activity')
      const res = await ActivityService.getDetail(id)

      const activity = res.data
      const participants = res.data.participants || []
      const openid = this.getOpenId()
      const isJoined = participants.some(p => p.user_id === openid)
      const isCreator = activity.creator_id === openid

      this.setData({
        activityId: id,
        activity: {
          ...activity,
          location_name: (activity.location && activity.location.name) || '未知地点',
          creator_nickname: (activity.creator_info && activity.creator_info.nickname) || '未知用户',
          creator_avatar: (activity.creator_info && activity.creator_info.avatar_url) || '',
          creator_level: (activity.creator_info && activity.creator_info.tennis_level) || '',
          has_creator_info: !!(activity.creator_info),
          creator_initial: (activity.creator_info && activity.creator_info.nickname)
            ? activity.creator_info.nickname.charAt(0) : '?'
        },
        participants: participants.map(p => ({
          ...p,
          user_nickname: (p.user_info && p.user_info.nickname) || '未知用户',
          user_avatar: (p.user_info && p.user_info.avatar_url) || '',
          user_level: (p.user_info && p.user_info.tennis_level) || '',
          has_user_info: !!(p.user_info),
          user_initial: (p.user_info && p.user_info.nickname) ? p.user_info.nickname.charAt(0) : '?'
        })),
        isJoined,
        isCreator,
        loading: false
      })

      this.refreshDisplayParticipants()
      this.startCountdown(activity)

    } catch (err) {
      console.error('加载活动详情失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  refreshDisplayParticipants() {
    const { participants, displayCount } = this.data
    if (participants.length > displayCount) {
      this.setData({
        displayParticipants: participants.slice(0, displayCount),
        extraParticipantCount: participants.length - displayCount
      })
    } else {
      this.setData({
        displayParticipants: participants,
        extraParticipantCount: 0
      })
    }
  },

  /* ========== Countdown ========== */

  startCountdown(activity) {
    this.clearCountdown()
    const calc = () => {
      const text = this.calcCountdown(activity.start_time)
      let cls = ''
      if (text === '活动已结束' || text === '活动进行中') {
        cls = 'ended'
      } else if (text.indexOf('分钟') !== -1 || text.indexOf('即将开始') !== -1) {
        cls = 'urgent'
      }
      this.setData({ countdownText: text, countdownClass: cls })
    }
    calc()
    this._countdownTimer = setInterval(calc, 60000)
  },

  clearCountdown() {
    if (this._countdownTimer) {
      clearInterval(this._countdownTimer)
      this._countdownTimer = null
    }
  },

  calcCountdown(startTime) {
    const { activity } = this.data
    // If activity is cancelled or ended, don't show countdown
    if (activity.status === 'cancelled') {
      return '活动已取消'
    }
    if (activity.status === 'ended') {
      return '活动已结束'
    }

    const now = Date.now()
    const start = new Date(startTime).getTime()
    const diff = start - now

    if (diff <= 0) {
      const end = activity.end_time
      if (end && new Date(end).getTime() < now) {
        return '活动已结束'
      }
      return '活动进行中'
    }

    const days = Math.floor(diff / 86400000)
    const hours = Math.floor((diff % 86400000) / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)

    if (days > 0) return `距开始还有 ${days} 天 ${hours} 小时`
    if (hours > 0) return `距开始还有 ${hours} 小时 ${minutes} 分钟`
    return `距开始还有 ${minutes} 分钟`
  },

  /* ========== OpenID ========== */

  getOpenId() {
    const app = getApp()
    return app.globalData.openid || ''
  },

  /* ========== Join Activity ========== */

  async joinActivity() {
    const { activity, isJoined } = this.data
    if (isJoined || activity.status !== 'open') return

    wx.showModal({
      title: '确认报名',
      content: `确定要参加「${activity.title}」吗？`,
      success: async (res) => {
        if (res.confirm) {
          // 先请求订阅授权，再执行报名
          const { subscribeActivity } = require('../../../utils/subscribe')
          await subscribeActivity()
          
          try {
            const ActivityService = require('../../../services/activity')
            await ActivityService.join(activity._id)
            wx.showToast({ title: '报名成功', icon: 'success' })
            this.loadActivity(activity._id)
          } catch (err) {
            wx.showToast({ title: err.message || '报名失败', icon: 'none' })
          }
        }
      }
    })
  },

  /* ========== Quit Activity ========== */

  showQuitConfirm() {
    wx.showModal({
      title: '退出活动',
      content: '确定要退出该活动吗？',
      confirmText: '退出',
      confirmColor: '#E53935',
      success: (res) => {
        if (res.confirm) {
          this.quitActivity()
        }
      }
    })
  },

  async quitActivity() {
    const { activity } = this.data
    try {
      const ActivityService = require('../../../services/activity')
      await ActivityService.leave(activity._id)
      wx.showToast({ title: '已退出活动', icon: 'success' })
      this.loadActivity(activity._id)
    } catch (err) {
      wx.showToast({ title: err.message || '退出失败', icon: 'none' })
    }
  },

  /* ========== Creator Management ========== */

  showManageMenu() {
    this.setData({ showManageMenuOverlay: true })
  },

  hideManageMenu() {
    this.setData({ showManageMenuOverlay: false })
  },

  stopPropagation() {},

  confirmCancelActivity() {
    this.hideManageMenu()
    const { activity } = this.data
    wx.showModal({
      title: '取消活动',
      content: `确定要取消「${activity.title}」吗？已报名的用户将收到通知。此操作不可撤销。`,
      confirmText: '确认取消',
      confirmColor: '#E53935',
      success: (res) => {
        if (res.confirm) {
          this.cancelActivity()
        }
      }
    })
  },

  async cancelActivity() {
    try {
      const ActivityService = require('../../../services/activity')
      await ActivityService.cancel(this.data.activity._id)
      wx.showToast({ title: '活动已取消', icon: 'success' })
      this.loadActivity(this.data.activity._id)
    } catch (err) {
      wx.showToast({ title: err.message || '取消失败', icon: 'none' })
    }
  },

  goEditActivity() {
    this.hideManageMenu()
    const { activity } = this.data
    wx.navigateTo({
      url: `/pages/activity/edit/index?id=${activity._id}`
    })
  },

  goParticipantList() {
    const { activity } = this.data
    wx.navigateTo({
      url: `/pages/activity/participants/index?id=${activity._id}`
    })
  },

  /* ========== Map ========== */

  openLocation() {
    const { location } = this.data.activity
    if (location && location.lat && location.lng) {
      wx.openLocation({
        latitude: location.lat,
        longitude: location.lng,
        name: location.name,
        address: location.address || location.name
      })
    } else if (location && location.address) {
      wx.showToast({ title: '暂无坐标信息', icon: 'none' })
    } else {
      wx.showToast({ title: '暂无地点信息', icon: 'none' })
    }
  },

  /* ========== Navigation ========== */

  goBack() {
    wx.navigateBack()
  },

  /* ========== Formatters ========== */

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