const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const list = require('./actions/list')
const detail = require('./actions/detail')
const create = require('./actions/create')
const join = require('./actions/join')
const leave = require('./actions/leave')
const cancel = require('./actions/cancel')
const edit = require('./actions/edit')
const getParticipants = require('./actions/getParticipants')

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const db = cloud.database()

  try {
    switch (event.action) {
      case 'list':         return await list(db, OPENID, event)
      case 'detail':       return await detail(db, OPENID, event)
      case 'create':       return await create(db, OPENID, event)
      case 'join':         return await join(db, OPENID, event)
      case 'leave':        return await leave(db, OPENID, event)
      case 'cancel':       return await cancel(db, OPENID, event)
      case 'edit':         return await edit(db, OPENID, event)
      case 'getParticipants': return await getParticipants(db, OPENID, event)
      default:             return { code: 9001, message: '未知操作' }
    }
  } catch (err) {
    console.error(`[activity:${event.action}]`, err)
    return { code: 9999, message: err.message || '服务器错误' }
  }
}
