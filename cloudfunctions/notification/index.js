const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const list = require('./actions/list')
const markRead = require('./actions/markRead')
const unreadCount = require('./actions/unreadCount')
const sendTemplate = require('./actions/sendTemplate')

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const db = cloud.database()

  try {
    switch (event.action) {
      case 'list':         return await list(db, OPENID, event)
      case 'markRead':     return await markRead(db, OPENID, event)
      case 'markAllRead':  return await markRead(db, OPENID, {})  // 复用 markRead，不传 notificationId 即为全部已读
      case 'unreadCount':  return await unreadCount(db, OPENID, event)
      case 'sendTemplate': return await sendTemplate(cloud, event)
      default:             return { code: 9001, message: '未知操作' }
    }
  } catch (err) {
    console.error(`[notification:${event.action}]`, err)
    return { code: 9999, message: err.message || '服务器错误' }
  }
}
