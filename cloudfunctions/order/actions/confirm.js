/**
 * 确认订单完成
 */
module.exports = async function confirm(db, openid, event) {
  const { orderId } = event
  if (!orderId) return { code: 9002, message: '缺少订单ID' }

  // 校验订单归属
  const orderDoc = await db.collection('orders').doc(orderId).get()
  const order = orderDoc.data

  if (order.created_by !== openid) {
    return { code: 5001, message: '无权操作此订单' }
  }

  if (order.status !== 'paid') {
    return { code: 5002, message: '订单状态不允许确认' }
  }

  const now = new Date()
  await db.collection('orders').doc(orderId).update({
    data: {
      status: 'completed',
      completed_at: now,
      updated_at: now
    }
  })

  return { code: 0, data: { orderId } }
}
