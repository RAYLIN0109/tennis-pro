async function leave(db, OPENID, event) {
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
  
  const isJoined = (activity.participants || []).some(p => p.user_id === OPENID)
  if (!isJoined) {
    return { code: 4003, message: '未报名此活动' }
  }

  const newParticipants = (activity.participants || []).filter(p => p.user_id !== OPENID)
  const newStatus = activity.status === 'full' && newParticipants.length < activity.max_participants ? 'open' : activity.status

  await db.collection('activities').doc(id).update({
    data: {
      participants: newParticipants,
      current_count: newParticipants.length,
      status: newStatus,
      updated_at: new Date()
    }
  })

  return { code: 0, data: { message: '已退出活动' } }
}

module.exports = leave