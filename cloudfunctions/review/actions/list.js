const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

module.exports = async function list(db, event) {
  const { targetType, targetId, page = 1, pageSize = 10, sortBy = 'newest' } = event
  if (!targetType || !targetId) return { code: 9002, message: '缺少参数' }

  const reviewsCol = db.collection('reviews')
  const _ = db.command
  const condition = { target_type: targetType, target_id: targetId, status: 'visible' }

  let orderField = 'created_at'
  let orderDir = 'desc'
  if (sortBy === 'highest') { orderField = 'rating'; orderDir = 'desc' }
  if (sortBy === 'lowest') { orderField = 'rating'; orderDir = 'asc' }

  const { total } = await reviewsCol.where(condition).count()
  const { data: reviews } = await reviewsCol
    .where(condition)
    .orderBy(orderField, orderDir)
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()

  // 获取评价者信息
  const openids = [...new Set(reviews.map((r) => r.created_by))]
  let usersMap = {}
  if (openids.length) {
    const { data: users } = await db.collection('users').where({ _openid: _.in(openids) }).field({ _openid: true, nickname: true, avatar_url: true, tennis_level: true }).get()

    // 将云存储 fileID 转为临时可访问 URL
    for (const u of users) {
      if (u.avatar_url && u.avatar_url.startsWith('cloud://')) {
        try {
          const { fileList } = await cloud.getTempFileURL({
            fileList: [u.avatar_url]
          })
          if (fileList && fileList[0] && fileList[0].tempFileURL) {
            u.avatar_url = fileList[0].tempFileURL
          }
        } catch (e) {
          console.warn('[review/list] getTempFileURL failed:', e.message)
        }
      }
    }

    users.forEach((u) => { usersMap[u._openid] = u })
  }

  const list = reviews.map((r) => ({ ...r, user_info: usersMap[r.created_by] || {} }))
  return { code: 0, data: { list, total, page, pageSize } }
}
