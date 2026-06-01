module.exports = async function create(db, openid, event) {
  const { orderId, targetType, targetId, rating, content, images } = event
  if (!orderId || !rating) return { code: 9002, message: '缺少必要参数' }

  // 修复 A3: 使用云数据库事务将"校验订单 + 插入评价 + 标记已评价"封装为原子操作
  // 防止并发场景下重复评价
  const transaction = await db.startTransaction()
  try {
    // 事务内验证订单
    const orderDoc = await transaction.collection('orders').doc(orderId).get()
    if (!orderDoc.data) {
      await transaction.rollback()
      return { code: 6001, message: '订单不存在' }
    }
    const order = orderDoc.data
    if (order.created_by !== openid) {
      await transaction.rollback()
      return { code: 6001, message: '无权评价此订单' }
    }
    if (order.status !== 'completed') {
      await transaction.rollback()
      return { code: 6002, message: '订单未完成，暂不可评价' }
    }
    if (order.reviewed) {
      await transaction.rollback()
      return { code: 6003, message: '已评价过此订单' }
    }

    const now = new Date()
    // 事务内插入评价（reviews.order_id 唯一索引会作为兜底防护）
    const { _id } = await transaction.collection('reviews').add({
      data: {
        order_id: orderId,
        created_by: openid,
        target_type: targetType,
        target_id: targetId,
        rating: Number(rating),
        content: content || '',
        images: images || [],
        is_anonymous: false,
        status: 'visible',
        created_at: now
      }
    })

    // 事务内更新订单状态
    await transaction.collection('orders').doc(orderId).update({
      data: { reviewed: true, status: 'reviewed', updated_at: now }
    })

    // 提交事务
    await transaction.commit()

    // 事务外的非关键统计更新（失败不影响主流程）
    try {
      const { total } = await db.collection('reviews').where({ target_type: targetType, target_id: targetId }).count()
      const { data: allReviews } = await db.collection('reviews').where({ target_type: targetType, target_id: targetId }).field({ rating: true }).get()
      const avgRating = allReviews.reduce((s, r) => s + r.rating, 0) / total

      const colName = targetType === 'coach' ? 'coaches' : 'venues'
      await db.collection(colName).doc(targetId).update({
        data: { rating: Math.round(avgRating * 10) / 10, review_count: total, updated_at: now }
      })

      await db.collection('users').where({ _openid: openid }).update({
        data: { 'stats.total_reviews': db.command.inc(1), updated_at: now }
      })
    } catch (statErr) {
      console.error('[review:create] 统计更新失败（不影响评价结果）', statErr)
    }

    return { code: 0, data: { _id } }
  } catch (err) {
    // 事务异常时回滚
    try { await transaction.rollback() } catch (e) {}
    throw err
  }
}
