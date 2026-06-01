const CoachService = require('../../services/coach')
const ScheduleService = require('../../services/schedule')
const { getToday, addDays, getDateTabLabel, formatDate } = require('../../utils/date')
var mock = require('../../common/mock-data')

Page({
  data: {
    coachId: '',
    coach: null,
    loading: true,
    dates: [],
    selectedDateIndex: 0,
    selectedDate: '',
    schedule: null,
    slots: [],
    selectedSlotIndexes: [],
    selectedSlots: [],
    recentReviews: [],
    reviewCount: 0
  },

  onLoad(options) {
    const coachId = options.id
    if (!coachId) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      return
    }
    this.setData({ coachId })
    this.initDates()
    this.loadDetail()
    this.loadSchedule()
  },

  initDates() {
    const today = getToday()
    const dates = []
    for (let i = 0; i < 7; i++) {
      const d = addDays(today, i)
      dates.push({ date: formatDate(d, 'YYYY-MM-DD'), label: getDateTabLabel(d) })
    }
    this.setData({ dates, selectedDate: dates[0].date, selectedDateIndex: 0 })
  },

  loadDetail() {
    var self = this
    CoachService.getDetail(this.data.coachId)
      .then(function(data) {
        self.setData({
          coach: data,
          recentReviews: data.recent_reviews || [],
          reviewCount: data.review_stats ? data.review_stats.count : 0,
          loading: false
        })
      })
      .catch(function() {
        var found = null
        for (var i = 0; i < mock.mockCoaches.length; i++) {
          if (mock.mockCoaches[i]._id === self.data.coachId) { found = mock.mockCoaches[i]; break }
        }
        if (!found) found = mock.mockCoaches[0]
        self.setData({
          coach: found,
          recentReviews: mock.mockReviews,
          reviewCount: found.review_count || 0,
          loading: false
        })
      })
  },

  loadSchedule() {
    var self = this
    ScheduleService.getSchedule(this.data.coachId, 'coach', this.data.selectedDate)
      .then(function(data) {
        self.setData({
          schedule: data,
          slots: data.slots || [],
          selectedSlotIndexes: [],
          selectedSlots: []
        })
      })
      .catch(function() {
        self.setData({
          schedule: { _id: 'mock_schedule' },
          slots: mock.generateMockSlots(),
          selectedSlotIndexes: [],
          selectedSlots: []
        })
      })
  },

  onDateChange(e) {
    const idx = e.currentTarget.dataset.index
    this.setData({ selectedDateIndex: idx, selectedDate: this.data.dates[idx].date })
    this.loadSchedule()
  },

  onSlotChange(e) {
    this.setData({ selectedSlotIndexes: e.detail.indexes, selectedSlots: e.detail.slots })
  },

  goBook() {
    if (this.data.selectedSlotIndexes.length === 0) {
      wx.showToast({ title: '请选择预约时段', icon: 'none' })
      return
    }
    var params = {
      coachId: this.data.coachId,
      date: this.data.selectedDate,
      scheduleId: this.data.schedule._id,
      slotIndexes: JSON.stringify(this.data.selectedSlotIndexes)
    }
    var query = Object.keys(params).map(function(k) { return k + '=' + params[k] }).join('&')
    wx.navigateTo({ url: '/pages/coach/book/index?' + query })
  },

  goReviewList() {
    wx.navigateTo({ url: '/pages/review/list/index?targetType=coach&targetId=' + this.data.coachId })
  },

  onShareAppMessage() {
    var coach = this.data.coach
    return {
      title: coach ? (coach.real_name || '优秀教练') + ' - Tennis Eco' : '推荐教练',
      path: '/pages/coach/detail/index?id=' + this.data.coachId
    }
  }
})
