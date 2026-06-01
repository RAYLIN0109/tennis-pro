const TENNIS_LEVELS = [
  { value: '1.0', label: '1.0 入门' },
  { value: '1.5', label: '1.5 初学' },
  { value: '2.0', label: '2.0 初级' },
  { value: '2.5', label: '2.5 初级+' },
  { value: '3.0', label: '3.0 中级' },
  { value: '3.5', label: '3.5 中级+' },
  { value: '4.0', label: '4.0 进阶' },
  { value: '4.5', label: '4.5 高级' },
  { value: '5.0', label: '5.0 精英' },
  { value: '5.5', label: '5.5 专家' },
  { value: '6.0', label: '6.0 专业' },
  { value: '7.0', label: '7.0 职业' }
]

const GENDER_OPTIONS = [
  { value: 0, label: '保密' },
  { value: 1, label: '男' },
  { value: 2, label: '女' }
]

const USER_ROLES = {
  USER: 'user',
  COACH: 'coach',
  VENUE_OWNER: 'venue_owner'
}

module.exports = {
  TENNIS_LEVELS,
  GENDER_OPTIONS,
  USER_ROLES
}
