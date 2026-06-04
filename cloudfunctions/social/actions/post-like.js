/**
 * 点赞/取消点赞（toggle），更新 like_count
 */
async function postLike(db, OPENID, event) {
  const { id } = event
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

  // Check existing like
  const { data: existingLikes } = await db.collection('likes')
    .where({ target_type: 'post', target_id: id, user_id: OPENID })
    .get()

  const isCurrentlyLiked = existingLikes.length > 0

  if (isCurrentlyLiked) {
    // Unlike: remove like record and decrement count
    await db.collection('likes').doc(existingLikes[0]._id).remove()
    await db.collection('posts').doc(id).update({
      data: { like_count: db.command.inc(-1) }
    })
    return { code: 0, data: { isLiked: false, like_count: (post.like_count || 0) - 1 } }
  } else {
    // Like: add like record and increment count
    await db.collection('likes').add({
      data: {
        target_type: 'post',
        target_id: id,
        user_id: OPENID,
        created_at: new Date()
      }
    })
    await db.collection('posts').doc(id).update({
      data: { like_count: db.command.inc(1) }
    })
    return { code: 0, data: { isLiked: true, like_count: (post.like_count || 0) + 1 } }
  }
}

module.exports = postLike