/**
 * 本地模拟数据 - 用于无云环境时的快速预览
 * 接入云环境后可删除此文件
 */

var IMG_BASE = 'https://design.gemcoder.com/staticResource/echoAiSystemImages/'

var mockUser = {
  _id: 'mock_user_1',
  _openid: 'mock_openid',
  nickname: '网球爱好者',
  avatar_url: '',
  gender: 1,
  phone: '138****8888',
  tennis_level: '3.5',
  bio: '热爱网球，每周打3次',
  city: '上海',
  role: ['user'],
  status: 'active',
  stats: { total_bookings: 12, total_reviews: 5, total_activities: 3 }
}

var mockCoaches = [
  {
    _id: 'coach_1',
    real_name: '张明远',
    specialties: ['正手', '发球', '战术'],
    certification_labels: ['ITF Level 2', '国家一级'],
    teaching_years: 8,
    hourly_rate: 30000,
    display_price: '300',
    trial_rate: 9900,
    bio: '前省队队员，擅长青少年及成人教学，教学风格耐心细致，注重基本功打磨。',
    rating: 4.8,
    ratingText: '4.8',
    review_count: 56,
    total_students: 120,
    status: 'active',
    city: '上海',
    photos: [IMG_BASE + 'd5d6fa5c33cdb90f966988e9dedca6b4.png'],
    user_info: { nickname: '张教练', avatar_url: IMG_BASE + 'd5d6fa5c33cdb90f966988e9dedca6b4.png', tennis_level: '7.0' }
  },
  {
    _id: 'coach_2',
    real_name: '李晓琳',
    specialties: ['双打', '截击', '步法'],
    certification_labels: ['PTR', '国家二级'],
    teaching_years: 5,
    hourly_rate: 25000,
    display_price: '250',
    trial_rate: 0,
    bio: '专注双打配合训练，帮助学员快速提升实战水平。多次获得市级双打冠军。',
    rating: 4.6,
    ratingText: '4.6',
    review_count: 38,
    total_students: 85,
    status: 'active',
    city: '上海',
    photos: [IMG_BASE + 'fe171625d839a1792c0d9226f6ca11ce.png'],
    user_info: { nickname: '李教练', avatar_url: IMG_BASE + 'fe171625d839a1792c0d9226f6ca11ce.png' }
  },
  {
    _id: 'coach_3',
    real_name: '王强',
    specialties: ['成人零基础', '体能', '心理'],
    certification_labels: ['ITF Level 1'],
    teaching_years: 3,
    hourly_rate: 18000,
    display_price: '180',
    trial_rate: 5000,
    bio: '擅长零基础学员入门教学，课程轻松有趣，让你快速享受网球乐趣。',
    rating: 4.5,
    ratingText: '4.5',
    review_count: 22,
    total_students: 45,
    status: 'active',
    city: '北京',
    photos: [IMG_BASE + 'ee782a4e8a14fe6a7807725fcfd887c6.png'],
    user_info: { nickname: '王教练', avatar_url: IMG_BASE + 'ee782a4e8a14fe6a7807725fcfd887c6.png' }
  },
  {
    _id: 'coach_4',
    real_name: '陈思涵',
    specialties: ['反手', '发球', '青少年培训'],
    certification_labels: ['ITF Level 3', 'USPTA'],
    teaching_years: 12,
    hourly_rate: 50000,
    display_price: '500',
    trial_rate: 15000,
    bio: '资深教练，培养多名青少年选手进入省队。教学严谨系统，注重长期技术发展规划。',
    rating: 4.9,
    ratingText: '4.9',
    review_count: 89,
    total_students: 200,
    status: 'active',
    city: '广州',
    photos: [],
    user_info: { nickname: '陈教练', avatar_url: '' }
  },
  {
    _id: 'coach_5',
    real_name: '赵宇飞',
    specialties: ['正手', '步法', '战术'],
    certification_labels: ['国家二级'],
    teaching_years: 6,
    hourly_rate: 22000,
    display_price: '220',
    trial_rate: 8000,
    bio: '退役职业选手，教学注重实战应用，帮助学员在比赛中取得突破。',
    rating: 4.7,
    ratingText: '4.7',
    review_count: 41,
    total_students: 95,
    status: 'active',
    city: '上海',
    photos: [],
    user_info: { nickname: '赵教练', avatar_url: '' }
  }
]

