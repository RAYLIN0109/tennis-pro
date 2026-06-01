/**
 * 创建订单
 * 同时预约时段
 */
module.exports = async function create(db, openid, event) {
  const {
    orderType, resourceId, resourceType, scheduleId, slotIndexes,
    date, totalAmount, contactPhone, notes, timeRange,
    resourceSnapshot, extra
  } = event

  if (!resourceId || !slotIndexes || !slotIndexes.length) {
    return { code: 9002, message: '缺少必要参数' }
  }

  // 生成订单号
  const orderNo = `TE${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`
  const now = new Date()

  const orderData = {
    order_no: orderNo,
    order_type: orderType,
    status: 'pending_payment',
    created_by: openid,
    resource_id: resourceId,
    resource_type: resourceType,
    resource_snapshot: resourceSnapshot || {},
    date,
    time_range: timeRange || {},
    duration_minutes: slotIndexes.length * 30,
    total_amount: totalAmount || 0,
    paid_amount: 0,
    schedule_id: scheduleId,
    slot_indexes: slotIndexes,
    contact_phone: contactPhone || '',
    notes: notes || '',
    extra: extra || {},
    paid_at: null,
    cancelled_at: null,
    cancel_reason: '',
    completed_at: null,
    reviewed: false,
    created_at: now,
    updated_at: now
  }

  // 预约时段（原子操作）
  const bookSlot = require('../../schedule/actions/bookSlot')
  const bookResult = await bookSlot(db, openid, {
    scheduleId,
    slotIndexes,
    bookedBy: openid,
    orderRef: orderNo
  })

  if (bookResult.code !== 0) {
    return bookResult
  }

  // 创建订单，失败时回滚已预约的时段
  try {
    const { _id } = await db.collection('orders').add({ data: orderData })
    orderData._id = _id
    return { code: 0, data: orderData }
  } catch (err) {
    const releaseSlot = require('../../schedule/actions/releaseSlot')
    await releaseSlot(db, { scheduleId, slotIndexes }).catch(() => {})
    throw err
  }
}
