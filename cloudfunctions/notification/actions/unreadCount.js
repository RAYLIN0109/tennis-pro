async function unreadCount(db, OPENID, event) {
  const { total } = await db.collection('notifications')
    .where({ user_id: OPENID, is_read: false })
    .count()
  return { code: 0, data: { count: total } }
}

module.exports = unreadCount