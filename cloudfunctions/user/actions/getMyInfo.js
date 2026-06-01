/**
 * 获取用户简要信息（用于头部展示）
 */
module.exports = async function getMyInfo(db, openid) {
  const { data } = await db.collection('users').where({ _openid: openid }).limit(1).get()

  if (data.length === 0) {
    return { code: 1001, message: '用户不存在' }
  }

  const user = data[0]
  return {
    code: 0,
    data: {
      _id: user._id,
      _openid: user._openid,
      nickname: user.nickname,
      avatar_url: user.avatar_url,
      tennis_level: user.tennis_level,
      role: user.role,
      status: user.status,
      stats: user.stats
    }
  }
}