function generateMockSlots() {
  var slots = []
  var times = [
    ['07:00','07:30'],['07:30','08:00'],['08:00','08:30'],['08:30','09:00'],
    ['09:00','09:30'],['09:30','10:00'],['10:00','10:30'],['10:30','11:00'],
    ['11:00','11:30'],['11:30','12:00'],['14:00','14:30'],['14:30','15:00'],
    ['15:00','15:30'],['15:30','16:00'],['16:00','16:30'],['16:30','17:00'],
    ['17:00','17:30'],['17:30','18:00'],['18:00','18:30'],['18:30','19:00'],
    ['19:00','19:30'],['19:30','20:00'],['20:00','20:30'],['20:30','21:00']
  ]
  var bookedIndexes = [2, 3, 7, 12, 18]
  for (var i = 0; i < times.length; i++) {
    slots.push({
      slot_id: times[i][0].replace(':', ''),
      start_time: times[i][0],
      end_time: times[i][1],
      status: bookedIndexes.indexOf(i) > -1 ? 'booked' : 'available',
      price: i >= 16 ? 15000 : 10000,
      booked_by: null
    })
  }
  return slots
}

var mockReviews = [
  { _id: 'r1', rating: 5, content: '教练非常专业，讲解细致，动作纠正很到位。一节课下来进步明显，强烈推荐！', created_at: '2026-05-20', user_info: { nickname: '小明', avatar_url: '', tennis_level: '3.0' }, images: [] },
  { _id: 'r2', rating: 4, content: '教学经验丰富，能根据学员水平调整训练内容。场地环境也不错。', created_at: '2026-05-15', user_info: { nickname: '球友A', avatar_url: '' }, images: [] },
  { _id: 'r3', rating: 5, content: '第三次约课了，每次都有新的收获。教练很有耐心，完全不会催促。', created_at: '2026-05-10', user_info: { nickname: '网球新手', avatar_url: '', tennis_level: '2.0' }, images: [] }
]

var mockOrders = [
  {
    _id: 'order_1',
    order_no: 'TE20260520001',
    order_type: 'coach_booking',
    status: 'completed',
    resource_snapshot: { name: '张明远', avatar: IMG_BASE + 'd5d6fa5c33cdb90f966988e9dedca6b4.png' },
    resource_info: { name: '张明远', type: 'coach' },
    date: '2026-05-20',
    time_range: { start: '09:00', end: '10:00' },
    duration_minutes: 60,
    total_amount: 30000,
    reviewed: false,
    created_at: '2026-05-19T10:00:00Z'
  },
  {
    _id: 'order_3',
    order_no: 'TE20260528003',
    order_type: 'coach_booking',
    status: 'pending_payment',
    resource_snapshot: { name: '李晓琳', avatar: IMG_BASE + 'fe171625d839a1792c0d9226f6ca11ce.png' },
    resource_info: { name: '李晓琳', type: 'coach' },
    date: '2026-06-03',
    time_range: { start: '18:00', end: '19:00' },
    duration_minutes: 60,
    total_amount: 25000,
    reviewed: false,
    created_at: '2026-05-28T14:00:00Z'
  }
]

var mockMyReviews = [
  {
    _id: 'mock_review_001',
    order_id: 'mock_order_001',
    rating: 5,
    content: '教练非常专业，讲解清晰，对我的正手技术帮助很大！',
    target_type: 'coach',
    target_id: 'mock_coach_001',
    images: [],
    reply: null,
    is_anonymous: false,
    status: 'visible',
    created_at: '2026-05-20'
  },
  {
    _id: 'mock_review_002',
    order_id: 'mock_order_002',
    rating: 4,
    content: '场地环境不错，教练也很有耐心',
    target_type: 'coach',
    target_id: 'mock_coach_002',
    images: [],
    reply: null,
    is_anonymous: false,
    status: 'visible',
    created_at: '2026-05-15'
  }
]

module.exports = {
  mockUser: mockUser,
  mockCoaches: mockCoaches,
  mockReviews: mockReviews,
  mockOrders: mockOrders,
  mockMyReviews: mockMyReviews,
  generateMockSlots: generateMockSlots
}
