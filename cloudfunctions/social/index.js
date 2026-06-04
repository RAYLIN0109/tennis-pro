const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const postList = require('./actions/post-list')
const postDetail = require('./actions/post-detail')
const postCreate = require('./actions/post-create')
const postDelete = require('./actions/post-delete')
const postLike = require('./actions/post-like')
const commentCreate = require('./actions/comment-create')
const commentList = require('./actions/comment-list')

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const db = cloud.database()

  try {
    switch (event.action) {
      case 'post/list':      return await postList(db, OPENID, event)
      case 'post/detail':    return await postDetail(db, OPENID, event)
      case 'post/create':    return await postCreate(db, OPENID, event)
      case 'post/delete':    return await postDelete(db, OPENID, event)
      case 'post/like':      return await postLike(db, OPENID, event)
      case 'comment/create': return await commentCreate(db, OPENID, event)
      case 'comment/list':   return await commentList(db, OPENID, event)
      default:               return { code: 9001, message: '未知操作' }
    }
  } catch (err) {
    console.error(`[social:${event.action}]`, err)
    return { code: 9999, message: err.message || '服务器错误' }
  }
}