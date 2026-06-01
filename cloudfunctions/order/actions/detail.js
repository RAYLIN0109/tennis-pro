/**
 * 订单详情
 */
module.exports = async function detail(db, openid, event) {
  const { orderId } = event
  if (!orderId) return { code: 9002, message: '缺少订单ID' }

  const orderDoc = await db.collection('orders').doc(orderId).get()
  const order = orderDoc.data

  // 获取关联资源信息
  let resourceInfo = {}
  if (order.resource_type === 'coach' && order.resource_id) {
    try {
      const coachDoc = await db.collection('coaches').doc(order.resource_id).get()
      const coach = coachDoc.data
      resourceInfo = { name: coach.real_name, type: 'coach', specialties: coach.specialties }
    } catch (e) {}
  } else if (order.resource_type === 'venue' && order.resource_id) {
    try {
      const venueDoc = await db.collection('venues').doc(order.resource_id).get()
      resourceInfo = { name: venueDoc.data.name, type: 'venue' }
    } catch (e) {}
  }

  return {
    code: 0,
    data: {
      ...order,
      resource_info: {
        ...order.resource_snapshot,
        ...resourceInfo
      }
    }
  }
}
