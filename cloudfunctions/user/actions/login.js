/**
 * 用户登录/注册
 * 如果用户不存在，自动创建
 */
module.exports = async function login(db, cloud, openid, appid, event) {
  const usersCol = db.collection('users')

  // 查找已有用户
  const { data: existing } = await usersCol.where({ _openid: openid }).limit(1).get()

  if (existing.length > 0) {
    const user = existing[0]
    // 将云存储 fileID 转为临时可访问 URL
    if (user.avatar_url && user.avatar_url.startsWith('cloud://')) {
      try {
        const { fileList } = await cloud.getTempFileURL({
          fileList: [user.avatar_url]
        })
        if (fileList && fileList[0] && fileList[0].tempFileURL) {
          user.avatar_url = fileList[0].tempFileURL
        }
      } catch (e) {
        console.warn('[login] getTempFileURL failed:', e.message)
      }
    }
    return { code: 0, data: user }
  }

  // 创建新用户
  const now = new Date()
  const newUser = {
    _openid: openid,
    nickname: '',
    avatar_url: '',
    gender: 0,
    phone: '',
    tennis_level: '',
    bio: '',
    city: '',
    location: null,
    role: ['user'],
    status: 'active',
    stats: {
      total_bookings: 0,
      total_reviews: 0,
      total_activities: 0
    },
    created_at: now,
    updated_at: now
  }

  const { _id } = await usersCol.add({ data: newUser })
  newUser._id = _id

  return { code: 0, data: newUser }
}
