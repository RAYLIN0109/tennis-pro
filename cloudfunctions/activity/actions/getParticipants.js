/**
 * 获取活动参与者列表（含用户信息：头像/昵称/等级）
 */
async function getParticipants(db, OPENID, event) {
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

  // Get creator info
  const creator = await db.collection('users')
    .where({ _openid: activity.creator_id })
    .field({ nickname: true, avatar_url: true, tennis_level: true })
    .get()

  // Get participant user info
  const participantList = await Promise.all(
    (activity.participants || []).map(async p => {
      const user = await db.collection('users')
        .where({ _openid: p.user_id })
        .field({ nickname: true, avatar_url: true, tennis_level: true })
        .get()
      return {
        user_id: p.user_id,
        joined_at: p.joined_at,
        user_info: user.data[0] || null
      }
    })
  )

  return {
    code: 0,
    data: {
      creator_info: creator.data[0] || null,
      participants: participantList,
      total: participantList.length
    }
  }
}

module.exports = getParticipants