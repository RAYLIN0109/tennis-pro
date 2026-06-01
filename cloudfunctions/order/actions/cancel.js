/**
 * 取消订单
 */
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

  // 释放时段
  if (order.schedule_id && order.slot_indexes) {
    const releaseSlot = require('../../schedule/actions/releaseSlot')
    await releaseSlot(db, {
      scheduleId: order.schedule_id,
      slotIndexes: order.slot_indexes
    })
  }

  return { code: 0, data: { orderId } }
}
