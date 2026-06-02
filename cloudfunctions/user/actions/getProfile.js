/**
 * 获取用户完整资料
 */
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

module.exports = async function getProfile(db, openid) {
  const { data } = await db.collection('users').where({ _openid: openid }).limit(1).get()

  if (data.length === 0) {
    return { code: 1001, message: '用户不存在' }
  }

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
      console.warn('[getProfile] getTempFileURL failed:', e.message)
    }
  }

  return { code: 0, data: user }
}
