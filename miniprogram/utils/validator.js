/**
 * 必填校验
 */
function required(val, fieldName) {
  if (val === undefined || val === null || val === '') {
    return `请输入${fieldName}`
  }
  return null
}

/**
 * 手机号校验
 */
function phone(val) {
  if (!val) return null
  if (!/^1[3-9]\d{9}$/.test(val)) {
    return '请输入正确的手机号'
  }
  return null
}

/**
 * 数值范围校验
 */
function inRange(val, min, max, fieldName) {
  if (val === undefined || val === null) return null
  const num = Number(val)
  if (isNaN(num) || num < min || num > max) {
    return `${fieldName}应在${min}-${max}之间`
  }
  return null
}

/**
 * 正整数校验
 */
function isPositiveInt(val, fieldName) {
  if (val === undefined || val === null) return null
  if (!Number.isInteger(val) || val <= 0) {
    return `${fieldName}应为正整数`
  }
  return null
}

/**
 * 批量表单校验
 * @param {Array} rules - [{ field, rules: [{ type, ...args }] }]
 * @param {Object} data - 表单数据
 * @returns {string|null} 第一个错误信息，或 null
 */
function validateForm(rules, data) {
  for (const rule of rules) {
    const val = data[rule.field]
    for (const r of rule.rules) {
      let error = null
      switch (r.type) {
        case 'required':
          error = required(val, r.message || rule.field)
          break
        case 'phone':
          error = phone(val)
          break
        case 'range':
          error = inRange(val, r.min, r.max, r.message || rule.field)
          break
        case 'positiveInt':
          error = isPositiveInt(val, r.message || rule.field)
          break
      }
      if (error) return error
    }
  }
  return null
}

module.exports = { required, phone, inRange, isPositiveInt, validateForm }
