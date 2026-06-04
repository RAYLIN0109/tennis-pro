/**
 * 取消订单（释放时段通过 schedule 云函数）
 */
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

module.exports = async function cancel(db, openid, event) {
  const { orderId, reason } = event
  if (!orderId) return { code: 9002, message: '缺少订单ID' }

  const orderDoc = await db.collection('orders').doc(orderId).get()
  const order = orderDoc.data

  if (order.created_by !== openid) {
    return { code: 5001, message: '无权操作此订单' }
  }

  const cancellable = ['pending_payment', 'paid']
  if (!cancellable.includes(order.status)) {
    return { code: 5003, message: '当前状态不允许取消' }
  }

  const now = new Date()

  await db.collection('orders').doc(orderId).update({
    data: {
      status: 'cancelled',
      cancelled_at: now,
      cancel_reason: reason || '',
      updated_at: now
    }
  })

  // 释放时段（通过 schedule 云函数）
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

  // 异步发送订单取消模板消息
  cloud.callFunction({
    name: 'notification',
    data: {
      action: 'sendTemplate',
      templateType: 'order_cancel',
      openid,
      page: 'pages/order/list/index',
      data: {
        title: order.resource_snapshot?.name || '网球服务订单',
        orderNo: order.order_no,
        cancelTime: now.toLocaleString('zh-CN'),
        reason: reason || '用户主动取消'
      }
    }
  }).catch(err => console.error('[order:cancel] 发送模板消息失败:', err))

  return { code: 0, data: { orderId } }
}
