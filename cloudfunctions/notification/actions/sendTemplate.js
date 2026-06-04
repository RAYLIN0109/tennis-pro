/**
 * 发送微信小程序模板消息
 * 
 * 集中处理所有模板消息的发送，其他云函数通过 cloud.callFunction 调用。
 * 模板ID 通过云函数环境变量配置：
 *   TPL_ORDER_PAY_SUCCESS=模板ID1
 *   TPL_ORDER_CANCEL=模板ID2
 *   TPL_ACTIVITY_REMINDER=模板ID3
 *   TPL_COACH_AUDIT=模板ID4
 */

// 默认模板ID（占位符，需替换为微信小程序管理后台配置的真实模板ID）
const DEFAULT_TEMPLATE_IDS = {
  order_pay_success: '填写你的订单支付成功模板ID',
  order_cancel: '填写你的订单取消模板ID',
  activity_reminder: '填写你的活动提醒模板ID',
  coach_audit: '填写你的教练审核结果模板ID'
}

/**
 * 获取模板ID（优先使用环境变量，其次使用默认值）
 */
function getTemplateId(key) {
  const envKey = `TPL_${key.toUpperCase()}`
  return process.env[envKey] || DEFAULT_TEMPLATE_IDS[key] || ''
}

/**
 * 发送模板消息
 */
async function sendTemplateMessage(cloud, { openid, templateId, page, data, miniprogramState = 'formal' }) {
  if (!openid) {
    console.warn('[sendTemplate] 缺少 openid，跳过')
    return { code: -1, message: '缺少 openid' }
  }

  if (!templateId || templateId.startsWith('填写你的')) {
    console.warn('[sendTemplate] 模板ID未配置，跳过:', templateId)
    return { code: -2, message: '模板ID未配置' }
  }

  try {
    const result = await cloud.openapi.subscribeMessage.send({
      touser: openid,
      templateId,
      page: page || '',
      data,
      miniprogramState
    })

    console.log('[sendTemplate] 发送成功:', JSON.stringify(result))
    return { code: 0, data: result }
  } catch (err) {
    if (err.errCode === 43101) {
      console.warn('[sendTemplate] 用户未订阅该模板:', templateId)
    } else if (err.errCode === 40003) {
      console.warn('[sendTemplate] 无效的 openid:', openid)
    } else {
      console.error('[sendTemplate] 发送失败:', err)
    }
    return { code: err.errCode || -3, message: err.message || '发送失败' }
  }
}

module.exports = async function sendTemplate(cloud, event) {
  const { templateType, openid, page, data } = event

  if (!templateType || !openid) {
    return { code: 9002, message: '缺少必要参数' }
  }

  const templateId = getTemplateId(templateType)

  // 如果模板ID未配置，记录日志但不阻塞
  if (!templateId || templateId.startsWith('填写你的')) {
    console.warn(`[sendTemplate] 模板类型 ${templateType} 未配置，跳过`)
    return { code: 0, data: { skipped: true } }
  }

  // 根据模板类型构建标准数据结构
  const templateData = buildTemplateData(templateType, data)

  return sendTemplateMessage(cloud, {
    openid,
    templateId,
    page,
    data: templateData
  })
}

/**
 * 根据模板类型构建标准数据格式
 */
function buildTemplateData(type, data) {
  const templates = {
    order_pay_success: {
      thing1: { value: data?.title || '网球服务订单' },
      amount2: { value: `¥${((data?.amount || 0) / 100).toFixed(2)}` },
      date3: { value: data?.paidAt || new Date().toLocaleString('zh-CN') },
      thing4: { value: data?.orderNo || '' }
    },
    order_cancel: {
      thing1: { value: data?.title || '网球服务订单' },
      thing2: { value: data?.orderNo || '' },
      date3: { value: data?.cancelTime || new Date().toLocaleString('zh-CN') },
      thing4: { value: data?.reason || '用户取消' }
    },
    activity_reminder: {
      thing1: { value: data?.activityTitle || '' },
      date2: { value: data?.startTime || '' },
      thing3: { value: data?.location || '详见活动详情' },
      thing4: { value: data?.tip || '请按时参加活动' }
    },
    coach_audit: {
      thing1: { value: data?.result || '' },
      thing2: { value: data?.reason || '无' },
      date3: { value: data?.auditTime || new Date().toLocaleString('zh-CN') }
    }
  }

  return templates[type] || data || {}
}

module.exports.sendTemplateMessage = sendTemplateMessage
module.exports.getTemplateId = getTemplateId