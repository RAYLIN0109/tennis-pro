Page({
  data: {
    currentTab: 0,
    tabs: ['约球', '观赛', '我的活动']
  },
  onTabChange(e) { this.setData({ currentTab: e.currentTarget.dataset.index }) },
  onCreate() { wx.showToast({ title: '即将开放', icon: 'none' }) }
})
