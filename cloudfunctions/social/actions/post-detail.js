/**
 * 帖子详情 + 前N条评论
 */
async function postDetail(db, OPENID, event) {
  const { id, commentPageSize = 5 } = event
  if (!id) {
    return { code: 4001, message: '缺少帖子ID' }
  }

  const { data: posts } = await db.collection('posts')
    .where({ _id: id })
    .get()

  if (posts.length === 0) {
    return { code: 4004, message: '帖子不存在' }
  }

  const post = posts[0]

  // Increment view count (fire-and-forget)
  db.collection('posts').doc(id).update({
    data: { view_count: db.command.inc(1) }
  }).catch(() => {})

  // Author info
  const author = await db.collection('users')
    .where({ _openid: post.author_id })
    .field({ nickname: true, avatar_url: true, tennis_level: true })
    .get()

  // Check if current user liked this post
  const { data: likes } = await db.collection('likes')
    .where({ target_type: 'post', target_id: id, user_id: OPENID })
    .get()
  const isLiked = likes.length > 0

  // Get recent comments
  const { data: comments } = await db.collection('comments')
    .where({ post_id: id, status: 'visible' })
    .orderBy('created_at', 'asc')
    .limit(commentPageSize)
    .get()

  // Enrich comments with author info and reply info
  const enrichedComments = await Promise.all(comments.map(async comment => {
    const commentAuthor = await db.collection('users')
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
      author_info: commentAuthor.data[0] || null,
      reply_to_info: replyTo
    }
  }))

  return {
    code: 0,
    data: {
      ...post,
      author_info: author.data[0] || null,
      isLiked,
      comments: enrichedComments
    }
  }
}

module.exports = postDetail