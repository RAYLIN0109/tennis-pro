Page({
  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '退出后需重新登录',
      success: (res) => {
        if (res.confirm) {
          const { logout } = require('../../../utils/auth')
          logout()
          wx.showToast({ title: '已退出', icon: 'success' })
          setTimeout(() => wx.switchTab({ url: '/pages/user/profile/index' }), 800)
        }
      }
    })
  },

  onClearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '将清除本地缓存数据，是否继续？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync()
          wx.showToast({ title: '已清除', icon: 'success' })
        }
      }
    })
  },

  goPrivacy() { wx.navigateTo({ url: '/pages/user/privacy/index' }) },
  goAgreement() { wx.navigateTo({ url: '/pages/user/agreement/index' }) }
})
