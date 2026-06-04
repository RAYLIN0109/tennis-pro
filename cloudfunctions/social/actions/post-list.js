/**
 * 帖子列表（分页、按话题筛选、置顶优先、最新/最热排序）
 * 关联用户信息
 */
async function postList(db, OPENID, event) {
  const { page = 1, pageSize = 20, topic = '', sort = 'latest' } = event
  const col = db.collection('posts')

  // Build query conditions
  const condition = { status: 'active' }
  if (topic) {
    condition.topic = topic
  }

  const { total } = await col.where(condition).count()

  // Build order chain
  let query = col.where(condition)
  // Pinned posts always first
  query = query.orderBy('is_pinned', 'desc')
  // Sort by time or popularity
  if (sort === 'hot') {
    query = query.orderBy('like_count', 'desc')
  }
  query = query.orderBy('created_at', 'desc')

  const { data } = await query
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()

  // Enrich with author info and liked status
  const posts = await Promise.all(data.map(async post => {
    const author = await db.collection('users')
      .where({ _openid: post.author_id })
      .field({ nickname: true, avatar_url: true, tennis_level: true })
      .get()

    // Check if current user liked this post
    const { data: likes } = await db.collection('likes')
      .where({ target_type: 'post', target_id: post._id, user_id: OPENID })
      .get()
    const isLiked = likes.length > 0

    return {
      ...post,
      author_info: author.data[0] || null,
      isLiked
    }
  }))

  return { code: 0, data: { list: posts, total, page, pageSize } }
}

module.exports = postList