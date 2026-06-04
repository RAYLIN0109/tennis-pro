/**
 * sendTemplate.js 单元测试
 * 使用 Node.js + Jest 测试框架
 * 运行方式：cd cloudfunctions/notification && npm install jest --save-dev && npx jest
 */

// 模拟 wx-server-sdk
jest.mock('wx-server-sdk', () => {
  const mockCloud = {
    init: jest.fn(),
    openapi: {
      subscribeMessage: {
        send: jest.fn()
      }
    }
  }
  return {
    ...mockCloud,
    init: jest.fn(() => mockCloud),
    DYNAMIC_CURRENT_ENV: 'test-env'
  }
})

const cloud = require('wx-server-sdk')

// 注意：sendTemplate.js 中 module.exports 是 async function
// 且内部有 sendTemplateMessage 和 getTemplateId 作为属性
const sendTemplateModule = require('../actions/sendTemplate')

describe('sendTemplate 单元测试', () => {

  beforeEach(() => {
    jest.clearAllMocks()
    // 清理环境变量
    delete process.env.TPL_ORDER_PAY_SUCCESS
    delete process.env.TPL_ORDER_CANCEL
    delete process.env.TPL_ACTIVITY_REMINDER
    delete process.env.TPL_COACH_AUDIT
  })

  // ========== getTemplateId 测试 ==========

  test('getTemplateId 应优先使用环境变量', () => {
    process.env.TPL_ORDER_PAY_SUCCESS = 'env_template_id_123'
    const id = sendTemplateModule.getTemplateId('order_pay_success')
    expect(id).toBe('env_template_id_123')
  })

  test('getTemplateId 应回退到默认值', () => {
    const id = sendTemplateModule.getTemplateId('order_pay_success')
    expect(id).toBe('填写你的订单支付成功模板ID')
  })

  test('getTemplateId 对未知key应返回空字符串', () => {
    const id = sendTemplateModule.getTemplateId('unknown_type')
    expect(id).toBe('')
  })

  // ========== sendTemplateMessage 测试 ==========

  test('sendTemplateMessage 应拒绝空openid', async () => {
    const result = await sendTemplateModule.sendTemplateMessage(cloud, {
      openid: '', templateId: 'some_id', data: {}
    })
    expect(result.code).toBe(-1)
    expect(result.message).toBe('缺少 openid')
  })

  test('sendTemplateMessage 应拒绝占位符模板ID', async () => {
    const result = await sendTemplateModule.sendTemplateMessage(cloud, {
      openid: 'test_openid', templateId: '填写你的订单支付成功模板ID', data: {}
    })
    expect(result.code).toBe(-2)
    expect(result.message).toBe('模板ID未配置')
  })

  test('sendTemplateMessage 发送成功应返回code 0', async () => {
    cloud.openapi.subscribeMessage.send.mockResolvedValue({ errcode: 0, errmsg: 'ok' })
    
    const result = await sendTemplateModule.sendTemplateMessage(cloud, {
      openid: 'test_openid',
      templateId: 'real_template_id',
      page: 'pages/order/list/index',
      data: { thing1: { value: 'test' } }
    })
    expect(result.code).toBe(0)
    expect(cloud.openapi.subscribeMessage.send).toHaveBeenCalledWith({
      touser: 'test_openid',
      templateId: 'real_template_id',
      page: 'pages/order/list/index',
      data: { thing1: { value: 'test' } },
      miniprogramState: 'formal'
    })
  })

  test('sendTemplateMessage 应处理用户未订阅错误(43101)', async () => {
    cloud.openapi.subscribeMessage.send.mockRejectedValue({ errCode: 43101, message: 'user refuse to accept the msg' })
    
    const result = await sendTemplateModule.sendTemplateMessage(cloud, {
      openid: 'test_openid', templateId: 'real_id', data: {}
    })
    expect(result.code).toBe(43101)
  })

  test('sendTemplateMessage 应处理无效openid错误(40003)', async () => {
    cloud.openapi.subscribeMessage.send.mockRejectedValue({ errCode: 40003, message: 'invalid openid' })
    
    const result = await sendTemplateModule.sendTemplateMessage(cloud, {
      openid: 'bad_openid', templateId: 'real_id', data: {}
    })
    expect(result.code).toBe(40003)
  })

  // ========== main sendTemplate function 测试 ==========

  test('sendTemplate 缺少参数应返回错误', async () => {
    const result = await sendTemplateModule(cloud, { templateType: 'order_pay_success' })
    expect(result.code).toBe(9002)
    expect(result.message).toBe('缺少必要参数')
  })

  test('sendTemplate 模板ID未配置应跳过(不阻塞)', async () => {
    const result = await sendTemplateModule(cloud, {
      templateType: 'order_pay_success',
      openid: 'test_openid',
      page: '',
      data: { title: '测试订单', amount: 5000, orderNo: 'TE2026', paidAt: '2026-06-04 15:00' }
    })
    expect(result.code).toBe(0) // 返回成功但不发送
    expect(result.data.skipped).toBe(true)
    expect(cloud.openapi.subscribeMessage.send).not.toHaveBeenCalled()
  })

  test('sendTemplate 正常发送order_pay_success', async () => {
    process.env.TPL_ORDER_PAY_SUCCESS = 'real_template_id'
    cloud.openapi.subscribeMessage.send.mockResolvedValue({ errcode: 0 })

    const result = await sendTemplateModule(cloud, {
      templateType: 'order_pay_success',
      openid: 'test_openid',
      page: 'pages/order/detail/index?id=123',
      data: { title: '教练预约订单', amount: 10000, orderNo: 'TE202606041200', paidAt: '2026-06-04 15:30' }
    })
    expect(result.code).toBe(0)
    expect(cloud.openapi.subscribeMessage.send).toHaveBeenCalledWith(
      expect.objectContaining({
        touser: 'test_openid',
        templateId: 'real_template_id',
        page: 'pages/order/detail/index?id=123',
        data: {
          thing1: { value: '教练预约订单' },
          amount2: { value: '¥100.00' },
          date3: { value: '2026-06-04 15:30' },
          thing4: { value: 'TE202606041200' }
        }
      })
    )
  })

  test('sendTemplate 正常发送activity_reminder', async () => {
    process.env.TPL_ACTIVITY_REMINDER = 'activity_tpl_id'

    const result = await sendTemplateModule(cloud, {
      templateType: 'activity_reminder',
      openid: 'test_openid',
      page: 'pages/activity/detail/index?id=abc',
      data: {
        activityTitle: '周六网球友谊赛',
        startTime: '2026-06-10 14:00',
        location: '天河体育中心网球场',
        tip: '报名成功，请按时参加活动'
      }
    })

    expect(result.code).toBe(0)
    expect(cloud.openapi.subscribeMessage.send).toHaveBeenCalledWith(
      expect.objectContaining({
        templateId: 'activity_tpl_id',
        data: {
          thing1: { value: '周六网球友谊赛' },
          date2: { value: '2026-06-10 14:00' },
          thing3: { value: '天河体育中心网球场' },
          thing4: { value: '报名成功，请按时参加活动' }
        }
      })
    )
  })

  test('sendTemplate 处理全部字段为空的边界情况', async () => {
    process.env.TPL_ORDER_CANCEL = 'cancel_tpl_id'
    cloud.openapi.subscribeMessage.send.mockResolvedValue({ errcode: 0 })

    const result = await sendTemplateModule(cloud, {
      templateType: 'order_cancel',
      openid: 'test_openid',
      page: '',
      data: {}  // 所有字段为空
    })
    expect(result.code).toBe(0)
    // 应使用默认值填充
    expect(cloud.openapi.subscribeMessage.send).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          thing1: { value: '网球服务订单' },
          thing2: { value: '' },
          date3: expect.any(Object),
          thing4: { value: '用户取消' }
        }
      })
    )
  })

  test('sendTemplate 未知模板类型应使用原始data', async () => {
    process.env.TPL_UNKNOWN = 'unknown_tpl_id'
    const result = await sendTemplateModule(cloud, {
      templateType: 'unknown',
      openid: 'test_openid',
      page: '',
      data: { custom_field: 'test' }
    })
    // 未知类型不会匹配到环境变量（环境变量是 TPL_UNKNOWN 但 getTemplateId('unknown') 查询的是 TPL_UNKNOWN）
    // 所以会走到占位符检查逻辑
    expect(result.code).toBe(0)
    expect(result.data.skipped).toBe(true)
  })
})