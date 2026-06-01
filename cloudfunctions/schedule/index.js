const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const getSchedule = require('./actions/getSchedule')
const generateSchedule = require('./actions/generateSchedule')
const bookSlot = require('./actions/bookSlot')
const releaseSlot = require('./actions/releaseSlot')

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const db = cloud.database()

  try {
    switch (event.action) {
      case 'getSchedule':
        return await getSchedule(db, event)
      case 'generateSchedule':
        return await generateSchedule(db, event)
      case 'bookSlot':
        return await bookSlot(db, OPENID, event)
      case 'releaseSlot':
        return await releaseSlot(db, event)
      default:
        return { code: 9001, message: '未知操作' }
    }
  } catch (err) {
    console.error(`[schedule:${event.action}]`, err)
    return { code: 9999, message: err.message || '服务器错误' }
  }
}
