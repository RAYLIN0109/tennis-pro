/**
 * 释放时段（取消预约时调用）
 */
module.exports = async function releaseSlot(db, event) {
  const { scheduleId, slotIndexes } = event

  if (!scheduleId || !slotIndexes || !slotIndexes.length) {
    return { code: 9002, message: '缺少必要参数' }
  }

  const schedulesCol = db.collection('schedules')
  const updateData = {}

  for (const idx of slotIndexes) {
    updateData[`slots.${idx}.status`] = 'available'
    updateData[`slots.${idx}.booked_by`] = null
    updateData[`slots.${idx}.order_ref`] = null
    updateData[`slots.${idx}.booked_at`] = null
  }

  await schedulesCol.doc(scheduleId).update({ data: updateData })

  return { code: 0, data: { released: slotIndexes } }
}
