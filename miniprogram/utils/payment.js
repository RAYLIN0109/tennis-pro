const { request, post } = require('./request')

/**
 * 创建订单并发起支付
 * @param {Object} orderData - 订单数据
 * @returns {Promise} 支付结果
 */
function createAndPay(orderData) {
  return post('order', 'create', orderData, '创建订单中...')
    .then((order) => {
      return payOrder(order._id).then(() => order)
    })
}

/**
 * 发起支付
 * @param {string} orderId - 订单ID
 */
function payOrder(orderId) {
  return post('order', 'pay', { orderId }, '支付中...')
    .then((payResult) => {
      // 开发模式：直接模拟支付成功
      if (payResult.simulated) {
        return payResult
      }
      // 生产模式：调用微信支付
      return new Promise((resolve, reject) => {
        wx.requestPayment({
          ...payResult,
          success: (res) => resolve(res),
          fail: (err) => {
            if (err.errMsg.includes('cancel')) {
              reject(new Error('支付已取消'))
            } else {
              reject(err)
            }
          }
        })
      })
    })
}

/**
 * 处理支付结果 UI
 */
function handlePaySuccess(orderId) {
  wx.showToast({ title: '支付成功', icon: 'success' })
  setTimeout(() => {
    wx.redirectTo({ url: `/pages/order/detail/index?id=${orderId}` })
  }, 1500)
}

function handlePayFail(err) {
  if (err.message === '支付已取消') {
    wx.showToast({ title: '支付已取消', icon: 'none' })
  } else {
    wx.showToast({ title: '支付失败，请重试', icon: 'none' })
  }
}

module.exports = { createAndPay, payOrder, handlePaySuccess, handlePayFail }
