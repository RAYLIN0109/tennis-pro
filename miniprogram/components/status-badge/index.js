const { ORDER_STATUS_MAP, ORDER_STATUS } = require('../../common/constants/order')
const { ACTIVITY_STATUS_MAP, ACTIVITY_STATUS } = require('../../common/constants/activity')

const STATUS_MAP = {
  ...ORDER_STATUS_MAP,
  [ORDER_STATUS.REVIEWED]: { label: '已评价', color: 'accent' },
  [ACTIVITY_STATUS.OPEN]: { label: '报名中', color: 'accent' },
  [ACTIVITY_STATUS.FULL]: { label: '已满员', color: 'warning' },
  [ACTIVITY_STATUS.ONGOING]: { label: '进行中', color: 'info' },
  [ACTIVITY_STATUS.COMPLETED]: { label: '已结束', color: 'tertiary' },
  [ACTIVITY_STATUS.CANCELLED]: { label: '已取消', color: 'danger' },
  // Schedule status
  available: { label: '可预约', color: 'accent' },
  booked: { label: '已预约', color: 'tertiary' },
  blocked: { label: '不可用', color: 'danger' },
  pending: { label: '待确认', color: 'warning' },
  // Coach status
  active: { label: '已认证', color: 'accent' },
  suspended: { label: '已暂停', color: 'danger' }
}

Component({
  options: { multipleSlots: true },
  externalClasses: ['custom-class'],
  properties: {
    status: { type: String, value: '' },
    type: { type: String, value: 'order' }
  },
  data: {
    label: '',
    colorClass: ''
  },
  observers: {
    'status': function (status) {
      const config = STATUS_MAP[status]
      if (config) {
        this.setData({
          label: config.label,
          colorClass: `badge-${config.color}`
        })
      } else {
        this.setData({ label: status, colorClass: 'badge-accent' })
      }
    }
  }
})
