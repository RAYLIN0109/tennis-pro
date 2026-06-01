const ACTIVITY_TYPE = {
  COACH_BOOKING: 'coach_booking',
  VENUE_BOOKING: 'venue_booking',
  PICKUP_GAME: 'pickup_game',
  WATCH_PARTY: 'watch_party'
}

const ACTIVITY_TYPE_MAP = {
  [ACTIVITY_TYPE.COACH_BOOKING]: '教练预约',
  [ACTIVITY_TYPE.VENUE_BOOKING]: '场地预约',
  [ACTIVITY_TYPE.PICKUP_GAME]: '约球',
  [ACTIVITY_TYPE.WATCH_PARTY]: '看比赛'
}

const ACTIVITY_STATUS = {
  DRAFT: 'draft',
  OPEN: 'open',
  FULL: 'full',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

const ACTIVITY_STATUS_MAP = {
  [ACTIVITY_STATUS.DRAFT]: { label: '草稿', color: 'tertiary' },
  [ACTIVITY_STATUS.OPEN]: { label: '报名中', color: 'accent' },
  [ACTIVITY_STATUS.FULL]: { label: '已满员', color: 'warning' },
  [ACTIVITY_STATUS.ONGOING]: { label: '进行中', color: 'info' },
  [ACTIVITY_STATUS.COMPLETED]: { label: '已结束', color: 'tertiary' },
  [ACTIVITY_STATUS.CANCELLED]: { label: '已取消', color: 'danger' }
}

module.exports = {
  ACTIVITY_TYPE,
  ACTIVITY_TYPE_MAP,
  ACTIVITY_STATUS,
  ACTIVITY_STATUS_MAP
}
