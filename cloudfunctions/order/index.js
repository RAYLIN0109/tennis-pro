const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const create = require('./actions/create')
const detail = require('./actions/detail')
const list = require('./actions/list')
const pay = require('./actions/pay')
const cancel = require('./actions/cancel')
const confirm = require('./actions/confirm')
const refund = require('./actions/refund')

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const db = cloud.database()

  try {
    switch (event.action) {
      case 'create':
        return await create(db, OPENID, event)
      case 'detail':
        return await detail(db, OPENID, event)
      case 'list':
        return await list(db, OPENID, event)
      case 'pay':
        return await pay(db, OPENID, cloud, event)
      case 'cancel':
        return await cancel(db, OPENID, event)
      case 'confirm':
        return await confirm(db, OPENID, event)
      case 'refund':
        return await refund(db, OPENID, event)
      default:
        return { code: 9001, message: '未知操作' }
    }
  } catch (err) {
    console.error(`[order:${event.action}]`, err)
    return { code: 9999, message: err.message || '服务器错误' }
  }
}