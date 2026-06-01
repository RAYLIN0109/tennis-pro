const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const db = cloud.database()
  try {
    switch (event.action) {
      case 'list': {
        const { page = 1, pageSize = 20 } = event
        const col = db.collection('notifications')
        const condition = { user_id: OPENID }
        const { total } = await col.where(condition).count()
        const { data } = await col.where(condition).orderBy('created_at', 'desc').skip((page - 1) * pageSize).limit(pageSize).get()
        return { code: 0, data: { list: data, total, page, pageSize } }
      }
      case 'markRead': {
        const { notificationId } = event
        if (notificationId) {
          // 校验通知归属后再标记已读
          const { data: notifications } = await db.collection('notifications')
            .where({ _id: notificationId, user_id: OPENID })
            .limit(1)
            .get()
          if (notifications.length === 0) {
            return { code: 5001, message: '通知不存在或无权操作' }
          }
          await db.collection('notifications').doc(notificationId).update({ data: { is_read: true } })
        } else {
          await db.collection('notifications').where({ user_id: OPENID, is_read: false }).update({ data: { is_read: true } })
        }
        return { code: 0, data: {} }
      }
      case 'unreadCount': {
        const { total } = await db.collection('notifications').where({ user_id: OPENID, is_read: false }).count()
        return { code: 0, data: { count: total } }
      }
      default:
        return { code: 9001, message: '未知操作' }
    }
  } catch (err) {
    return { code: 9999, message: err.message }
  }
}
