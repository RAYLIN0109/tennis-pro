const { get, post } = require('../utils/request')

const SocialService = {
  // Posts
  getPostList(params) { return get('social', 'post/list', params) },
  getPostDetail(id) { return get('social', 'post/detail', { id }) },
  createPost(data) { return post('social', 'post/create', data, '发布中...') },
  deletePost(id) { return post('social', 'post/delete', { id }, '删除中...') },
  toggleLike(id) { return post('social', 'post/like', { id }, '处理中...') },

  // Comments
  getCommentList(params) { return get('social', 'comment/list', params) },
  createComment(data) { return post('social', 'comment/create', data, '评论中...') }
}

module.exports = SocialService