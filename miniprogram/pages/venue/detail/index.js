const VenueService = require('../../services/venue')
const ScheduleService = require('../../services/schedule')
const { getToday, addDays, getDateTabLabel, formatDate } = require('../../utils/date')
const { openNavigation } = require('../../utils/location')
var mock = require('../../common/mock-data')

Page({
  data: {
    venueId: '',
    venue: null,
    loading: true,
    currentImageIndex: 0,
    // Courts
    selectedCourtIndex: 0,
    selectedCourtId: '',
    // Dates
    dates: [],
    selectedDateIndex: 0,
    selectedDate: '',
    // Schedule
    schedule: null,
    slots: [],
    selectedSlotIndexes: [],
    selectedSlots: [],
    selectedSlotTotal: 0,
    // Reviews
    reviewCount: 0,
    recentReviews: []
  },

  onLoad(options) {
    if (!options.id) return
    this.setData({ venueId: options.id })
    this.initDates()
    this.loadDetail()
  },

  initDates() {
    const today = getToday()
    const dates = []
    for (let i = 0; i < 7; i++) {
      const d = addDays(today, i)
      dates.push({ date: formatDate(d, 'YYYY-MM-DD'), label: getDateTabLabel(d) })
    }
    this.setData({ dates, selectedDate: dates[0].date })
  },

  loadDetail() {
    VenueService.getDetail(this.data.venueId)
      .then((data) => {
        this.setData({
          venue: data,
          reviewCount: data.review_stats ? data.review_stats.count : 0,
          recentReviews: data.recent_reviews || []
        })
        // 默认选第一个球场
        if (data.courts && data.courts.length > 0) {
          this.setData({
            selectedCourtIndex: 0,
            selectedCourtId: data.courts[0].id || data.courts[0]._id || 'court_0'
          })
        }
        this.setData({ loading: false })
        this.loadSchedule()
      })
      .catch(() => {
        // 模拟数据回退
        var venue = mock.mockVenues.find(function(v) { return v._id === this.data.venueId }.bind(this)) || mock.mockVenues[0]
        this.setData({
          venue: venue,
          reviewCount: venue.review_count || 0,
          recentReviews: mock.mockReviews.slice(0, 2)
        })
        if (venue.courts && venue.courts.length > 0) {
          this.setData({
            selectedCourtIndex: 0,
            selectedCourtId: venue.courts[0].id || venue.courts[0]._id || 'court_0'
          })
        }
        this.setData({ loading: false, slots: mock.generateMockSlots() })
      })
  },

  loadSchedule() {
    if (!this.data.selectedCourtId) return
    ScheduleService.getSchedule(this.data.selectedCourtId, 'venue', this.data.selectedDate)
      .then((data) => {
        this.setData({
          schedule: data,
          slots: data.slots || [],
          selectedSlotIndexes: [],
          selectedSlots: [],
          selectedSlotTotal: 0
        })
      })
      .catch(() => {
        this.setData({
          schedule: { _id: 'mock_schedule' },
          slots: mock.generateMockSlots(),
          selectedSlotIndexes: [],
          selectedSlots: [],
          selectedSlotTotal: 0
        })
      })
  },

  onImageChange(e) {
    this.setData({ currentImageIndex: e.detail.current })
  },

  onCourtChange(e) {
    const idx = e.currentTarget.dataset.index
    const court = this.data.venue.courts[idx]
    this.setData({
      selectedCourtIndex: idx,
      selectedCourtId: court.id || court._id || `court_${idx}`
    })
    this.loadSchedule()
  },

  onDateChange(e) {
    const idx = e.currentTarget.dataset.index
    this.setData({ selectedDateIndex: idx, selectedDate: this.data.dates[idx].date })
    this.loadSchedule()
  },

  onSlotChange(e) {
    const slots = e.detail.slots
    const total = slots.reduce((sum, s) => sum + (s.price || 0), 0)
    this.setData({ selectedSlotIndexes: e.detail.indexes, selectedSlots: slots, selectedSlotTotal: total })
  },

  goBook() {
    if (this.data.selectedSlotIndexes.length === 0) {
      wx.showToast({ title: '请选择预约时段', icon: 'none' })
      return
    }
    const params = {
      venueId: this.data.venueId,
      courtId: this.data.selectedCourtId,
      date: this.data.selectedDate,
      scheduleId: this.data.schedule._id,
      slotIndexes: JSON.stringify(this.data.selectedSlotIndexes)
    }
    const query = Object.keys(params).map((k) => `${k}=${params[k]}`).join('&')
    wx.navigateTo({ url: `/pages/venue/book/index?${query}` })
  },

  onNavigate() {
    const v = this.data.venue
    if (v && v.location) {
      openNavigation(v.location.latitude, v.location.longitude, v.name)
    }
  },

  goReviewList() {
    wx.navigateTo({ url: `/pages/review/list/index?targetType=venue&targetId=${this.data.venueId}` })
  },

  onShareAppMessage() {
    const v = this.data.venue
    return {
      title: v ? `${v.name} - Tennis Eco` : '推荐场馆',
      path: `/pages/venue/detail/index?id=${this.data.venueId}`
    }
  }
})
