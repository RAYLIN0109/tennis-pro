/**
 * 场地列表（分页、筛选、排序）
 */
module.exports = async function list(db, event) {
  const {
    page = 1,
    pageSize = 10,
    courtType,
    city,
    priceMin,
    priceMax,
    sortBy = 'rating',
    latitude,
    longitude
  } = event

  const venuesCol = db.collection('venues')
  const _ = db.command

  let condition = { status: 'active' }
  if (courtType) {
    condition.court_types = courtType
  }
  if (city) {
    condition.city = city
  }

  let orderField = 'rating'
  let orderDirection = 'desc'
  switch (sortBy) {
    case 'price_asc':
      orderField = 'price_min'
      orderDirection = 'asc'
      break
    case 'rating':
    default:
      orderField = 'rating'
      orderDirection = 'desc'
  }

  const { total } = await venuesCol.where(condition).count()
  const skip = (page - 1) * pageSize

  const { data: venues } = await venuesCol
    .where(condition)
    .orderBy(orderField, orderDirection)
    .skip(skip)
    .limit(pageSize)
    .get()

  return { code: 0, data: { list: venues, total, page, pageSize } }
}
