const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

async function join(db, OPENID, event) {
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
  
  if (activity.status !== 'open') {
    return { code: 4002, message: '活动已结束或已满' }
  }

  const isJoined = (activity.participants || []).some(p => p.user_id === OPENID)
  if (isJoined) {
    return { code: 4003, message: '已报名此活动' }
  }

  if (activity.current_count >= activity.max_participants) {
    return { code: 4002, message: '活动已满员' }
  }

  const newParticipants = [
    ...(activity.participants || []),
    { user_id: OPENID, joined_at: new Date() }
  ]

  const newStatus = newParticipants.length >= activity.max_participants ? 'full' : 'open'

  await db.collection('activities').doc(id).update({
    data: {
      participants: newParticipants,
      current_count: newParticipants.length,
      status: newStatus,
      updated_at: new Date()
    }
  })

  // 异步发送活动报名成功模板消息
  const loc = activity.location
  const locationStr = loc ? (loc.name || loc.address || '') : ''
  cloud.callFunction({
    name: 'notification',
    data: {
      action: 'sendTemplate',
      templateType: 'activity_reminder',
      openid: OPENID,
      page: `pages/activity/detail/index?id=${id}`,
      data: {
        activityTitle: activity.title,
        startTime: new Date(activity.start_time).toLocaleString('zh-CN'),
        location: locationStr,
        tip: '报名成功，请按时参加活动'
      }
    }
  }).catch(err => console.error('[activity:join] 发送模板消息失败:', err))

  return { code: 0, data: { message: '报名成功' } }
}

module.exports = join