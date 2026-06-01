/**
 * 订单列表
 */
module.exports = async function list(db, openid, event) {
  const { page = 1, pageSize = 10, status, orderType } = event

  const ordersCol = db.collection('orders')
  const _ = db.command

  let condition = { created_by: openid }
  if (status) {
    condition.status = status
  }
  if (orderType) {
    condition.order_type = orderType
  }

  const { total } = await ordersCol.where(condition).count()
  const skip = (page - 1) * pageSize

  const { data: orders } = await ordersCol
    .where(condition)
    .orderBy('created_at', 'desc')
    .skip(skip)
    .limit(pageSize)
    .get()

  return { code: 0, data: { list: orders, total, page, pageSize } }
}
