const { request } = require('./request')

function getAppInstance() {
  return getApp()
}

function login() {
  const app = getAppInstance()
  return request('user', 'login', {}, { showLoading: true, loadingText: '登录中...' })
    .then((data) => {
      app.globalData.openid = data._openid
      app.globalData.userInfo = data
      return data
    })
}

function checkLogin() {
  const app = getAppInstance()
  return !!app.globalData.openid
}

function ensureLogin() {
  if (checkLogin()) {
    const app = getAppInstance()
    return Promise.resolve(app.globalData.userInfo)
  }
  return login().catch(() => {
    wx.navigateTo({ url: '/pages/user/login/index' })
    return Promise.reject(new Error('未登录'))
  })
}

function getUserProfile() {
  const app = getAppInstance()
  return request('user', 'getProfile')
    .then((data) => {
      app.globalData.userInfo = data
      return data
    })
}

function getMyInfo() {
  const app = getAppInstance()
  return request('user', 'getMyInfo')
    .then((data) => {
      app.globalData.userInfo = data
      app.globalData.openid = data._openid
      return data
    })
}

function logout() {
  const app = getAppInstance()
  app.globalData.userInfo = null
  app.globalData.openid = null
}

module.exports = { login, checkLogin, ensureLogin, getUserProfile, getMyInfo, logout }
