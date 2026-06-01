const ORDER_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  PAID: 'paid',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  REVIEWED: 'reviewed'
}

const ORDER_STATUS_MAP = {
  [ORDER_STATUS.PENDING_PAYMENT]: { label: '待付款', color: 'warning' },
  [ORDER_STATUS.PAID]: { label: '已付款', color: 'accent' },
  [ORDER_STATUS.COMPLETED]: { label: '已完成', color: 'accent' },
  [ORDER_STATUS.CANCELLED]: { label: '已取消', color: 'tertiary' },
  [ORDER_STATUS.REFUNDED]: { label: '已退款', color: 'danger' },
  [ORDER_STATUS.REVIEWED]: { label: '已评价', color: 'accent' }
}

const ORDER_TYPE = {
  COACH_BOOKING: 'coach_booking',
  VENUE_BOOKING: 'venue_booking'
}

const ORDER_TYPE_MAP = {
  [ORDER_TYPE.COACH_BOOKING]: '教练预约',
  [ORDER_TYPE.VENUE_BOOKING]: '场地预约'
}

const PAYMENT_TIMEOUT = 15 * 60 * 1000 // 15 minutes in ms

module.exports = {
  ORDER_STATUS,
  ORDER_STATUS_MAP,
  ORDER_TYPE,
  ORDER_TYPE_MAP,
  PAYMENT_TIMEOUT
}
