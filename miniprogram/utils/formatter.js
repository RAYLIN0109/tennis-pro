/**
 * 价格格式化（分 -> 元）
 * @param {number} cents - 金额（分）
 * @returns {string} 如 "¥128.00"
 */
function price(cents) {
  if (cents === undefined || cents === null) return '¥0.00'
  return `¥${(cents / 100).toFixed(2)}`
}

/**
 * 简短价格（无小数位时省略）
 * @param {number} cents
 * @returns {string} 如 "¥128" 或 "¥128.50"
 */
function priceShort(cents) {
  if (cents === undefined || cents === null) return '¥0'
  const yuan = cents / 100
  if (Number.isInteger(yuan)) return `¥${yuan}`
  return `¥${yuan.toFixed(2)}`
}

/**
 * 评分格式化
 */
function rating(num) {
  if (!num && num !== 0) return '暂无'
  return num.toFixed(1)
}

/**
 * 网球级别显示
 */
function level(val) {
  if (!val) return ''
  return String(val)
}

/**
 * 截断字符串
 */
function truncate(str, len = 20) {
  if (!str) return ''
  if (str.length <= len) return str
  return str.substring(0, len) + '...'
}

/**
 * 时间范围显示
 */
function timeRange(start, end) {
  return `${start}-${end}`
}

/**
 * 价格区间显示
 */
function priceRange(min, max) {
  if (min === max) return priceShort(min)
  return `${priceShort(min)}-${priceShort(max)}`
}

module.exports = { price, priceShort, rating, level, truncate, timeRange, priceRange }
