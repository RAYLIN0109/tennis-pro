/**
 * 获取当前用户发表的所有评价
 */
module.exports = async function myList(db, openid, event) {
  const { page = 1, pageSize = 10 } = event
  const _ = db.command

  const condition = {
    created_by: openid,
    status: _.neq('hidden')
  }

  const { total } = await db.collection('reviews').where(condition).count()

  const skip = (page - 1) * pageSize
  const { data: reviews } = await db.collection('reviews')
    .where(condition)
    .orderBy('created_at', 'desc')
    .skip(skip)
    .limit(pageSize)
    .get()

  const orderIds = [...new Set(reviews.map(r => r.order_id).filter(Boolean))]
  let ordersMap = {}
  if (orderIds.length > 0) {
    const { data: orders } = await db.collection('orders')
      .where({ _id: _.in(orderIds) })
      .get()
    orders.forEach(o => { ordersMap[o._id] = o })
  }

  const list = reviews.map(r => ({
    ...r,
    order_snapshot: ordersMap[r.order_id]
      ? {
          order_type: ordersMap[r.order_id].order_type,
          date: ordersMap[r.order_id].date,
          resource_snapshot: ordersMap[r.order_id].resource_snapshot
        }
      : null
  }))

  return { code: 0, data: { list, total, page, pageSize } }
}
