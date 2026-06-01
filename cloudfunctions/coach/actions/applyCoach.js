/**
 * 申请成为教练
 */
module.exports = async function applyCoach(db, openid, event) {
  const {
    real_name, specialties, certifications, certification_labels,
    teaching_years, hourly_rate, trial_rate, bio, photos,
    service_areas, venue_ids
  } = event

  if (!real_name) {
    return { code: 9002, message: '请输入真实姓名' }
  }

  // 检查是否已有教练资料
  const { data: existing } = await db.collection('coaches')
    .where({ user_id: openid })
    .limit(1)
    .get()

  if (existing.length > 0 && existing[0].status !== 'suspended') {
    return { code: 2001, message: '您已提交过教练申请' }
  }

  const now = new Date()
  const coachData = {
    user_id: openid,
    real_name,
    specialties: specialties || [],
    certifications: certifications || [],
    certification_labels: certification_labels || [],
    teaching_years: teaching_years || 0,
    hourly_rate: hourly_rate || 0,
    trial_rate: trial_rate || 0,
    bio: bio || '',
    photos: photos || [],
    service_areas: service_areas || [],
    venue_ids: venue_ids || [],
    rating: 0,
    review_count: 0,
    total_students: 0,
    status: 'pending',
    created_at: now,
    updated_at: now
  }

  let coachId

  if (existing.length > 0) {
    // 更新已有记录
    await db.collection('coaches').doc(existing[0]._id).update({
      data: { ...coachData, status: 'pending', updated_at: now }
    })
    coachId = existing[0]._id
  } else {
    const { _id } = await db.collection('coaches').add({ data: coachData })
    coachId = _id
  }

  // 无论新申请还是重新申请，都需要更新用户角色
  // 修复 A1: 将角色更新移出 if/else 分支，避免重提申请时角色未更新
  await db.collection('users').where({ _openid: openid }).update({
    data: {
      role: db.command.addToSet('coach'),
      updated_at: now
    }
  })

  return { code: 0, data: { _id: coachId } }
}
