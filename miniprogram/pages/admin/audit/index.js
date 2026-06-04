Page({
  data: {
    tabs: [
      { value: 'pending', label: '待审核' },
      { value: 'approved', label: '已通过' },
      { value: 'rejected', label: '已驳回' }
    ],
    currentTab: 'pending',
    coachList: [],
    loading: true,
    pendingCount: 0,
    showRejectModal: false,
    rejectReason: '',
    currentCoachId: ''
  },

  onLoad() {
    this.loadCoachList()
    this.loadPendingCount()
  },

  goBack() {
    wx.navigateBack()
  },

  switchTab(e) {
    const value = e.currentTarget.dataset.value
    this.setData({ currentTab: value, coachList: [], loading: true })
    this.loadCoachList()
  },

  async loadCoachList() {
    const { currentTab, coachList } = this.data
    
    try {
      const CoachService = require('../../../services/coach')
      const res = await CoachService.getList({
        page: 1,
        pageSize: 20,
        status: currentTab
      })

      this.setData({
        coachList: (res.list || []).map(item => ({
          ...item,
          cert_text: item.certification_labels && item.certification_labels.length > 0
            ? item.certification_labels[0]
            : '未认证',
          specialties_text: item.specialties && Array.isArray(item.specialties)
            ? item.specialties.join('、')
            : '未填写',
          display_price_text: item.display_price || (item.hourly_rate ? (item.hourly_rate / 100) : '0')
        })),
        loading: false
      })
    } catch (err) {
      console.error('加载审核列表失败:', err)
      this.setData({ loading: false, coachList: [] })
    }
  },

  async loadPendingCount() {
    try {
      const CoachService = require('../../../services/coach')
      const res = await CoachService.getList({ page: 1, pageSize: 1, status: 'pending' })
      this.setData({ pendingCount: res.total })
    } catch (err) {
      console.error('获取待审核数量失败:', err)
    }
  },

  // 暂无详情页面，保留占位

  handleApprove(e) {
    const { id } = e.currentTarget.dataset
    wx.showModal({
      title: '确认通过',
      content: '确定要通过该教练的认证申请吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const CoachService = require('../../../services/coach')
            await CoachService.approve(id)
            wx.showToast({ title: '审核通过', icon: 'success' })
            this.loadCoachList()
            this.loadPendingCount()
          } catch (err) {
            wx.showToast({ title: err.message || '审核失败', icon: 'none' })
          }
        }
      }
    })
  },

  handleReject(e) {
    const { id } = e.currentTarget.dataset
    this.setData({ 
      showRejectModal: true, 
      currentCoachId: id,
      rejectReason: '' 
    })
  },

  closeRejectModal() {
    this.setData({ showRejectModal: false, rejectReason: '', currentCoachId: '' })
  },

  stopPropagation() {},

  onRejectReasonInput(e) {
    this.setData({ rejectReason: e.detail.value })
  },

  async confirmReject() {
    if (!this.data.rejectReason.trim()) {
      wx.showToast({ title: '请填写驳回理由', icon: 'none' })
      return
    }

    try {
      const CoachService = require('../../../services/coach')
      await CoachService.reject(this.data.currentCoachId, this.data.rejectReason)
      wx.showToast({ title: '已驳回', icon: 'success' })
      this.closeRejectModal()
      this.loadCoachList()
      this.loadPendingCount()
    } catch (err) {
      wx.showToast({ title: err.message || '驳回失败', icon: 'none' })
    }
  },

  formatTime(timeStr) {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  },

  getStatusText(status) {
    const map = {
      pending: '待审核',
      active: '已通过',
      suspended: '已驳回'
    }
    return map[status] || status
  }
})