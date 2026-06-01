const { get, post } = require('../utils/request')

const ScheduleService = {
  getSchedule(resourceId, resourceType, date) {
    return get('schedule', 'getSchedule', { resourceId, resourceType, date })
  },

  bookSlot(params) {
    return post('schedule', 'bookSlot', params, '预约中...')
  },

  releaseSlot(scheduleId, slotIndexes) {
    return post('schedule', 'releaseSlot', { scheduleId, slotIndexes })
  }
}

module.exports = ScheduleService
