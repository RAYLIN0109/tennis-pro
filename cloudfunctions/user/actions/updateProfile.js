/**
 * 更新用户资料
 */
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

  return { code: 0, data: data[0] }
}
