async function markRead(db, OPENID, event) {
  const { notificationId } = event
  
  if (notificationId) {
    const { data: notifications } = await db.collection('notifications')
      .where({ _id: notificationId, user_id: OPENID })
      .limit(1)
      .get()
    if (notifications.length === 0) {
      return { code: 5001, message: '通知不存在或无权操作' }
    }
    await db.collection('notifications').doc(notificationId).update({ data: { is_read: true } })
  } else {
    await db.collection('notifications')
      .where({ user_id: OPENID, is_read: false })
      .update({ data: { is_read: true } })
  }
  return { code: 0, data: {} }
}

module.exports = markRead