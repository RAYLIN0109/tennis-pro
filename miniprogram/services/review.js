const { get, post } = require('../utils/request')

module.exports = {
  create(data) { return post('review', 'create', data, '提交中...') },
  getList(params) { return get('review', 'list', params, { showError: false }) },
  getStats(targetType, targetId) { return get('review', 'getStats', { targetType, targetId }, { showError: false }) },
  getMyList(params) { return get('review', 'myList', params, { showError: false }) }
}
