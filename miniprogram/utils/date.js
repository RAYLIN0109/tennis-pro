/**
 * 格式化日期
 * @param {Date|string|number} date
 * @param {string} fmt - 格式字符串，如 'YYYY-MM-DD', 'MM-DD', 'HH:mm'
 */
function formatDate(date, fmt = 'YYYY-MM-DD') {
  const d = new Date(date)
  const map = {
    'YYYY': d.getFullYear(),
    'MM': String(d.getMonth() + 1).padStart(2, '0'),
    'DD': String(d.getDate()).padStart(2, '0'),
    'HH': String(d.getHours()).padStart(2, '0'),
    'mm': String(d.getMinutes()).padStart(2, '0'),
    'ss': String(d.getSeconds()).padStart(2, '0')
  }
  let result = fmt
  Object.keys(map).forEach((key) => {
    result = result.replace(key, map[key])
  })
  return result
}

/**
 * 获取今天日期字符串 YYYY-MM-DD
 */
function getToday() {
  return formatDate(new Date(), 'YYYY-MM-DD')
}

/**
 * 日期加减天数
 */
function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/**
 * 获取接下来 N 天的日期数组
 */
function getDateRange(start, count) {
  const dates = []
  const base = new Date(start)
  for (let i = 0; i < count; i++) {
    dates.push(addDays(base, i))
  }
  return dates
}

/**
 * 判断是否同一天
 */
function isSameDay(a, b) {
  const da = new Date(a)
  const db = new Date(b)
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
}

/**
 * 获取星期几 (0-6)
 */
function getWeekday(date) {
  return new Date(date).getDay()
}

/**
 * 获取星期标签
 */
function getWeekdayLabel(date) {
  const labels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return labels[getWeekday(date)]
}

/**
 * 获取相对日期描述
 */
function getRelativeDate(date) {
  const d = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)

  const diff = (d - today) / (1000 * 60 * 60 * 24)
  if (diff === 0) return '今天'
  if (diff === 1) return '明天'
  if (diff === 2) return '后天'
  if (diff === -1) return '昨天'
  return formatDate(date, 'MM-DD')
}

/**
 * 获取日期显示标签（用于日期选择器）
 */
function getDateTabLabel(date) {
  const d = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)

  const diff = (d - today) / (1000 * 60 * 60 * 24)
  if (diff === 0) return '今天'
  if (diff === 1) return '明天'
  return `${getWeekdayLabel(date)}\n${formatDate(date, 'MM/DD')}`
}

/**
 * 计算时长（分钟 -> 人类可读）
 */
function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}分钟`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}小时`
  return `${h}小时${m}分钟`
}

module.exports = {
  formatDate, getToday, addDays, getDateRange,
  isSameDay, getWeekday, getWeekdayLabel,
  getRelativeDate, getDateTabLabel, formatDuration
}
