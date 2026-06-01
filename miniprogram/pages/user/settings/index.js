const { logout } = require('../../utils/auth')

Page({
  data: {},

  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '退出登录后需要重新登录才能使用',
      confirmText: '退出',
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          logout()
          wx.switchTab({ url: '/pages/user/profile/index' })
        }
      }
    })
  },

  onClearCache() {
    try {
      wx.clearStorageSync()
      wx.showToast({ title: '缓存已清除', icon: 'success' })
    } catch (e) {
      wx.showToast({ title: '清除失败', icon: 'none' })
    }
  }
})
