/**
 * 生成排期
 * 以30分钟为一个时段，从 07:00 到 22:00
 */
const SLOT_DURATION = 30
const DAY_START_HOUR = 7
const DAY_START_MIN = 0
const DAY_END_HOUR = 22
const DAY_END_MIN = 0

module.exports = async function generateSchedule(db, event) {
  const { resourceId, resourceType, date } = event

  if (!resourceId || !resourceType || !date) {
    return { code: 9002, message: '缺少必要参数' }
  }

  // 检查是否已存在
  const { data: existing } = await db.collection('schedules')
    .where({ resource_id: resourceId, resource_type: resourceType, date })
    .limit(1)
    .get()

  if (existing.length > 0) {
    return { code: 0, data: existing[0] }
  }

  // 获取资源定价信息
  let defaultPrice = 0
  if (resourceType === 'coach') {
    try {
      const coachDoc = await db.collection('coaches').doc(resourceId).get()
      defaultPrice = coachDoc.data.hourly_rate || 0
    } catch (e) {
      // ignore
    }
  }

  // 生成时段列表
  const slots = []
  let current = DAY_START_HOUR * 60 + DAY_START_MIN
  const end = DAY_END_HOUR * 60 + DAY_END_MIN

  while (current + SLOT_DURATION <= end) {
    const h = Math.floor(current / 60)
    const m = current % 60
    const nextMin = current + SLOT_DURATION
    const nh = Math.floor(nextMin / 60)
    const nm = nextMin % 60

    const startTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    const endTime = `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`

    // 教练：按时长比例计算时段价格
    const slotPrice = resourceType === 'coach'
      ? Math.round(defaultPrice * SLOT_DURATION / 60)
      : defaultPrice

    slots.push({
      slot_id: `${startTime.replace(':', '')}`,
      start_time: startTime,
      end_time: endTime,
      status: 'available',
      price: slotPrice,
      booked_by: null
    })

    current += SLOT_DURATION
  }

  const now = new Date()
  const scheduleData = {
    resource_id: resourceId,
    resource_type: resourceType,
    date,
    slots,
    created_at: now,
    updated_at: now
  }

  const { _id } = await db.collection('schedules').add({ data: scheduleData })

  return { code: 0, data: { _id, ...scheduleData } }
}
