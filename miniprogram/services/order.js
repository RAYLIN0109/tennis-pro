const { get, post } = require('../utils/request')

const OrderService = {
  create(data) {
    return post('order', 'create', data, '创建订单中...')
  },

  getDetail(orderId) {
    return get('order', 'detail', { orderId })
  },

  getList(params) {
    return get('order', 'list', params)
  },

  pay(orderId) {
    return post('order', 'pay', { orderId }, '支付中...')
  },

  cancel(orderId, reason) {
    return post('order', 'cancel', { orderId, reason }, '取消中...')
  },

  confirm(orderId) {
    return post('order', 'confirm', { orderId })
  }
}

module.exports = OrderService
