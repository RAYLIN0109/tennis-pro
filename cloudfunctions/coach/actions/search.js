/**
 * 教练搜索
 */
module.exports = async function search(db, event) {
  const { keyword = '', page = 1, pageSize = 10 } = event

  if (!keyword.trim()) {
    return { code: 0, data: { list: [], total: 0 } }
  }

  const coachesCol = db.collection('coaches')
  const skip = (page - 1) * pageSize

  // 使用正则搜索
  const regex = db.RegExp({ regexp: keyword, options: 'i' })
  const condition = db.command.or([
    { real_name: regex },
    { specialties: regex },
    { bio: regex },
    { certification_labels: regex }
  ])

  const { total } = await coachesCol.where(condition).where({ status: 'active' }).count()

  const { data: coaches } = await coachesCol
    .where(condition)
    .where({ status: 'active' })
    .orderBy('rating', 'desc')
    .skip(skip)
    .limit(pageSize)
    .get()

  return { code: 0, data: { list: coaches, total, page, pageSize } }
}
