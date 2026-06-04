/**
 * 删帖（仅作者或管理员）
 * 管理员通过 event.isAdmin = true 标识
 */
async function postDelete(db, OPENID, event) {
  const { id, isAdmin = false } = event
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

  // Only author or admin can delete
  if (post.author_id !== OPENID && !isAdmin) {
    return { code: 4003, message: '无权删除此帖子' }
  }

  // Hard delete the post
  await db.collection('posts').doc(id).remove()

  // Also delete associated comments and likes (fire-and-forget)
  db.collection('comments').where({ post_id: id }).remove().catch(() => {})
  db.collection('likes').where({ target_type: 'post', target_id: id }).remove().catch(() => {})

  return { code: 0, data: { message: '删除成功' } }
}

module.exports = postDelete