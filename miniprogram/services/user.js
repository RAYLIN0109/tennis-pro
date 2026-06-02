const { request, get, post } = require('../utils/request')

const UserService = {
  // 主动：用户点击登录
  login() { return request('user', 'login', {}, { showLoading: true, loadingText: '登录中...', showError: true }) },

  // 静默：onShow / 启动时拉取
  getProfile() { return get('user', 'getProfile', {}, { showError: false }) },
  getMyInfo() { return get('user', 'getMyInfo', {}, { showError: false }) },

  // 写操作：主动
  updateProfile(data) { return post('user', 'updateProfile', data, '保存中...') }
}

module.exports = UserService
