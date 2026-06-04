const { get, post } = require('../utils/request')

module.exports = {
  getList(params) { return get('activity', 'list', params) },
  getDetail(id) { return get('activity', 'detail', { id }) },
  create(data) { return post('activity', 'create', data, '创建中...') },
  join(id) { return post('activity', 'join', { id }, '报名中...') },
  leave(id) { return post('activity', 'leave', { id }, '取消报名中...') },
  cancel(id) { return post('activity', 'cancel', { id }, '取消中...') },
  edit(id, data) { return post('activity', 'edit', { id, ...data }, '更新中...') },
  getParticipants(id) { return get('activity', 'getParticipants', { id }) }
}