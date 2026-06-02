const { login } = require('../../../utils/auth')

Page({
  data: { logging: false },

  onLogin() {
    if (this.data.logging) return
    this.setData({ logging: true })

    login()
      .then(() => {
        wx.showToast({ title: '登录成功', icon: 'success' })
        setTimeout(() => wx.switchTab({ url: '/pages/user/profile/index' }), 1000)
      })
      .catch((err) => {
        wx.showToast({ title: err.message || '登录失败', icon: 'none' })
      })
      .finally(() => {
        this.setData({ logging: false })
      })
  },

  goPrivacy() { wx.navigateTo({ url: '/pages/user/privacy/index' }) },
  goAgreement() { wx.navigateTo({ url: '/pages/user/agreement/index' }) }
})
