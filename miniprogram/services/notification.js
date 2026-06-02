const { get, post } = require('../utils/request')

const NotificationService = {
  getList(params) { return get('notification', 'list', params, { showError: false }) },
  getUnreadCount() { return get('notification', 'unreadCount', {}, { showError: false }) },
  markRead(notificationId) { return post('notification', 'markRead', { notificationId }, '标记中...') },
  markAllRead() { return post('notification', 'markAllRead', {}, '标记中...') }
}

module.exports = NotificationService
