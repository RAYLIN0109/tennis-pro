/**
 * 微信小程序模板消息订阅工具
 * 
 * 在需要发送模板消息的关键操作前，调用 subscribeMessage 请求用户授权。
 * 用户授权后，云函数才能通过 cloud.openapi.subscribeMessage.send 发送模板消息。
 * 
 * 模板ID 需替换为微信小程序管理后台配置的真实模板ID。
 * 同一模板同一次订阅仅支持发送一条消息。
 */

// 模板ID配置（占位符，需替换为微信小程序管理后台的真实模板ID）
const TEMPLATE_IDS = {
  // 订单支付成功通知
  order_pay_success: '',
  // 订单取消通知
  order_cancel: '',
  // 活动状态提醒
  activity_reminder: '',
  // 教练审核结果通知
  coach_audit: ''
}

/**
 * 请求订阅模板消息
 * @param {string|string[]} tmplIds - 模板ID或模板ID数组
 * @param {object} [options] - 可选参数
 * @param {boolean} [options.showModal=true] - 是否在订阅前弹窗提示
 * @param {string} [options.modalTitle='温馨提示'] - 弹窗标题
 * @param {string} [options.modalContent='即将请求订阅消息授权，以便及时接收通知'] - 弹窗内容
 * @returns {Promise<object>} 订阅结果 { [tmplId]: 'accept' | 'reject' | 'ban' }
 */
function requestSubscribeMessage(tmplIds, options = {}) {
  const { showModal = true, modalTitle = '温馨提示', modalContent = '为了及时接收订单状态变更通知，请允许订阅消息' } = options

  const ids = Array.isArray(tmplIds) ? tmplIds : [tmplIds]

  // 过滤掉未配置的模板ID
  const validIds = ids.filter(id => id && typeof id === 'string' && id.length > 0)

  if (validIds.length === 0) {
    console.warn('[subscribeMessage] 没有有效的模板ID，跳过订阅请求')
    return Promise.resolve({})
  }

  const doSubscribe = () => {
    return new Promise((resolve) => {
      wx.requestSubscribeMessage({
        tmplIds: validIds,
        success: (res) => {
          // res[templateId] 可能为 'accept'、'reject'、'ban'
          console.log('[subscribeMessage] 订阅结果:', res)
          resolve(res)
        },
        fail: (err) => {
          console.warn('[subscribeMessage] 订阅请求失败:', err)
          resolve({})
        }
      })
    })
  }

  if (showModal) {
    return new Promise((resolve) => {
      wx.showModal({
        title: modalTitle,
        content: modalContent,
        confirmText: '允许',
        cancelText: '暂不',
        success: (res) => {
          if (res.confirm) {
            doSubscribe().then(resolve)
          } else {
            resolve({})
          }
        }
      })
    })
  }

  return doSubscribe()
}

/**
 * 订阅订单相关模板消息（支付成功 + 取消通知）
 * 在创建订单/支付前调用
 */
function subscribeOrder() {
  const ids = [TEMPLATE_IDS.order_pay_success, TEMPLATE_IDS.order_cancel].filter(Boolean)
  return requestSubscribeMessage(ids, {
    modalContent: '为了及时接收订单状态变更通知，请允许订阅消息'
  })
}

/**
 * 订阅活动相关模板消息（活动提醒）
 * 在报名活动前调用
 */
function subscribeActivity() {
  const ids = [TEMPLATE_IDS.activity_reminder].filter(Boolean)
  return requestSubscribeMessage(ids, {
    modalContent: '为了及时接收活动状态通知，请允许订阅消息'
  })
}

/**
 * 订阅教练审核结果模板消息
 * 在提交教练申请前调用
 */
function subscribeCoachAudit() {
  const ids = [TEMPLATE_IDS.coach_audit].filter(Boolean)
  return requestSubscribeMessage(ids, {
    modalContent: '为了及时接收教练认证审核结果通知，请允许订阅消息'
  })
}

module.exports = {
  requestSubscribeMessage,
  subscribeOrder,
  subscribeActivity,
  subscribeCoachAudit,
  TEMPLATE_IDS
}