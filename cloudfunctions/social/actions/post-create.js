/**
 * 发帖（校验内容/图片数量）
 */
async function postCreate(db, OPENID, event) {
  const { content, images = [], video = '', topic = '其他', location, tags = [] } = event

  if (!content || content.trim().length === 0) {
    return { code: 4001, message: '请输入内容' }
  }

  if (content.length > 5000) {
    return { code: 4001, message: '内容不能超过5000字' }
  }

  if (images.length > 9) {
    return { code: 4001, message: '最多上传9张图片' }
  }

  const validTopics = ['约球', '技术', '装备', '赛事', '其他']
  if (topic && !validTopics.includes(topic)) {
    return { code: 4001, message: '话题标签无效' }
  }

  const post = {
    author_id: OPENID,
    content: content.trim(),
    images,
    video: video || '',
    topic: topic || '其他',
    location: location || null,
    tags: tags || [],
    like_count: 0,
    comment_count: 0,
    view_count: 0,
    is_pinned: false,
    status: 'active',
    created_at: new Date(),
    updated_at: new Date()
  }

  const result = await db.collection('posts').add({ data: post })

  return { code: 0, data: { _id: result._id, message: '发布成功' } }
}

module.exports = postCreate