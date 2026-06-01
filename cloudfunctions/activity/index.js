const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event) => {
  const db = cloud.database()
  const { OPENID } = cloud.getWXContext()
  try {
    switch (event.action) {
      case 'list':
        return { code: 0, data: { list: [], total: 0, page: 1, pageSize: 10 } }
      case 'detail':
        return { code: 0, data: {} }
      case 'create':
        return { code: 0, data: { _id: 'mock', message: '即将开放' } }
      default:
        return { code: 9001, message: '未知操作' }
    }
  } catch (err) {
    return { code: 9999, message: err.message }
  }
}
