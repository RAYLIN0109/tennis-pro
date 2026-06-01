const VenueService = require('../../services/venue')
const { get, post } = require('../../utils/request')
const { ensureLogin } = require('../../utils/auth')

Page({
  data: {
    venueId: '',
    courtId: '',
    date: '',
    scheduleId: '',
    slotIndexes: [],
    venue: null,
    slots: [],
    totalAmount: 0,
    durationMinutes: 0,
    contactPhone: '',
    notes: '',
    submitting: false
  },

  onLoad(options) {
    const slotIndexes = options.slotIndexes ? JSON.parse(options.slotIndexes) : []
    this.setData({
      venueId: options.venueId,
      courtId: options.courtId || '',
      date: options.date,
      scheduleId: options.scheduleId,
      slotIndexes
    })
    this.loadVenue()
    this.loadSchedule()
  },

  loadVenue() {
    VenueService.getDetail(this.data.venueId).then((data) => {
      this.setData({ venue: data })
    })
  },

  loadSchedule() {
    get('schedule', 'getSchedule', {
      resourceId: this.data.courtId,
      resourceType: 'venue',
      date: this.data.date
    }).then((data) => {
      const slots = (data.slots || []).filter((_, i) => this.data.slotIndexes.includes(i))
      const totalAmount = slots.reduce((sum, s) => sum + (s.price || 0), 0)
      this.setData({ slots, totalAmount, durationMinutes: slots.length * 30 })
    })
  },

  onInputPhone(e) { this.setData({ contactPhone: e.detail.value }) },
  onInputNotes(e) { this.setData({ notes: e.detail.value }) },

  onSubmit() {
    ensureLogin().then(() => {
      if (this.data.submitting) return
      this.setData({ submitting: true })

      const orderData = {
        orderType: 'venue_booking',
        resourceId: this.data.venueId,
        resourceType: 'venue',
        scheduleId: this.data.scheduleId,
        slotIndexes: this.data.slotIndexes,
        date: this.data.date,
        totalAmount: this.data.totalAmount,
        contactPhone: this.data.contactPhone,
        notes: this.data.notes,
        extra: { courtId: this.data.courtId },
        resourceSnapshot: {
          name: this.data.venue ? this.data.venue.name : '',
          avatar: ''
        }
      }

      if (this.data.slots.length > 0) {
        orderData.timeRange = {
          start: this.data.slots[0].start_time,
          end: this.data.slots[this.data.slots.length - 1].end_time
        }
      }

      post('order', 'create', orderData, '创建订单中...')
        .then((order) => post('order', 'pay', { orderId: order._id }, '支付中...').then(() => order))
        .then((order) => {
          wx.showToast({ title: '预约成功', icon: 'success' })
          setTimeout(() => {
            wx.redirectTo({ url: `/pages/order/detail/index?id=${order._id}` })
          }, 1500)
        })
        .catch((err) => {
          wx.showToast({ title: err.message || '预约失败', icon: 'none' })
        })
        .finally(() => {
          this.setData({ submitting: false })
        })
    })
  }
})
