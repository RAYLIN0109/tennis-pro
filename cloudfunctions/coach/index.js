const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const list = require('./actions/list')
const detail = require('./actions/detail')
const search = require('./actions/search')
const applyCoach = require('./actions/applyCoach')

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const db = cloud.database()

  try {
    switch (event.action) {
      case 'list':
        return await list(db, event)
      case 'detail':
        return await detail(db, event)
      case 'search':
        return await search(db, event)
      case 'applyCoach':
        return await applyCoach(db, OPENID, event)
      default:
        return { code: 9001, message: '未知操作' }
    }
  } catch (err) {
    console.error(`[coach:${event.action}]`, err)
    return { code: 9999, message: err.message || '服务器错误' }
  }
}
