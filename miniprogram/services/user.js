const { request, get, post } = require('../utils/request')

const UserService = {
  login() {
    return request('user', 'login', {}, { showLoading: true, loadingText: '登录中...' })
  },

  getProfile() {
    return get('user', 'getProfile')
  },

  updateProfile(data) {
    return post('user', 'updateProfile', data, '保存中...')
  },

  getMyInfo() {
    return get('user', 'getMyInfo')
  }
}

module.exports = UserService
