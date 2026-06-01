/**
 * 支付订单
 * 开发模式：模拟支付
 */
module.exports = async function pay(db, openid, cloud, event) {
  const { orderId } = event
  if (!orderId) return { code: 9002, message: '缺少订单ID' }

  const orderDoc = await db.collection('orders').doc(orderId).get()
  const order = orderDoc.data

  if (order.created_by !== openid) {
    return { code: 5001, message: '无权操作此订单' }
  }
  if (order.status !== 'pending_payment') {
    return { code: 5002, message: '订单状态不允许支付' }
  }

  const now = new Date()

  // 开发模式：直接标记为已支付
  await db.collection('orders').doc(orderId).update({
    data: {
      status: 'paid',
      paid_amount: order.total_amount,
      paid_at: now,
      updated_at: now
    }
  })

  // 更新用户统计
  await db.collection('users').where({ _openid: openid }).update({
    data: {
      'stats.total_bookings': db.command.inc(1),
      updated_at: now
    }
  })

  return { code: 0, data: { simulated: true, orderId } }
}
