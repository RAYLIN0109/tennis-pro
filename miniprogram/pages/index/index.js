const CoachService = require('../../services/coach')
const { getMyInfo, checkLogin } = require('../../utils/auth')
var mock = require('../../common/mock-data')

Page({
  data: {
    userInfo: null,
    recommendCoaches: [],
    loading: true,
    __routeLeft: false
  },

  onShow() {
    if (checkLogin()) {
      getMyInfo().catch(() => {})
    }
    this.loadRecommendCoaches()
    this.checkRoleGuide()
    this.maybePromptLogin()
  },

  onHide() {
    this.setData({ __routeLeft: true })
  },

  onPullDownRefresh() {
    this.loadRecommendCoaches()
      .finally(() => wx.stopPullDownRefresh())
  },

  loadRecommendCoaches() {
    return CoachService.getList({ page: 1, pageSize: 3, sortBy: 'rating' })
      .then((res) => { this.setData({ recommendCoaches: res.list, loading: false }) })
      .catch(() => { this.setData({ recommendCoaches: mock.mockCoaches.slice(0, 3), loading: false }) })
  },

  checkRoleGuide() {
    if (wx.getStorageSync('role_guide_shown')) return

    CoachService.getMyCoachStatus().then(res => {
      wx.setStorageSync('role_guide_shown', true)
      if (!res.has_apply) {
        wx.navigateTo({ url: '/pages/user/select-role/index' })
      } else if (res.coach.status === 'pending') {
        wx.showToast({ title: '教练认证审核中...', icon: 'none' })
      } else if (res.coach.status === 'suspended') {
        wx.showModal({
          title: '教练认证状态',
          content: `您的教练认证已被${res.coach.reject_reason ? '驳回：' + res.coach.reject_reason : '停用'}。`,
          confirmText: '重新申请',
          success: ({ confirm }) => {
            if (confirm) wx.navigateTo({ url: '/pages/user/coach-apply/index?mode=edit' })
          }
        })
      }
    }).catch(() => {
      if (!wx.getStorageSync('role_guide_shown')) {
        wx.setStorageSync('role_guide_shown', true)
      }
    })
  },

  maybePromptLogin() {
    if (checkLogin()) return
    if (wx.getStorageSync('login_prompt_shown')) return

    setTimeout(() => {
      if (this.data.__routeLeft) return
      wx.setStorageSync('login_prompt_shown', true)
      wx.showModal({
        title: '登录提示',
        content: '登录后可同步数据、约教练、发评价，是否立即登录？',
        confirmText: '立即登录',
        cancelText: '稍后再说',
        success: ({ confirm }) => {
          if (confirm) wx.navigateTo({ url: '/pages/user/login/index' })
        }
      })
    }, 1500)
  },

  goCoachList() { wx.navigateTo({ url: '/pages/coach/list/index' }) },
  goActivity() { wx.navigateTo({ url: '/pages/activity/list/index' }) },
  goTennisCircle() { wx.switchTab({ url: '/pages/tennis-circle/index' }) },
  goMatch() { wx.showToast({ title: '即将开放', icon: 'none' }) },

  goCoachDetail(e) {
    wx.navigateTo({ url: `/pages/coach/detail/index?id=${e.currentTarget.dataset.id}` })
  }
})
