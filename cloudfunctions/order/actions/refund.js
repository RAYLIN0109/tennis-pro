/**
 * 退款功能
 * 支持开发模式和生产模式切换
 */
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

module.exports = async function refund(db, openid, event) {
  const { orderId, reason } = event
  if (!orderId) return { code: 9002, message: '缺少订单ID' }

  const orderDoc = await db.collection('orders').doc(orderId).get()
  const order = orderDoc.data

  if (!order) {
    return { code: 5004, message: '订单不存在' }
  }

  if (order.created_by !== openid) {
    return { code: 5001, message: '无权操作此订单' }
  }

  if (order.status !== 'paid') {
    return { code: 5003, message: '当前状态不允许退款' }
  }

  const now = new Date()
  const payMode = process.env.PAY_MODE || 'development'

  if (payMode === 'production') {
    // 生产模式：调用微信退款接口
    try {
      await cloud.cloudPay.refund({
        outTradeNo: order.order_no,
        outRefundNo: `R${Date.now()}`,
        totalFee: order.total_amount,
        refundFee: order.paid_amount
      })
    } catch (err) {
      console.error('[order:refund] 微信退款失败:', err)
      return { code: 5005, message: '退款接口调用失败' }
    }
  }

  // 更新订单状态
  await db.collection('orders').doc(orderId).update({
    data: {
      status: 'refunded',
      refunded_at: now,
      refunded_amount: order.paid_amount,
      refund_reason: reason || '',
      updated_at: now
    }
  })

  // 释放时段
  if (order.schedule_id && order.slot_indexes) {
    await cloud.callFunction({
      name: 'schedule',
      data: {
        action: 'releaseSlot',
        scheduleId: order.schedule_id,
        slotIndexes: order.slot_indexes
      }
    })
  }

  // 发送退款通知
  await db.collection('notifications').add({
    data: {
      user_id: openid,
      type: 'order_refund',
      title: '退款成功',
      content: `您的订单 ${order.order_no} 已退款 ¥${(order.paid_amount / 100).toFixed(2)}`,
      extra: { orderId, refundAmount: order.paid_amount },
      is_read: false,
      created_at: now
    }
  })

  return { code: 0, data: { orderId, refundedAmount: order.paid_amount } }
}