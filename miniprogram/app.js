App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 以上的基础库以使用云能力')
    } else {
      try {
        wx.cloud.init({
          // env: 'your-env-id', // 接入云环境后替换为真实环境ID
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
