/**
 * 教练详情
 */
module.exports = async function detail(db, event) {
  const { coachId } = event
  if (!coachId) {
    return { code: 9002, message: '缺少教练ID' }
  }

  // 获取教练信息
  const coachDoc = await db.collection('coaches').doc(coachId).get()
  const coach = coachDoc.data

  // 获取关联用户信息
  let userInfo = {}
  if (coach.user_id) {
    try {
      const { data: users } = await db.collection('users')
        .where({ _openid: coach.user_id })
        .limit(1)
        .get()
      if (users.length > 0) {
        const u = users[0]
        userInfo = {
          nickname: u.nickname,
          avatar_url: u.avatar_url,
          tennis_level: u.tennis_level
        }
      }
    } catch (e) {
      // User might not exist
    }
  }

  // 获取评价统计 测试
  const reviewsCol = db.collection('reviews')
  const { total: reviewCount } = await reviewsCol
    .where({ target_type: 'coach', target_id: coachId })
    .count()

  // 获取最近3条评价
  const { data: recentReviews } = await reviewsCol
    .where({ target_type: 'coach', target_id: coachId })
    .orderBy('created_at', 'desc')
    .limit(3)
    .get()

  return {
    code: 0,
    data: {
      ...coach,
      user_info: userInfo,
      review_stats: {
        count: reviewCount,
        average: coach.rating || 0
      },
      recent_reviews: recentReviews
    }
  }
}
