const CoachService = require('../../services/coach')
const VenueService = require('../../services/venue')
const { getMyInfo } = require('../../utils/auth')
var mock = require('../../common/mock-data')

Page({
  data: {
    userInfo: null,
    recommendCoaches: [],
    hotVenues: [],
    loading: true
  },

  onShow() {
    getMyInfo().catch(() => {})
    this.loadRecommendCoaches()
    this.loadHotVenues()
  },

  onPullDownRefresh() {
    Promise.all([this.loadRecommendCoaches(), this.loadHotVenues()])
      .finally(() => wx.stopPullDownRefresh())
  },

  loadRecommendCoaches() {
    return CoachService.getList({ page: 1, pageSize: 3, sortBy: 'rating' })
      .then((res) => { this.setData({ recommendCoaches: res.list, loading: false }) })
      .catch(() => { this.setData({ recommendCoaches: mock.mockCoaches.slice(0, 3), loading: false }) })
  },

  loadHotVenues() {
    return VenueService.getList({ page: 1, pageSize: 4, sortBy: 'rating' })
      .then((res) => { this.setData({ hotVenues: res.list }) })
      .catch(() => { this.setData({ hotVenues: mock.mockVenues }) })
  },

  goCoachList() { wx.navigateTo({ url: '/pages/coach/list/index' }) },
  goVenueList() { wx.navigateTo({ url: '/pages/venue/list/index' }) },
  goActivity() { wx.navigateTo({ url: '/pages/activity/list/index' }) },
  goTennisCircle() { wx.switchTab({ url: '/pages/tennis-circle/index' }) },
  goMatch() { wx.showToast({ title: '即将开放', icon: 'none' }) },

  goCoachDetail(e) {
    wx.navigateTo({ url: `/pages/coach/detail/index?id=${e.currentTarget.dataset.id}` })
  },
  goVenueDetail(e) {
    wx.navigateTo({ url: `/pages/venue/detail/index?id=${e.currentTarget.dataset.id}` })
  }
})
