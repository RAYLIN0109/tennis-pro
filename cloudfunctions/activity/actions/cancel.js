/**
 * Cancel an activity (creator only)
 * - Sets status to 'cancelled'
 * - Only the creator can cancel
 * - Activities with status other than 'open'/'full' cannot be cancelled
 */
async function cancel(db, OPENID, event) {
  const { id } = event
  if (!id) {
    return { code: 4001, message: '缺少活动ID' }
  }

  const { data: activities } = await db.collection('activities')
    .where({ _id: id })
    .get()

  if (activities.length === 0) {
    return { code: 4004, message: '活动不存在' }
  }

  const activity = activities[0]

  // Only creator can cancel
  if (activity.creator_id !== OPENID) {
    return { code: 4003, message: '只有创建者才能取消活动' }
  }

  // Cannot cancel already cancelled or ended activities
  if (activity.status === 'cancelled') {
    return { code: 4003, message: '活动已取消' }
  }
  if (activity.status === 'ended') {
    return { code: 4003, message: '活动已结束，无法取消' }
  }

  await db.collection('activities').doc(id).update({
    data: {
      status: 'cancelled',
      updated_at: new Date()
    }
  })

  // Notify all participants (fire-and-forget, not critical)
  try {
    const participants = activity.participants || []
    if (participants.length > 0) {
      const notificationCol = db.collection('notifications')
      const now = new Date()
      const batch = participants.map(p => ({
        user_id: p.user_id,
        type: 'activity_cancelled',
        title: '活动已取消',
        content: `创建者已取消活动「${activity.title}」`,
        related_id: id,
        is_read: false,
        created_at: now
      }))
      // Insert notifications in batches of 10 (Firestore limit)
      for (let i = 0; i < batch.length; i += 10) {
        const chunk = batch.slice(i, i + 10)
        await Promise.all(chunk.map(n => notificationCol.add(n)))
      }
    }
  } catch (err) {
    console.error('[activity:cancel] 发送通知失败:', err)
    // Not blocking the cancellation
  }

  return { code: 0, data: { message: '活动已取消' } }
}

module.exports = cancel