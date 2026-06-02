const OrderService = require('../../../services/order')
const { ORDER_STATUS, ORDER_STATUS_MAP, ORDER_TYPE_MAP } = require('../../../common/constants/order')
const { price } = require('../../../utils/formatter')
const { formatDate } = require('../../../utils/date')
var mock = require('../../../common/mock-data')

Page({
  data: {
    tabs: [
      { key: '', label: '全部' },
      { key: 'pending_payment', label: '待付款' },
      { key: 'paid', label: '待使用' },
      { key: 'completed', label: '已完成' }
    ],
    currentTab: 0,
    statusFilter: '',
    list: [],
    page: 1,
    pageSize: 10,
    total: 0,
    loading: false,
    hasMore: true
  },

  onShow() {
    this.loadData(true)
  },

  onPullDownRefresh() {
    this.loadData(true).then(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) this.loadData(false)
  },

  onTabChange(e) {
    const idx = e.currentTarget.dataset.index
    const tab = this.data.tabs[idx]
    this.setData({ currentTab: idx, statusFilter: tab.key })
    this.loadData(true)
  },

  loadData(reset) {
    if (this.data.loading) return Promise.resolve()
    const page = reset ? 1 : this.data.page
    this.setData({ loading: true })
    if (reset) this.setData({ list: [], hasMore: true })

    const params = { page, pageSize: this.data.pageSize }
    if (this.data.statusFilter) params.status = this.data.statusFilter

    return OrderService.getList(params)
      .then((res) => {
        const list = res.list.map((o) => ({
          ...o,
          statusLabel: ORDER_STATUS_MAP[o.status] ? ORDER_STATUS_MAP[o.status].label : o.status,
          statusColor: ORDER_STATUS_MAP[o.status] ? ORDER_STATUS_MAP[o.status].color : 'accent',
          typeLabel: ORDER_TYPE_MAP[o.order_type] || '',
          priceText: price(o.total_amount),
          dateText: formatDate(o.created_at, 'YYYY-MM-DD HH:mm')
        }))
        const newList = reset ? list : [...this.data.list, ...list]
        this.setData({
          list: newList,
          total: res.total,
          page: page + 1,
          hasMore: newList.length < res.total
        })
      })
      .catch(() => {
        var list = mock.mockOrders
        if (this.data.statusFilter) {
          list = list.filter(function(o) { return o.status === this.data.statusFilter }.bind(this))
        }
        list = list.map(function(o) {
          return Object.assign({}, o, {
            statusLabel: ORDER_STATUS_MAP[o.status] ? ORDER_STATUS_MAP[o.status].label : o.status,
            statusColor: ORDER_STATUS_MAP[o.status] ? ORDER_STATUS_MAP[o.status].color : 'accent',
            typeLabel: ORDER_TYPE_MAP[o.order_type] || '',
            priceText: price(o.total_amount),
            dateText: formatDate(o.created_at, 'YYYY-MM-DD HH:mm')
          })
        })
        this.setData({ list: list, total: list.length, hasMore: false })
      })
      .finally(() => { this.setData({ loading: false }) })
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/order/detail/index?id=${id}` })
  },

  goPay(e) {
    const id = e.currentTarget.dataset.id
    OrderService.pay(id).then(() => {
      wx.showToast({ title: '支付成功', icon: 'success' })
      this.loadData(true)
    }).catch((err) => {
      wx.showToast({ title: err.message, icon: 'none' })
    })
  },

  onCancel(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认取消',
      content: '确定要取消此预约吗？',
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          OrderService.cancel(id, '用户主动取消').then(() => {
            wx.showToast({ title: '已取消', icon: 'success' })
            this.loadData(true)
          })
        }
      }
    })
  },

  goReview(e) {
    const id = e.currentTarget.dataset.id
    const order = this.data.list.find((o) => o._id === id)
    if (order) {
      wx.navigateTo({
        url: `/pages/review/create/index?orderId=${id}&targetType=${order.resource_type}&targetId=${order.resource_id}`
      })
    }
  }
})
