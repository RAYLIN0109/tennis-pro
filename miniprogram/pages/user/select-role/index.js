Page({
  data: {
    userInfo: null
  },

  onLoad() {
    const app = getApp()
    this.setData({ userInfo: app.globalData.userInfo })
  },

  // 选择"我是学员"—— 直接回到首页（role 默认已是 ['user']）
  selectStudent() {
    wx.switchTab({ url: '/pages/index/index' })
  },

  // 选择"我是教练"—— 跳转申请页
  selectCoach() {
    wx.navigateTo({ url: '/pages/user/coach-apply/index' })
  }
})
