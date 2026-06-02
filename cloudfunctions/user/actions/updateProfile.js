/**
 * 更新用户资料
 */
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const ALLOWED_FIELDS = [
  'nickname', 'avatar_url', 'gender', 'phone',
  'tennis_level', 'bio', 'city', 'location'
]

module.exports = async function updateProfile(db, openid, event) {
  const updateData = {}

  ALLOWED_FIELDS.forEach((field) => {
    if (event[field] !== undefined) {
      updateData[field] = event[field]
    }
  })

  if (Object.keys(updateData).length === 0) {
    return { code: 9002, message: '没有需要更新的字段' }
  }

  updateData.updated_at = new Date()

  await db.collection('users').where({ _openid: openid }).update({
    data: updateData
  })

  // 返回更新后的数据
  const { data } = await db.collection('users').where({ _openid: openid }).limit(1).get()

  if (data.length > 0) {
    const user = data[0]
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
        console.warn('[updateProfile] getTempFileURL failed:', e.message)
      }
    }
    return { code: 0, data: user }
  }

  return { code: 0, data: data[0] }
}
