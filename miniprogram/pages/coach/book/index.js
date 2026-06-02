const CoachService = require('../../../services/coach')
const { get, post } = require('../../../utils/request')
const { priceShort } = require('../../../utils/formatter')
const { formatDuration } = require('../../../utils/date')
const { ensureLogin } = require('../../../utils/auth')

Page({
  data: {
    coachId: '',
    date: '',
    scheduleId: '',
    slotIndexes: [],
    coach: null,
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
      coachId: options.coachId,
      date: options.date,
      scheduleId: options.scheduleId,
      slotIndexes
    })
    this.loadCoach()
    this.loadSchedule()
  },

  loadCoach() {
    CoachService.getDetail(this.data.coachId).then((data) => {
      this.setData({ coach: data })
    })
  },

  loadSchedule() {
    get('schedule', 'getSchedule', {
      resourceId: this.data.coachId,
      resourceType: 'coach',
      date: this.data.date
    }).then((data) => {
      const slots = (data.slots || []).filter((_, i) => this.data.slotIndexes.includes(i))
      const totalAmount = slots.reduce((sum, s) => sum + (s.price || 0), 0)
      const durationMinutes = slots.length * 30

      this.setData({ slots, totalAmount, durationMinutes })
    })
  },

  onInputPhone(e) {
    this.setData({ contactPhone: e.detail.value })
  },

  onInputNotes(e) {
    this.setData({ notes: e.detail.value })
  },

  onSubmit() {
    ensureLogin().then(() => {
      if (this.data.submitting) return
      this.setData({ submitting: true })

      const orderData = {
        orderType: 'coach_booking',
        resourceId: this.data.coachId,
        resourceType: 'coach',
        scheduleId: this.data.scheduleId,
        slotIndexes: this.data.slotIndexes,
        date: this.data.date,
        totalAmount: this.data.totalAmount,
        contactPhone: this.data.contactPhone,
        notes: this.data.notes,
        resourceSnapshot: {
          name: this.data.coach ? (this.data.coach.real_name || '') : '',
          avatar: this.data.coach && this.data.coach.user_info ? this.data.coach.user_info.avatar_url : ''
        }
      }

      // 获取时段范围
      if (this.data.slots.length > 0) {
        const first = this.data.slots[0]
        const last = this.data.slots[this.data.slots.length - 1]
        orderData.timeRange = { start: first.start_time, end: last.end_time }
      }

      let createdOrder = null

      post('order', 'create', orderData, '创建订单中...')
        .then((order) => {
          createdOrder = order
          // 开发模式直接模拟支付
          return post('order', 'pay', { orderId: order._id }, '支付中...')
        })
        .then(() => {
          wx.showToast({ title: '预约成功', icon: 'success' })
          setTimeout(() => {
            wx.redirectTo({ url: `/pages/order/detail/index?id=${createdOrder._id}` })
          }, 1500)
        })
        .catch((err) => {
          // 如果订单已创建，引导用户到订单详情页重试支付
          if (createdOrder) {
            wx.showModal({
              title: '支付提示',
              content: err.message || '支付失败，可在订单详情页重试',
              confirmText: '查看订单',
              cancelText: '稍后处理',
              success: (res) => {
                if (res.confirm) {
                  wx.redirectTo({ url: `/pages/order/detail/index?id=${createdOrder._id}` })
                } else {
                  wx.switchTab({ url: '/pages/index/index' })
                }
              }
            })
          } else {
            wx.showToast({ title: err.message || '预约失败', icon: 'none' })
          }
        })
        .finally(() => {
          this.setData({ submitting: false })
        })
    })
  }
})
