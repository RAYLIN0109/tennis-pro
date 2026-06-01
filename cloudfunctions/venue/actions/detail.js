/**
 * 场地详情
 */
module.exports = async function detail(db, event) {
  const { venueId } = event
  if (!venueId) {
    return { code: 9002, message: '缺少场地ID' }
  }

  const venueDoc = await db.collection('venues').doc(venueId).get()
  const venue = venueDoc.data

  // 评价统计
  const { total: reviewCount } = await db.collection('reviews')
    .where({ target_type: 'venue', target_id: venueId })
    .count()

  const { data: recentReviews } = await db.collection('reviews')
    .where({ target_type: 'venue', target_id: venueId })
    .orderBy('created_at', 'desc')
    .limit(3)
    .get()

  return {
    code: 0,
    data: {
      ...venue,
      review_stats: { count: reviewCount, average: venue.rating || 0 },
      recent_reviews: recentReviews
    }
  }
}
