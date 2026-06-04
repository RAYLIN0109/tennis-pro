async function list(db, OPENID, event) {
  const { page = 1, pageSize = 20, type = '', status = '' } = event
  const col = db.collection('activities')

  let condition = {}

  if (type === 'my') {
    // 我创建的活动
    condition.creator_id = OPENID
    if (status) {
      condition.status = status
    }
  } else if (type === 'joined') {
    // 我参与的活动（包含创建的和报名的）
    condition = db.command.or([
      { creator_id: OPENID },
      { 'participants.user_id': OPENID }
    ])
  } else {
    condition.status = status || 'open'
    if (type) {
      condition.type = type
    }
  }

  const { total } = await col.where(condition).count()
  const { data } = await col
    .where(condition)
    .orderBy('start_time', 'asc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()

  const activities = await Promise.all(data.map(async activity => {
    const creator = await db.collection('users')
      .where({ _openid: activity.creator_id })
      .field({ nickname: true, avatar_url: true })
      .get()
    return {
      ...activity,
      creator_info: creator.data[0] || null,
      participants_count: activity.participants?.length || 0
    }
  }))

  return { code: 0, data: { list: activities, total, page, pageSize } }
}

module.exports = list