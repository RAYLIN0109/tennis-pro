async function detail(db, OPENID, event) {
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
  
  const creator = await db.collection('users')
    .where({ _openid: activity.creator_id })
    .field({ nickname: true, avatar_url: true, tennis_level: true })
    .get()

  const participants = await Promise.all(
    (activity.participants || []).map(async p => {
      const user = await db.collection('users')
        .where({ _openid: p.user_id })
        .field({ nickname: true, avatar_url: true, tennis_level: true })
        .get()
      return { ...p, user_info: user.data[0] || null }
    })
  )

  return {
    code: 0,
    data: {
      ...activity,
      creator_info: creator.data[0] || null,
      participants
    }
  }
}

module.exports = detail