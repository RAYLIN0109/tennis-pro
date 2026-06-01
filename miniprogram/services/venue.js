const { get } = require('../utils/request')

const VenueService = {
  getList(params) {
    return get('venue', 'list', params)
  },

  getDetail(venueId) {
    return get('venue', 'detail', { venueId })
  },

  search(keyword, page = 1) {
    return get('venue', 'search', { keyword, page })
  }
}

module.exports = VenueService
