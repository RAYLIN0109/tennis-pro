const OrderService = require('../../../services/order')
const { ORDER_STATUS_MAP, ORDER_TYPE_MAP } = require('../../../common/constants/order')
const { price } = require('../../../utils/formatter')
const { formatDate } = require('../../../utils/date')
const { subscribeOrder } = require('../../../utils/subscribe')
var mock = require('../../../common/mock-data')

Page({
  data: {
    orderId: '',
    order: null,
    loading: true
  },

  onLoad(options) {
    if (!options.id) return
    this.setData({ orderId: options.id })
    this.loadDetail()
  },

  onShow() {
    if (this.data.orderId && !this.data.loading) this.loadDetail()
  },

  loadDetail() {
    OrderService.getDetail(this.data.orderId)
      .then((data) => {
        this.setData({
          order: {
            ...data,
            statusLabel: ORDER_STATUS_MAP[data.status] ? ORDER_STATUS_MAP[data.status].label : data.status,
            statusColor: ORDER_STATUS_MAP[data.status] ? ORDER_STATUS_MAP[data.status].color : 'accent',
            typeLabel: ORDER_TYPE_MAP[data.order_type] || '',
            priceText: price(data.total_amount),
            createdText: formatDate(data.created_at, 'YYYY-MM-DD HH:mm'),
            paidText: data.paid_at ? formatDate(data.paid_at, 'YYYY-MM-DD HH:mm') : ''
          },
          loading: false
        })
      })
      .catch(() => {
        // 模拟数据回退
        var data = mock.mockOrders.find(function(o) { return o._id === this.data.orderId }.bind(this)) || mock.mockOrders[0]
        if (data) {
          this.setData({
            order: Object.assign({}, data, {
              statusLabel: ORDER_STATUS_MAP[data.status] ? ORDER_STATUS_MAP[data.status].label : data.status,
              statusColor: ORDER_STATUS_MAP[data.status] ? ORDER_STATUS_MAP[data.status].color : 'accent',
              typeLabel: ORDER_TYPE_MAP[data.order_type] || '',
              priceText: price(data.total_amount),
              createdText: formatDate(data.created_at, 'YYYY-MM-DD HH:mm'),
              paidText: data.status === 'pending_payment' ? '' : formatDate(data.created_at, 'YYYY-MM-DD HH:mm')
            }),
            loading: false
          })
        } else {
          this.setData({ loading: false })
        }
      })
  },

  goPay() {
    // 先请求订阅授权，再执行支付
    subscribeOrder().then(() => {
      OrderService.pay(this.data.orderId).then(() => {
        wx.showToast({ title: '支付成功', icon: 'success' })
        this.loadDetail()
      })
    })
  },

  onCancel() {
    wx.showModal({
      title: '确认取消',
      content: '取消后时段将被释放',
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          // 先请求订阅授权，再执行取消
          subscribeOrder().then(() => {
            OrderService.cancel(this.data.orderId, '用户主动取消').then(() => {
              wx.showToast({ title: '已取消', icon: 'success' })
              this.loadDetail()
            })
          })
        }
      }
    })
  },

  goReview() {
    const o = this.data.order
    wx.navigateTo({
      url: `/pages/review/create/index?orderId=${this.data.orderId}&targetType=${o.resource_type}&targetId=${o.resource_id}`
    })
  },

  copyOrderNo() {
    wx.setClipboardData({ data: this.data.order.order_no })
  },

  onShareAppMessage() {
    return { title: '订单详情 - Tennis Eco', path: `/pages/order/detail/index?id=${this.data.orderId}` }
  }
})
