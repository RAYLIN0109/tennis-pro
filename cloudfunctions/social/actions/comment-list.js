/**
 * 获取帖子的分页评论列表
 */
async function commentList(db, OPENID, event) {
  const { post_id, page = 1, pageSize = 20 } = event

  if (!post_id) {
    return { code: 4001, message: '缺少帖子ID' }
  }

  const condition = { post_id, status: 'visible' }

  const { total } = await db.collection('comments').where(condition).count()

  const { data } = await db.collection('comments')
    .where(condition)
    .orderBy('created_at', 'asc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()

  // Enrich with author info and reply info
  const enrichedComments = await Promise.all(data.map(async comment => {
    const author = await db.collection('users')
      .where({ _openid: comment.author_id })
      .field({ nickname: true, avatar_url: true })
      .get()

    let replyTo = null
    if (comment.reply_to) {
      const { data: replies } = await db.collection('comments')
        .where({ _id: comment.reply_to })
        .get()
      if (replies.length > 0) {
        const replyAuthor = await db.collection('users')
          .where({ _openid: replies[0].author_id })
          .field({ nickname: true })
          .get()
        replyTo = {
          content: replies[0].content,
          author_name: replyAuthor.data[0]?.nickname || '未知用户'
        }
      }
    }

    return {
      ...comment,
      author_info: author.data[0] || null,
      reply_to_info: replyTo
    }
  }))

  return { code: 0, data: { list: enrichedComments, total, page, pageSize } }
}

module.exports = commentList