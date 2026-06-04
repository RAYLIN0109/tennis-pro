const SocialService = require('../../services/social')

Page({
  data: {
    posts: [],
    loading: false,
    refreshing: false,
    hasMore: true,
    page: 1,
    pageSize: 10,
    activeTopic: '',
    topics: ['全部', '约球', '技术', '装备', '赛事', '其他'],
    topicMap: { '全部': '', '约球': '约球', '技术': '技术', '装备': '装备', '赛事': '赛事', '其他': '其他' },
    showFab: true
  },

  onLoad() {
    this.loadPosts()
  },

  onShow() {
    // Refresh on return from post-detail or post-create
    if (this._needRefresh) {
      this._needRefresh = false
      this.setData({ posts: [], page: 1, hasMore: true })
      this.loadPosts()
    }
  },

  onTopicChange(e) {
    const topic = e.currentTarget.dataset.topic
    this.setData({
      activeTopic: topic,
      posts: [],
      page: 1,
      hasMore: true
    })
    this.loadPosts()
  },

  async loadPosts(refresh = false) {
    const { page, pageSize, activeTopic, topicMap, posts } = this.data
    if (this.data.loading || (!refresh && !this.data.hasMore && page > 1)) return

    this.setData({ loading: true })

    try {
      const params = { page, pageSize, sort: 'latest' }
      const topic = topicMap[activeTopic]
      if (topic) {
        params.topic = topic
      }

      const res = await SocialService.getPostList(params)

      const newList = page === 1 ? res.list : [...posts, ...res.list]
      this.setData({
        posts: newList,
        hasMore: newList.length < res.total,
        page: res.page + 1,
        loading: false,
        refreshing: false
      })
    } catch (err) {
      console.error('加载帖子列表失败:', err)
      this.setData({ loading: false, refreshing: false })
    }
  },

  onPullDownRefresh() {
    this.setData({ refreshing: true, page: 1, posts: [], hasMore: true })
    this.loadPosts(true)
  },

  onReachBottom() {
    this.loadPosts()
  },

  goPostDetail(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: `/pages/social/post-detail/index?id=${id}` })
  },

  goCreatePost() {
    wx.navigateTo({ url: '/pages/social/post-create/index' })
  },

  formatTime(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)

    if (diff < 60) return '刚刚'
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
    if (diff < 2592000) return `${Math.floor(diff / 86400)}天前`

    const month = date.getMonth() + 1
    const day = date.getDate()
    if (date.getFullYear() === now.getFullYear()) {
      return `${month}月${day}日`
    }
    return `${date.getFullYear()}年${month}月${day}日`
  },

  getTopicBadgeClass(topic) {
    const map = { '约球': 'topic-match', '技术': 'topic-tech', '装备': 'topic-gear', '赛事': 'topic-event', '其他': 'topic-other' }
    return map[topic] || 'topic-other'
  }
})