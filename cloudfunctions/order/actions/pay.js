/**
 * 支付订单
 * 支持开发模式和生产模式切换
 * 通过环境变量 PAY_MODE 控制：'production' 为真实支付，其他为模拟支付
 * 
 * 生产模式需在云函数环境变量中配置：
 *   PAY_MODE=production
 *   MERCHANT_KEY=你的微信支付商户API密钥
 */
const crypto = require('crypto')

module.exports = async function pay(db, openid, cloud, event) {
  const { orderId } = event
  if (!orderId) return { code: 9002, message: '缺少订单ID' }

  const orderDoc = await db.collection('orders').doc(orderId).get()
  const order = orderDoc.data

  if (!order) {
    return { code: 5004, message: '订单不存在' }
  }

  if (order.created_by !== openid) {
    return { code: 5001, message: '无权操作此订单' }
  }
  if (order.status !== 'pending_payment') {
    return { code: 5002, message: '订单状态不允许支付' }
  }

  const now = new Date()

  // 获取环境变量判断支付模式
  const payMode = process.env.PAY_MODE || 'development'

  if (payMode === 'production') {
    // 生产模式：调用微信支付统一下单
    try {
      const result = await cloud.cloudPay.unifiedOrder({
        body: order.title || '网球服务订单',
        outTradeNo: order.order_no,
        totalFee: order.total_amount,
        spbillCreateIp: '127.0.0.1',
        notifyUrl: '',
        tradeType: 'JSAPI',
        openid: openid
      })

      const wxContext = cloud.getWXContext()
      const payParams = {
        timeStamp: String(Date.now()),
        nonceStr: result.nonceStr,
        package: `prepay_id=${result.prepayId}`,
        signType: 'MD5'
      }

      // 生成支付签名（需要商户API密钥）
      const merchantKey = process.env.MERCHANT_KEY
      if (merchantKey) {
        const signStr = [
          `appId=${wxContext.APPID}`,
          `nonceStr=${payParams.nonceStr}`,
          `package=${payParams.package}`,
          `signType=${payParams.signType}`,
          `timeStamp=${payParams.timeStamp}`
        ].join('&') + `&key=${merchantKey}`
        payParams.paySign = crypto.createHash('md5').update(signStr).digest('hex').toUpperCase()
      } else {
        payParams.paySign = ''
        console.warn('[order:pay] 生产模式未配置 MERCHANT_KEY，paySign 为空，支付将失败')
      }

      return { code: 0, data: { ...payParams, orderId, simulated: false } }
    } catch (err) {
      console.error('[order:pay] 统一下单失败:', err)
      return { code: 5005, message: '支付接口调用失败' }
    }
  } else {
    // 开发模式：直接标记为已支付
    await db.collection('orders').doc(orderId).update({
      data: {
        status: 'paid',
        paid_amount: order.total_amount,
        paid_at: now,
        updated_at: now
      }
    })

    // 更新用户统计
    await db.collection('users').where({ _openid: openid }).update({
      data: {
        'stats.total_bookings': db.command.inc(1),
        updated_at: now
      }
    })

    // 异步发送模板消息（不阻塞支付流程）
    cloud.callFunction({
      name: 'notification',
      data: {
        action: 'sendTemplate',
        templateType: 'order_pay_success',
        openid,
        page: `pages/order/detail/index?id=${orderId}`,
        data: {
          title: order.resource_snapshot?.name || '网球服务订单',
          orderNo: order.order_no,
          amount: order.total_amount,
          paidAt: now.toLocaleString('zh-CN')
        }
      }
    }).catch(err => console.error('[order:pay] 发送模板消息失败:', err))

    return { code: 0, data: { simulated: true, orderId } }
  }
}