/**
 * 评价回复功能
 * 只有评价目标的教练/场地主才能回复评价
 */
module.exports = async function reply(db, openid, event) {
  const { reviewId, content } = event
  if (!reviewId || !content) {
    return { code: 9002, message: '缺少必要参数' }
  }

  // 获取评价信息
  const reviewDoc = await db.collection('reviews').doc(reviewId).get()
  const review = reviewDoc.data

  if (!review) {
    return { code: 6004, message: '评价不存在' }
  }

  // 获取目标信息（教练或场地）
  const colName = review.target_type === 'coach' ? 'coaches' : 'venues'
  const targetDoc = await db.collection(colName).doc(review.target_id).get()
  const target = targetDoc.data

  if (!target) {
    return { code: 6005, message: '评价目标不存在' }
  }

  // 验证回复权限：必须是目标的所有者
  if (target.user_id !== openid) {
    return { code: 5001, message: '无权回复此评价' }
  }

  const now = new Date()

  // 更新评价，添加回复
  await db.collection('reviews').doc(reviewId).update({
    data: {
      reply: {
        content: content,
        replied_at: now
      },
      updated_at: now
    }
  })

  // 获取评价者信息，发送通知
  const reviewerDoc = await db.collection('users').where({ _openid: review.created_by }).get()
  if (reviewerDoc.data.length > 0) {
    await db.collection('notifications').add({
      data: {
        user_id: review.created_by,
        type: 'review_reply',
        title: '您的评价收到回复',
        content: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
        extra: { reviewId, targetId: review.target_id, targetType: review.target_type },
        is_read: false,
        created_at: now
      }
    })
  }

  return { code: 0, data: { reviewId } }
}