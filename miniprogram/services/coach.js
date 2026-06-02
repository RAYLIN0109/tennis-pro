const { get, post } = require('../utils/request')

const CoachService = {
  getList(params) {
    return get('coach', 'list', params)
  },

  getDetail(coachId) {
    return get('coach', 'detail', { coachId })
  },

  search(keyword, page = 1) {
    return get('coach', 'search', { keyword, page })
  },

  apply(data) {
    return post('coach', 'applyCoach', data, '提交中...')
  },

  getMyCoachStatus() {
    return get('coach', 'getMyStatus')
  }
}

module.exports = CoachService
