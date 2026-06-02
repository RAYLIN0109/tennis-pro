App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 以上的基础库以使用云能力')
    } else {
      try {
        wx.cloud.init({
          env: 'cloud1-d6ggdck56e7b16eac', // 用户云环境（2026-06-02 配置）
          traceUser: true
        })
      } catch (e) {
        console.warn('云开发初始化失败（暂无云环境）:', e.message)
      }
    }

    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync()
    this.globalData.systemInfo = systemInfo
    this.globalData.statusBarHeight = systemInfo.statusBarHeight
    this.globalData.navBarHeight = 44
    this.globalData.safeAreaBottom = systemInfo.screenHeight - systemInfo.safeArea.bottom

    // 静默登录尝试（不阻塞首屏，失败绝不弹 toast）
    this.silentLogin()
  },

  silentLogin() {
    const { request } = require('./utils/request')
    request('user', 'login', {}, { showLoading: false, showError: false })
      .then((data) => {
        this.globalData.openid = data._openid
        this.globalData.userInfo = data
        console.log('[silentLogin] success', data._openid)
      })
      .catch((err) => {
        console.log('[silentLogin] fail（无云环境或首次）', err.message || 'unknown')
      })
  },

  globalData: {
    userInfo: null,
    openid: null,
    systemInfo: null,
    statusBarHeight: 0,
    navBarHeight: 44,
    safeAreaBottom: 0
  }
})
