/**
 * 预约时段
 * 使用条件更新实现原子操作，防止重复预约
 */
module.exports = async function bookSlot(db, openid, event) {
  const { scheduleId, slotIndexes, bookedBy, orderRef } = event

  if (!scheduleId || !slotIndexes || !slotIndexes.length) {
    return { code: 9002, message: '缺少必要参数' }
  }

  const schedulesCol = db.collection('schedules')
  const _ = db.command

  // 逐个时段进行条件更新
  const results = []
  for (const slotIndex of slotIndexes) {
    // 条件更新：只更新 status 为 'available' 的时段
    const res = await schedulesCol
      .where({
        _id: scheduleId,
        [`slots.${slotIndex}.status`]: 'available'
      })
      .update({
        data: {
          [`slots.${slotIndex}.status`]: 'booked',
          [`slots.${slotIndex}.booked_by`]: bookedBy || openid,
          [`slots.${slotIndex}.order_ref`]: orderRef || '',
          [`slots.${slotIndex}.booked_at`]: new Date()
        }
      })

    if (res.stats.updated === 0) {
      // 时段已被预约，回滚之前的成功预约
      if (results.length > 0) {
        for (const prevIndex of results) {
          await schedulesCol.doc(scheduleId).update({
            data: {
              [`slots.${prevIndex}.status`]: 'available',
              [`slots.${prevIndex}.booked_by`]: null,
              [`slots.${prevIndex}.order_ref`]: null,
              [`slots.${prevIndex}.booked_at`]: null
            }
          })
        }
      }
      return { code: 4001, message: '部分时段已被预约，请重新选择' }
    }

    results.push(slotIndex)
  }

  return { code: 0, data: { booked: slotIndexes } }
}
