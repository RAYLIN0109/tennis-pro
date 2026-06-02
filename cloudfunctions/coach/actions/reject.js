/**
 * 管理员驳回
 */
module.exports = async function reject(db, openid, event) {
  const { coachId, reason } = event

  // 权限校验
  const { data: users } = await db.collection('users').where({ _openid: openid }).get()
  if (!users[0] || !users[0].role || !users[0].role.includes('admin')) {
    return { code: 5001, message: '无权限' }
  }

  if (!reason) {
    return { code: 9002, message: '请填写驳回原因' }
  }

  await db.collection('coaches').doc(coachId).update({
    data: {
      status: 'suspended',
      reject_reason: reason,
      updated_at: new Date()
    }
  })

  const coach = (await db.collection('coaches').doc(coachId).get()).data
  await db.collection('notifications').add({
    data: {
      user_id: coach.user_id,
      type: 'coach_audit_result',
      title: '教练认证未通过',
      content: `您的教练认证未通过审核，原因：${reason}`,
      extra: { coachId, status: 'suspended', reason },
      is_read: false,
      created_at: new Date()
    }
  })

  return { code: 0 }
}
