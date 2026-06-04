async function create(db, OPENID, event) {
  const { type, title, description, start_time, end_time, location, 
          min_participants = 2, max_participants = 20, fee = 0, cover_image, tags } = event

  if (!type || !title || !start_time || !end_time || !location) {
    return { code: 4001, message: '缺少必填字段' }
  }

  const activity = {
    type,
    title,
    description: description || '',
    creator_id: OPENID,
    status: 'open',
    start_time: new Date(start_time),
    end_time: new Date(end_time),
    location: typeof location === 'object' ? location : JSON.parse(location),
    min_participants,
    max_participants,
    current_count: 1,
    fee: fee * 100,
    fee_type: fee > 0 ? 'paid' : 'free',
    cover_image: cover_image || '',
    tags: tags || [],
    participants: [{ user_id: OPENID, joined_at: new Date() }],
    created_at: new Date(),
    updated_at: new Date()
  }

  const result = await db.collection('activities').add({ data: activity })

  return { code: 0, data: { _id: result._id, message: '创建成功' } }
}

module.exports = create