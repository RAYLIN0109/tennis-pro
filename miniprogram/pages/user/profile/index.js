const UserService = require('../../services/user')
const CoachService = require('../../services/coach')
const { checkLogin } = require('../../utils/auth')
var mock = require('../../common/mock-data')

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    stats: { total_bookings: 0, total_reviews: 0, total_activities: 0 },
    coachInfo: null
  },

  onShow() {
    // 无云环境时直接使用模拟数据展示登录状态
    this.setData({ isLoggedIn: true })
    this.loadProfile()
    this.loadCoachStatus()
  },

  loadProfile() {
    UserService.getProfile()
      .then((data) => {
        this.setData({
          userInfo: data,
          stats: data.stats || { total_bookings: 0, total_reviews: 0, total_activities: 0 }
        })
      })
      .catch(() => {
        // 模拟数据回退
        var u = mock.mockUser
        this.setData({
          userInfo: u,
          stats: u.stats || { total_bookings: 0, total_reviews: 0, total_activities: 0 }
        })
      })
  },

  loadCoachStatus() {
    CoachService.getMyCoachStatus().then(res => {
      this.setData({ coachInfo: res })
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

  goSettings() {
    wx.navigateTo({ url: '/pages/user/settings/index' })
  }
})
