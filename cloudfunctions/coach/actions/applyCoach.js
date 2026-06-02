/**
 * 申请成为教练
 */
module.exports = async function applyCoach(db, openid, event) {
  const {
    real_name, phone, specialties, certifications, certification_labels,
    teaching_years, hourly_rate, trial_rate, bio, photos,
    service_areas, venue_ids
  } = event

  if (!real_name) return { code: 9002, message: '请输入真实姓名' }
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) return { code: 9002, message: '请输入正确的手机号' }
  if (!specialties || specialties.length === 0) return { code: 9002, message: '请至少选择一个特长标签' }
  if (teaching_years < 0 || teaching_years > 50) return { code: 9002, message: '教学年限 0-50' }
  if (!hourly_rate || hourly_rate <= 0) return { code: 9002, message: '请输入有效的每小时费用' }

  // 查询当前用户 city
  const { data: users } = await db.collection('users').where({ _openid: openid }).limit(1).get()
  const userCity = users.length > 0 ? users[0].city : ''

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
    phone,
    city: userCity,
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
    await db.collection('coaches').doc(existing[0]._id).update({
      data: { ...coachData, status: 'pending', updated_at: now }
    })
    coachId = existing[0]._id
  } else {
    const { _id } = await db.collection('coaches').add({ data: coachData })
    coachId = _id
  }

  // 写角色
  await db.collection('users').where({ _openid: openid }).update({
    data: { role: db.command.addToSet('coach'), updated_at: now }
  })

  return { code: 0, data: { _id: coachId } }
}
