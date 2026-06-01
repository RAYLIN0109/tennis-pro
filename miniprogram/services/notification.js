const { get, post } = require('../utils/request')

module.exports = {
  getList(params) { return get('notification', 'list', params) },
  markRead(notificationId) { return post('notification', 'markRead', { notificationId }) },
  markAllRead() { return post('notification', 'markRead', {}) },
  getUnreadCount() { return get('notification', 'unreadCount') }
}
