const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const login = require('./actions/login')
const getProfile = require('./actions/getProfile')
const updateProfile = require('./actions/updateProfile')
const getMyInfo = require('./actions/getMyInfo')

exports.main = async (event, context) => {
  const { OPENID, APPID } = cloud.getWXContext()
  const db = cloud.database()

  try {
    switch (event.action) {
      case 'login':
        return await login(db, cloud, OPENID, APPID, event)
      case 'getProfile':
        return await getProfile(db, OPENID)
      case 'updateProfile':
        return await updateProfile(db, OPENID, event)
      case 'getMyInfo':
        return await getMyInfo(db, OPENID)
      default:
        return { code: 9001, message: '未知操作' }
    }
  } catch (err) {
    console.error(`[user:${event.action}]`, err)
    return { code: 9999, message: err.message || '服务器错误' }
  }
}
