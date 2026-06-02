/**
 * 管理员审核通过
 */
module.exports = async function approve(db, openid, event) {
  const { coachId } = event

  // 权限校验
  const { data: users } = await db.collection('users').where({ _openid: openid }).get()
  if (!users[0] || !users[0].role || !users[0].role.includes('admin')) {
    return { code: 5001, message: '无权限' }
  }

  // 更新状态
  await db.collection('coaches').doc(coachId).update({
    data: { status: 'active', updated_at: new Date() }
  })

  // 确认用户角色
  const coach = (await db.collection('coaches').doc(coachId).get()).data
  await db.collection('users').where({ _openid: coach.user_id }).update({
    data: { role: db.command.addToSet('coach'), updated_at: new Date() }
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
      created_at: new Date()
    }
  })

  return { code: 0 }
}
