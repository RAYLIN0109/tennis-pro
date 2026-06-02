/**
 * 管理员驳回教练申请
 */
module.exports = async function reject(db, openid, event) {
  const { coachId, reason } = event

  // 权限：调用者 role 含 'admin'
  const { data: users } = await db.collection('users')
    .where({ _openid: openid })
    .limit(1)
    .get()

  if (!users[0]?.role?.includes('admin')) {
    return { code: 5001, message: '无权限' }
  }

  if (!coachId) {
    return { code: 9002, message: '缺少教练ID' }
  }

  if (!reason) {
    return { code: 9002, message: '请填写驳回原因' }
  }

  const now = new Date()

  // 更新 coaches 状态
  await db.collection('coaches').doc(coachId).update({
    data: {
      status: 'suspended',
      reject_reason: reason,
      updated_at: now
    }
  })

  // 发通知
  const { data: coaches } = await db.collection('coaches').doc(coachId).get()
  const coach = coaches

  if (coach) {
    await db.collection('notifications').add({
      data: {
        user_id: coach.user_id,
        type: 'coach_audit_result',
        title: '教练认证未通过',
        content: `您的教练认证未通过审核，原因：${reason}`,
        extra: { coachId, status: 'suspended', reason },
        is_read: false,
        created_at: now
      }
    })
  }

  return { code: 0 }
}
