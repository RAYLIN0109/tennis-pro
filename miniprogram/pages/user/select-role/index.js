Page({
  data: {
    userInfo: null
  },

  onLoad() {
    const app = getApp()
    this.setData({ userInfo: app.globalData.userInfo })
  },

  selectStudent() {
    wx.switchTab({ url: '/pages/index/index' })
  },

  selectCoach() {
    wx.navigateTo({ url: '/pages/user/coach-apply/index' })
  }
})
