const { get, post } = require('../utils/request')

const CoachService = {
  // 列表/搜索/查询类：静默（onShow 自动触发，不弹错）
  getList(params) { return get('coach', 'list', params, { showError: false }) },
  getDetail(coachId) { return get('coach', 'detail', { coachId }, { showError: false }) },
  search(keyword, page = 1) { return get('coach', 'search', { keyword, page }, { showError: false }) },
  getMyCoachStatus() { return get('coach', 'getMyStatus', {}, { showError: false }) },

  // 写操作：主动提示
  apply(data) { return post('coach', 'applyCoach', data, '提交中...') }
}

module.exports = CoachService
