/**
 * 管理员审核通过教练
 */
module.exports = async function approve(db, openid, event) {
  const { coachId } = event

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

  const now = new Date()

  // 更新 coaches 状态
  await db.collection('coaches').doc(coachId).update({
    data: { status: 'active', updated_at: now }
  })

  // 确认用户 role 包含 coach
  const { data: coaches } = await db.collection('coaches').doc(coachId).get()
  const coach = coaches

  if (coach) {
    await db.collection('users').where({ _openid: coach.user_id }).update({
      data: { role: db.command.addToSet('coach'), updated_at: now }
    })

    // 发通知
    await db.collection('notifications').add({
      data: {
        user_id: coach.user_id,
        type: 'coach_audit_result',
        title: '教练认证已通过',
        content: '恭喜！您的教练认证已审核通过，现在学员可以在教练列表中看到您了。',
        extra: { coachId, status: 'active' },
        is_read: false,
        created_at: now
      }
    })
  }

  return { code: 0 }
}
