const { get, post } = require('../utils/request')

module.exports = {
  getList(params) { return get('activity', 'list', params) },
  getDetail(id) { return get('activity', 'detail', { id }) },
  create(data) { return post('activity', 'create', data, '创建中...') }
}
