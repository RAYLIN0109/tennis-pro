/**
 * 云函数请求封装
 * 统一的请求/响应协议：
 *   成功: { code: 0, data: {...} }
 *   失败: { code: <number>, message: "..." }
 */

const DEFAULT_OPTIONS = {
  showLoading: false,
  loadingText: '加载中...',
  showError: true
}

function request(name, action, data = {}, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  return new Promise((resolve, reject) => {
    if (opts.showLoading) {
      wx.showLoading({ title: opts.loadingText, mask: true })
    }

    wx.cloud.callFunction({
      name,
      data: { action, ...data },
      success: (res) => {
        const result = res.result
        if (!result) {
          const err = new Error('云函数返回为空')
          if (opts.showError) {
            wx.showToast({ title: '服务异常', icon: 'none' })
          }
          reject(err)
          return
        }

        if (result.code === 0) {
          resolve(result.data)
        } else {
          const err = new Error(result.message || '请求失败')
          err.code = result.code
          if (opts.showError) {
            wx.showToast({ title: result.message || '请求失败', icon: 'none', duration: 2000 })
          }
          reject(err)
        }
      },
      fail: (err) => {
        if (opts.showError) {
          wx.showToast({ title: '网络异常，请稍后重试', icon: 'none', duration: 2000 })
        }
        reject(err)
      },
      complete: () => {
        if (opts.showLoading) {
          wx.hideLoading()
        }
      }
    })
  })
}

function get(name, action, data = {}, options = {}) {
  return request(name, action, data, { showLoading: false, showError: false, ...options })
}

function post(name, action, data = {}, loadingText = '提交中...') {
  return request(name, action, data, { showLoading: true, loadingText, showError: true })
}

module.exports = { request, get, post }
