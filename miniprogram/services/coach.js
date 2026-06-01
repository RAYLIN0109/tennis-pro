const { get } = require('../utils/request')

const CoachService = {
  getList(params) {
    return get('coach', 'list', params)
  },

  getDetail(coachId) {
    return get('coach', 'detail', { coachId })
  },

  search(keyword, page = 1) {
    return get('coach', 'search', { keyword, page })
  }
}

module.exports = CoachService
