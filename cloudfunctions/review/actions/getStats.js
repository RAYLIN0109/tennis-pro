module.exports = async function getStats(db, event) {
  const { targetType, targetId } = event
  if (!targetType || !targetId) return { code: 9002, message: '缺少参数' }

  const { total } = await db.collection('reviews').where({ target_type: targetType, target_id: targetId }).count()
  const { data: all } = await db.collection('reviews').where({ target_type: targetType, target_id: targetId }).field({ rating: true }).get()

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  let sum = 0
  all.forEach((r) => { distribution[r.rating] = (distribution[r.rating] || 0) + 1; sum += r.rating })

  return { code: 0, data: { average: total ? Math.round(sum / total * 10) / 10 : 0, count: total, distribution } }
}
