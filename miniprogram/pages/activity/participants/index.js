Page({
  data: {
    activityId: '',
    participants: [],
    participantList: [],
    creator: {
      nickname: '',
      avatar: '',
      level: '',
      initial: '?'
    },
    loading: true,
    loadingMore: false,
    hasMore: false,
    page: 1,
    pageSize: 20
  },

  onLoad(options) {
    const { id } = options
    if (!id) {
      wx.showToast({ title: '缺少活动ID', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1000)
      return
    }
    this.setData({ activityId: id })
    this.loadParticipants()
  },

  async loadParticipants() {
    this.setData({ loading: true })
    try {
      const ActivityService = require('../../../services/activity')
      const res = await ActivityService.getDetail(this.data.activityId)
      const activity = res.data
      const participants = activity.participants || []
      const creatorInfo = activity.creator_info || {}

      // Creator info
      const creator = {
        nickname: creatorInfo.nickname || '未知用户',
        avatar: creatorInfo.avatar_url || '',
        level: creatorInfo.tennis_level || '',
        initial: creatorInfo.nickname ? creatorInfo.nickname.charAt(0) : '?'
      }

      // Participant list (excluding creator to avoid duplicate display)
      const list = participants
        .filter(p => p.user_id !== activity.creator_id)
        .map(p => ({
        user_id: p.user_id,
        nickname: (p.user_info && p.user_info.nickname) || '未知用户',
        avatar: (p.user_info && p.user_info.avatar_url) || '',
        level: (p.user_info && p.user_info.tennis_level) || '',
        initial: (p.user_info && p.user_info.nickname) ? p.user_info.nickname.charAt(0) : '?',
        joinedText: p.joined_at ? this.formatJoinTime(p.joined_at) : '已报名'
      }))

      // Free the detail page's memory by not storing redundant data
      this.setData({
        participants: list,
        creator,
        loading: false,
        hasMore: list.length > this.data.pageSize
      })

      this.renderList()

    } catch (err) {
      console.error('加载参与者失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  renderList() {
    const { participants, page, pageSize } = this.data
    const end = page * pageSize
    const slice = participants.slice(0, end)

    this.setData({
      participantList: slice,
      hasMore: end < participants.length,
      loadingMore: false
    })
  },

  loadMore() {
    if (this.data.loadingMore || !this.data.hasMore) return
    this.setData({ loadingMore: true })
    this.setData({
      page: this.data.page + 1
    }, () => {
      this.renderList()
    })
  },

  formatJoinTime(dateStr) {
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const diff = Math.floor((now - date) / 1000)

      if (diff < 3600) return '刚刚报名'
      if (diff < 86400) return `${Math.floor(diff / 3600)}小时前报名`
      if (diff < 2592000) return `${Math.floor(diff / 86400)}天前报名`
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) + '报名'
    } catch (e) {
      return '已报名'
    }
  },

  goBack() {
    wx.navigateBack()
  }
})