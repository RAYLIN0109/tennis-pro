const COACH_SPECIALTIES = [
  '正手', '反手', '发球', '截击', '步法',
  '战术', '体能', '心理', '青少年培训', '成人零基础'
]

const COACH_CERTIFICATIONS = [
  'ITF Level 1', 'ITF Level 2', 'ITF Level 3',
  'PTR', 'USPTA',
  '国家一级', '国家二级', '国家三级'
]

const LESSON_TYPES = [
  { value: 'single', label: '单打' },
  { value: 'double', label: '双打' },
  { value: 'group', label: '小组课' }
]

const COACH_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended'
}

module.exports = {
  COACH_SPECIALTIES,
  COACH_CERTIFICATIONS,
  LESSON_TYPES,
  COACH_STATUS
}
