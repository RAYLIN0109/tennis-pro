/**
 * Edit an activity (creator only)
 * - Only the creator can edit
 * - Can only edit 'open' status activities
 * - If there are participants (joined by others), time/location/max_participants cannot be changed
 * - The following fields may be edited:
 *   title, description, start_time, end_time, location, max_participants,
 *   min_participants, type, fee, fee_type, cover_image, tags
 * - Fee is converted to cents (分) for consistency with create action
 */
async function edit(db, OPENID, event) {
  const { id, ...updates } = event

  if (!id) {
    return { code: 4001, message: '缺少活动ID' }
  }

  // Validate editable fields
  const allowedFields = [
    'title', 'description', 'start_time', 'end_time',
    'location', 'max_participants', 'min_participants',
    'type', 'fee', 'fee_type',
    'cover_image', 'tags'
  ]

  const { data: activities } = await db.collection('activities')
    .where({ _id: id })
    .get()

  if (activities.length === 0) {
    return { code: 4004, message: '活动不存在' }
  }

  const activity = activities[0]

  // Only creator can edit
  if (activity.creator_id !== OPENID) {
    return { code: 4003, message: '只有创建者才能编辑活动' }
  }

  // Can only edit open activities
  if (activity.status !== 'open') {
    return { code: 4003, message: '当前状态不允许编辑' }
  }

  // Filter allowed fields
  const dataToUpdate = {}
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      // Convert fee from yuan to cents (分) for consistency with create action
      if (field === 'fee') {
        dataToUpdate[field] = parseFloat(updates[field]) * 100
        // Also ensure fee_type is in sync
        if (updates.fee_type === undefined) {
          dataToUpdate.fee_type = parseFloat(updates[field]) > 0 ? 'paid' : 'free'
        }
      } else {
        dataToUpdate[field] = updates[field]
      }
    }
  }

  // If others have joined, restrict editing time/location/capacity
  const hasOtherParticipants = (activity.participants || []).length > 0
  if (hasOtherParticipants) {
    const restrictedFields = ['start_time', 'end_time', 'location', 'max_participants']
    const attemptedRestricted = restrictedFields.filter(f => dataToUpdate[f] !== undefined)
    if (attemptedRestricted.length > 0) {
      return {
        code: 4003,
        message: `已有其他球友报名，无法修改：${restrictedFields.join('、')}。如需修改，请先取消活动后重新创建`
      }
    }
  }

  // Validate time
  const newStartTime = dataToUpdate.start_time || activity.start_time
  const newEndTime = dataToUpdate.end_time || activity.end_time

  if (newStartTime && newEndTime) {
    if (new Date(newEndTime) <= new Date(newStartTime)) {
      return { code: 4002, message: '结束时间必须晚于开始时间' }
    }
  }

  // Validate start_time is not in the past
  if (dataToUpdate.start_time && new Date(dataToUpdate.start_time) < new Date()) {
    return { code: 4002, message: '开始时间不能早于当前时间' }
  }

  if (Object.keys(dataToUpdate).length === 0) {
    return { code: 4002, message: '没有需要更新的字段' }
  }

  dataToUpdate.updated_at = new Date()

  await db.collection('activities').doc(id).update({
    data: dataToUpdate
  })

  return { code: 0, data: { message: '活动已更新', updated_fields: Object.keys(dataToUpdate) } }
}

module.exports = edit