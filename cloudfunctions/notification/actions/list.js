async function list(db, OPENID, event) {
  const { page = 1, pageSize = 20 } = event
  const col = db.collection('notifications')
  const condition = { user_id: OPENID }
  const { total } = await col.where(condition).count()
  const { data } = await col
    .where(condition)
    .orderBy('created_at', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()
  return { code: 0, data: { list: data, total, page, pageSize } }
}

module.exports = list