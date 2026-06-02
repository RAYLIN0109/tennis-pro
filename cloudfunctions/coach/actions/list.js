/**
 * 教练列表（分页、筛选、排序）
 */
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

module.exports = async function list(db, event) {
  const {
    page = 1,
    pageSize = 10,
    specialty,
    city,
    sortBy = 'rating' // rating | price_asc | price_desc | experience
  } = event

  const _ = db.command
  const coachesCol = db.collection('coaches')

  // 构建查询条件
  let condition = { status: 'active' }
  if (specialty) {
    condition.specialties = specialty
  }
  if (city) {
    condition.city = city
  }

  // 排序
  let orderField = 'rating'
  let orderDirection = 'desc'
  switch (sortBy) {
    case 'price_asc':
      orderField = 'hourly_rate'
      orderDirection = 'asc'
      break
    case 'price_desc':
      orderField = 'hourly_rate'
      orderDirection = 'desc'
      break
    case 'experience':
      orderField = 'teaching_years'
      orderDirection = 'desc'
      break
    default:
      orderField = 'rating'
      orderDirection = 'desc'
  }

  // 查询总数
  const countResult = await coachesCol.where(condition).count()
  const total = countResult.total

  // 分页查询
  const skip = (page - 1) * pageSize
  const { data: coaches } = await coachesCol
    .where(condition)
    .orderBy(orderField, orderDirection)
    .skip(skip)
    .limit(pageSize)
    .get()

  // 批量获取教练对应的用户信息（头像、昵称）
  const userIds = coaches.map((c) => c.user_id).filter(Boolean)
  let usersMap = {}
  if (userIds.length > 0) {
    const { data: users } = await db.collection('users')
      .where({ _openid: _.in(userIds) })
      .field({ _openid: true, nickname: true, avatar_url: true })
      .get()
    users.forEach((u) => { usersMap[u._openid] = u })
  }

  // 将云存储 fileID 转为临时可访问 URL（跨用户头像可见）
  for (const u of Object.values(usersMap)) {
    if (u.avatar_url && u.avatar_url.startsWith('cloud://')) {
      try {
        const { fileList } = await cloud.getTempFileURL({
          fileList: [u.avatar_url]
        })
        if (fileList && fileList[0] && fileList[0].tempFileURL) {
          u.avatar_url = fileList[0].tempFileURL
        }
      } catch (e) {
        console.warn('[coach/list] getTempFileURL failed:', e.message)
      }
    }
  }

  // 合并数据
  const list = coaches.map((coach) => ({
    ...coach,
    user_info: usersMap[coach.user_id] || {}
  }))

  return { code: 0, data: { list, total, page, pageSize } }
}
