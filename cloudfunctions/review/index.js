const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const create = require('./actions/create')
const list = require('./actions/list')
const getStats = require('./actions/getStats')

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const db = cloud.database()
  try {
    switch (event.action) {
      case 'create': return await create(db, OPENID, event)
      case 'list': return await list(db, event)
      case 'getStats': return await getStats(db, event)
      default: return { code: 9001, message: '未知操作' }
    }
  } catch (err) {
    console.error(`[review:${event.action}]`, err)
    return { code: 9999, message: err.message || '服务器错误' }
  }
}
