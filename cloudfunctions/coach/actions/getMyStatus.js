/**
 * 获取当前用户的教练认证状态
 */
module.exports = async function getMyStatus(db, openid) {
  const { data } = await db.collection('coaches')
    .where({ user_id: openid })
    .limit(1)
    .get()

  if (data.length === 0) {
    return { code: 0, data: { has_apply: false } }
  }

  return {
    code: 0,
    data: {
      has_apply: true,
      coach: data[0]
    }
  }
}
