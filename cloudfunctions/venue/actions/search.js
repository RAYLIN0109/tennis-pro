/**
 * 场地搜索
 */
module.exports = async function search(db, event) {
  const { keyword = '', page = 1, pageSize = 10 } = event

  if (!keyword.trim()) {
    return { code: 0, data: { list: [], total: 0 } }
  }

  const venuesCol = db.collection('venues')
  const skip = (page - 1) * pageSize
  const regex = db.RegExp({ regexp: keyword, options: 'i' })

  const condition = db.command.or([
    { name: regex },
    { address: regex },
    { district: regex }
  ])

  const { total } = await venuesCol.where(condition).where({ status: 'active' }).count()

  const { data: venues } = await venuesCol
    .where(condition)
    .where({ status: 'active' })
    .orderBy('rating', 'desc')
    .skip(skip)
    .limit(pageSize)
    .get()

  return { code: 0, data: { list: venues, total, page, pageSize } }
}
