/**
 * 评论/回复评论
 */
async function commentCreate(db, OPENID, event) {
  const { post_id, content, reply_to = '' } = event

  if (!post_id) {
    return { code: 4001, message: '缺少帖子ID' }
  }

  if (!content || content.trim().length === 0) {
    return { code: 4001, message: '请输入评论内容' }
  }

  // Verify post exists
  const { data: posts } = await db.collection('posts')
    .where({ _id: post_id })
    .get()

  if (posts.length === 0) {
    return { code: 4004, message: '帖子不存在' }
  }

  // If reply_to is provided, verify the target comment exists
  if (reply_to) {
    const { data: targetComments } = await db.collection('comments')
      .where({ _id: reply_to })
      .get()
    if (targetComments.length === 0) {
      return { code: 4004, message: '回复的评论不存在' }
    }
  }

  const comment = {
    post_id,
    author_id: OPENID,
    content: content.trim(),
    reply_to: reply_to || '',
    status: 'visible',
    created_at: new Date()
  }

  const result = await db.collection('comments').add({ data: comment })

  // Increment comment count on post
  await db.collection('posts').doc(post_id).update({
    data: { comment_count: db.command.inc(1) }
  })

  return { code: 0, data: { _id: result._id, message: '评论成功' } }
}

module.exports = commentCreate