const SocialService = require('../../../services/social')

Page({
  data: {
    post: null,
    authorInfo: null,
    comments: [],
    loading: true,
    commentText: '',
    commentPage: 1,
    commentPageSize: 20,
    hasMoreComments: false,
    loadingComments: false,
    submittingComment: false,
    replyToComment: null,
    showCommentInput: false,
    isLiked: false,
    currentImages: [],
    currentImageIndex: 0,
    showImagePreview: false
  },

  onLoad(options) {
    const { id } = options
    if (id) {
      this.postId = id
      this.loadPostDetail()
    }
    const app = getApp()
    this.setData({ app_global_openid: app.globalData.openid || '' })
  },

  onUnload() {
    // Signal tennis-circle to refresh
    const pages = getCurrentPages()
    const prevPage = pages[pages.length - 2]
    if (prevPage && prevPage.route === 'pages/tennis-circle/index') {
      prevPage._needRefresh = true
    }
  },

  async loadPostDetail() {
    this.setData({ loading: true })
    try {
      const res = await SocialService.getPostDetail(this.postId)
      const post = res

      this.setData({
        post,
        authorInfo: post.author_info || null,
        comments: post.comments || [],
        isLiked: post.isLiked || false,
        hasMoreComments: (post.comments || []).length >= 5,
        commentPage: 1,
        loading: false
      })
    } catch (err) {
      console.error('加载帖子详情失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  /* ========== Like ========== */

  async toggleLike() {
    const { post, isLiked } = this.data
    if (!post) return

    try {
      const res = await SocialService.toggleLike(post._id)
      this.setData({
        isLiked: res.isLiked,
        'post.like_count': res.like_count
      })
    } catch (err) {
      console.error('点赞失败:', err)
    }
  },

  /* ========== Comments ========== */

  focusCommentInput() {
    this.setData({ showCommentInput: true, replyToComment: null, commentText: '' })
  },

  focusReply(e) {
    const { comment } = e.currentTarget.dataset
    this.setData({
      showCommentInput: true,
      replyToComment: comment,
      commentText: ''
    })
  },

  cancelReply() {
    this.setData({ replyToComment: null, commentText: '' })
  },

  onCommentInput(e) {
    this.setData({ commentText: e.detail.value })
  },

  async submitComment() {
    const { commentText, replyToComment, post } = this.data
    if (!commentText.trim()) {
      wx.showToast({ title: '请输入评论内容', icon: 'none' })
      return
    }

    this.setData({ submittingComment: true })

    try {
      const params = { post_id: post._id, content: commentText.trim() }
      if (replyToComment) {
        params.reply_to = replyToComment._id
      }

      await SocialService.createComment(params)
      wx.showToast({ title: '评论成功', icon: 'success' })

      this.setData({ commentText: '', replyToComment: null, showCommentInput: false })

      // Reload comments
      const res = await SocialService.getPostDetail(this.postId)
      this.setData({
        comments: res.comments || [],
        'post.comment_count': res.comment_count
      })
    } catch (err) {
      wx.showToast({ title: err.message || '评论失败', icon: 'none' })
    }

    this.setData({ submittingComment: false })
  },

  async loadMoreComments() {
    if (this.data.loadingComments || !this.data.hasMoreComments) return

    const { commentPage, commentPageSize, post } = this.data
    this.setData({ loadingComments: true })

    try {
      const res = await SocialService.getCommentList({
        post_id: post._id,
        page: commentPage + 1,
        pageSize: commentPageSize
      })

      this.setData({
        comments: [...this.data.comments, ...res.list],
        commentPage: commentPage + 1,
        hasMoreComments: (commentPage + 1) * commentPageSize < res.total,
        loadingComments: false
      })
    } catch (err) {
      console.error('加载评论失败:', err)
      this.setData({ loadingComments: false })
    }
  },

  /* ========== Image Preview ========== */

  previewImages(e) {
    const { images, index } = e.currentTarget.dataset
    wx.previewImage({
      urls: images,
      current: images[index]
    })
  },

  /* ========== Delete Post ========== */

  confirmDelete() {
    wx.showModal({
      title: '删除帖子',
      content: '确定要删除这条帖子吗？',
      confirmText: '删除',
      confirmColor: '#E53935',
      success: (res) => {
        if (res.confirm) {
          this.deletePost()
        }
      }
    })
  },

  async deletePost() {
    try {
      await SocialService.deletePost(this.postId)
      wx.showToast({ title: '已删除', icon: 'success' })
      wx.navigateBack()
    } catch (err) {
      wx.showToast({ title: err.message || '删除失败', icon: 'none' })
    }
  },

  /* ========== Navigation ========== */

  goBack() {
    wx.navigateBack()
  },

  /* ========== Helpers ========== */

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
  }
})