const UserService = require('../../../services/user')
const CoachService = require('../../../services/coach')
const NotificationService = require('../../../services/notification')
const { checkLogin } = require('../../../utils/auth')
var mock = require('../../../common/mock-data')

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    profileLoaded: false,
    stats: { total_bookings: 0, total_reviews: 0, total_activities: 0 },
    coachInfo: null,
    unreadCount: 0
  },

  onShow() {
    const loggedIn = checkLogin()
    this.setData({ isLoggedIn: loggedIn })

    if (loggedIn) {
      // 已登录：未加载过时显示骨架屏
      if (!this.data.profileLoaded) {
        this.setData({ profileLoaded: false })
      }
      this.loadProfile()
      this.loadCoachStatus()
      this.loadUnreadCount()
    } else {
      // 未登录：跳过骨架屏，直接进入 B 块
      this.setData({ profileLoaded: true, userInfo: null, coachInfo: null, unreadCount: 0 })
    }
  },

  loadProfile() {
    UserService.getProfile()
      .then((data) => {
        this.setData({
          userInfo: data,
          profileLoaded: true,
          stats: data.stats || { total_bookings: 0, total_reviews: 0, total_activities: 0 }
        })
      })
      .catch(() => {
        // 静默回退到 mock
        var u = mock.mockUser
        this.setData({
          userInfo: u,
          profileLoaded: true,
          stats: u.stats || { total_bookings: 0, total_reviews: 0, total_activities: 0 }
        })
      })
  },

  loadCoachStatus() {
    CoachService.getMyCoachStatus().then(res => {
      this.setData({ coachInfo: res })
    }).catch(() => {})
  },

  loadUnreadCount() {
    NotificationService.getUnreadCount().then(res => {
      this.setData({ unreadCount: res.count || 0 })
    }).catch(() => {})
  },

  goReapply() {
    wx.navigateTo({ url: '/pages/user/coach-apply/index?mode=edit' })
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/user/login/index' })
  },

  goEditProfile() {
    wx.navigateTo({ url: '/pages/user/edit-profile/index' })
  },

  goOrders() {
    wx.navigateTo({ url: '/pages/order/list/index' })
  },

  goMyActivities() {
    wx.switchTab({ url: '/pages/activity/list/index' })
  },

  goReviews() {
    wx.navigateTo({ url: '/pages/review/list/index?from=mine' })
  },

  goSettings() {
    wx.navigateTo({ url: '/pages/user/settings/index' })
  },

  goCoachApply() {
    wx.navigateTo({ url: '/pages/user/select-role/index' })
  },

  goNotifications() {
    wx.navigateTo({ url: '/pages/notification/list/index' })
  }
})
