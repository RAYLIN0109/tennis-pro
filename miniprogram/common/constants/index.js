const userConstants = require('./user')
const coachConstants = require('./coach')
const venueConstants = require('./venue')
const orderConstants = require('./order')
const activityConstants = require('./activity')

module.exports = {
  ...userConstants,
  ...coachConstants,
  ...venueConstants,
  ...orderConstants,
  ...activityConstants
}
