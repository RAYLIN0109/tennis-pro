/**
 * 获取用户完整资料
 */
module.exports = async function getProfile(db, openid) {
  const { data } = await db.collection('users').where({ _openid: openid }).limit(1).get()

  if (data.length === 0) {
    return { code: 1001, message: '用户不存在' }
  }

  return { code: 0, data: data[0] }
}
