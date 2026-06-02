# VIBE-ALL · 一站式开发任务清单

> **文档编号**: VIBE-ALL
> **版本**: 1.0
> **创建日期**: 2026-06-02
> **合并自**: vibe-01（教练一期）+ vibe-02（个人中心二期）+ vibe-03（Bug 修复）
> **适用范围**: 微信云开发小程序 · 全方位网球生态 · 一站式落地

---

## 0. 总览

| 维度 | 数值 |
|---|---|
| 任务总数 | **26 个**（顺序编号 T1-T26） |
| 涉及文件 | **34 个**（22 改 + 12 新） |
| 新增代码 | **~1100 行** |
| 预计工时 | **3-4 小时**（单人顺序执行） |
| 执行顺序 | **T1 → T26 严格串行** |

### 0.1 冲突已解决说明

编写本文件时，**vibe-03 文档中已经包含了 vibe-01 T6 和 vibe-02 T4/T11 对 profile 页的所有改动**（"我的评价"菜单、教练认证区块、通知红点、骨架屏、登录态修复），所以无需重复执行。**本文件只列出每个文件的"最终状态"代码**。

### 0.2 执行架构

```
T1-T9   Part 1 · Bug 修复（最优先，修复基础链路）
T10-T16 Part 2 · 约教练模块（云端 + 前端）
T17-T25 Part 3 · 个人中心+登录（隐私协议、我的评价、修复）
T26     Part 4 · app.json 一次性注册所有新页面
```

---

## Part 1 · Bug 修复（来自 vibe-03）

### T1 · `miniprogram/utils/request.js` · `get()` 支持 options 透传

**操作**: 把第 62-64 行的 `get()` 函数**替换**为：

```js
function get(name, action, data = {}, options = {}) {
  return request(name, action, data, { showLoading: false, showError: true, ...options })
}
```

**说明**: 让 `get()` 调用方能传 `{ showError: false }` 静默失败。

---

### T2 · `miniprogram/services/coach.js` · 整文件替换

**完整文件内容**:

```js
const { get, post } = require('../utils/request')

const CoachService = {
  // 列表/搜索/查询类：静默（onShow 自动触发，不弹错）
  getList(params) { return get('coach', 'list', params, { showError: false }) },
  getDetail(coachId) { return get('coach', 'detail', { coachId }, { showError: false }) },
  search(keyword, page = 1) { return get('coach', 'search', { keyword, page }, { showError: false }) },
  getMyCoachStatus() { return get('coach', 'getMyStatus', {}, { showError: false }) },

  // 写操作：主动提示
  apply(data) { return post('coach', 'applyCoach', data, '提交中...') }
}

module.exports = CoachService
```

---

### T3 · `miniprogram/services/notification.js` · 整文件替换

**完整文件内容**:

```js
const { get, post } = require('../utils/request')

const NotificationService = {
  getList(params) { return get('notification', 'list', params, { showError: false }) },
  getUnreadCount() { return get('notification', 'unreadCount', {}, { showError: false }) },
  markRead(notificationId) { return post('notification', 'markRead', { notificationId }, '标记中...') },
  markAllRead() { return post('notification', 'markAllRead', {}, '标记中...') }
}

module.exports = NotificationService
```

---

### T4 · `miniprogram/services/user.js` · 整文件替换

**完整文件内容**:

```js
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
```

---

### T5 · `miniprogram/pages/user/profile/index.wxml` · 整文件替换

**完整文件内容**:

```xml
<view class="profile-page page-container">
  <!-- 已登录 + 已加载 -->
  <block wx:if="{{isLoggedIn && profileLoaded}}">
    <!-- Header Card -->
    <view class="profile-header card">
      <view class="profile-avatar-row" bindtap="goEditProfile">
        <image
          class="profile-avatar"
          src="{{userInfo.avatar_url || '/common/images/default-avatar.png'}}"
          mode="aspectFill"
        />
        <view class="profile-name-area">
          <text class="profile-name">{{userInfo.nickname || '点击设置昵称'}}</text>
          <view wx:if="{{userInfo.tennis_level}}" class="badge badge-accent">
            {{userInfo.tennis_level}}
          </view>
        </view>
        <text class="profile-edit-link">编辑 ></text>
      </view>
    </view>

    <!-- Stats Row -->
    <view class="profile-stats card">
      <view class="stat-item">
        <text class="stat-num">{{stats.total_bookings}}</text>
        <text class="stat-label">预约</text>
      </view>
      <view class="stat-item">
        <text class="stat-num">{{stats.total_activities}}</text>
        <text class="stat-label">活动</text>
      </view>
      <view class="stat-item">
        <text class="stat-num">{{stats.total_reviews}}</text>
        <text class="stat-label">评价</text>
      </view>
    </view>

    <!-- Coach Certification Block -->
    <view wx:if="{{coachInfo && coachInfo.has_apply}}" class="coach-cert-section">
      <view class="coach-cert-card">
        <text class="cert-title">我的教练认证</text>
        <view wx:if="{{coachInfo.coach.status === 'pending'}}" class="cert-status cert-pending">
          <text>审核中，请耐心等待</text>
        </view>
        <view wx:if="{{coachInfo.coach.status === 'active'}}" class="cert-status cert-active">
          <text>已认证</text>
        </view>
        <view wx:if="{{coachInfo.coach.status === 'suspended'}}" class="cert-status cert-suspended">
          <text>认证未通过：{{coachInfo.coach.reject_reason || '已停用'}}</text>
        </view>
      </view>
      <view wx:if="{{coachInfo.coach.status === 'suspended'}}" class="cert-actions">
        <button class="btn-primary btn-reapply" bindtap="goReapply">重新申请</button>
      </view>
    </view>

    <!-- Notification Entry -->
    <view class="profile-notify card" bindtap="goNotifications">
      <text class="menu-label">消息通知</text>
      <view class="notify-right">
        <text wx:if="{{unreadCount > 0}}" class="badge-unread">{{unreadCount > 99 ? '99+' : unreadCount}}</text>
        <text class="menu-arrow">></text>
      </view>
    </view>

    <!-- Menu List -->
    <view class="profile-menu card">
      <view class="menu-item" bindtap="goOrders">
        <text class="menu-label">我的订单</text>
        <text class="menu-arrow">></text>
      </view>
      <view class="menu-item" bindtap="goReviews">
        <text class="menu-label">我的评价</text>
        <text class="menu-arrow">></text>
      </view>
      <view class="menu-item" bindtap="goSettings">
        <text class="menu-label">设置</text>
        <text class="menu-arrow">></text>
      </view>
    </view>
  </block>

  <!-- 未登录 -->
  <block wx:elif="{{!isLoggedIn}}">
    <view class="profile-empty-wrap">
      <empty-state
        title="尚未登录"
        description="登录后享受完整网球生态体验"
        actionText="立即登录"
        bind:action="goLogin"
      />
    </view>
  </block>

  <!-- 已登录 + 加载中骨架屏 -->
  <block wx:else>
    <view class="profile-skeleton">
      <view class="skel-header card">
        <view class="skel-avatar skel-shimmer"></view>
        <view class="skel-lines">
          <view class="skel-line skel-line-lg skel-shimmer"></view>
          <view class="skel-line skel-line-sm skel-shimmer"></view>
        </view>
      </view>
      <view class="skel-card skel-stats skel-shimmer"></view>
      <view class="skel-card skel-menu-1 skel-shimmer"></view>
      <view class="skel-card skel-menu-2 skel-shimmer"></view>
    </view>
  </block>
</view>
```

---

### T6 · `miniprogram/pages/user/profile/index.wxss` · **末尾追加**

**操作**: 不要覆盖原内容，在文件**最末尾**追加以下 CSS：

```css
/* === Empty State Wrapper（防止坍缩） === */
.profile-empty-wrap {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* === Skeleton Loader === */
.profile-skeleton {
  padding: 0;
}
.skel-header {
  display: flex;
  align-items: center;
  margin-bottom: var(--space-4);
}
.skel-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  flex-shrink: 0;
}
.skel-lines {
  flex: 1;
  margin-left: var(--space-5);
  display: flex;
  flex-direction: column;
}
.skel-line {
  height: 24rpx;
  border-radius: 4rpx;
  margin-bottom: 12rpx;
}
.skel-line-lg { width: 60%; height: 32rpx; }
.skel-line-sm { width: 30%; height: 20rpx; margin-bottom: 0; }
.skel-card {
  height: 160rpx;
  border-radius: 16rpx;
  margin-bottom: var(--space-4);
}
.skel-stats { height: 140rpx; }
.skel-menu-1, .skel-menu-2 { height: 100rpx; }
.skel-shimmer {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

### T7 · `miniprogram/pages/user/profile/index.js` · 整文件替换

**完整文件内容**:

```js
const UserService = require('../../services/user')
const CoachService = require('../../services/coach')
const NotificationService = require('../../services/notification')
const { checkLogin } = require('../../utils/auth')
var mock = require('../../common/mock-data')

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    profileLoaded: false,
    stats: { total_bookings: 0, total_reviews: 0, total_activities: 0 },
    coachInfo: null,
    unreadCount: 0
  },

  onShow() {
    const loggedIn = checkLogin()
    this.setData({ isLoggedIn: loggedIn })

    if (loggedIn) {
      // 已登录：未加载过时显示骨架屏
      if (!this.data.profileLoaded) {
        this.setData({ profileLoaded: false })
      }
      this.loadProfile()
      this.loadCoachStatus()
      this.loadUnreadCount()
    } else {
      // 未登录：跳过骨架屏，直接进入 B 块
      this.setData({ profileLoaded: true, userInfo: null, coachInfo: null, unreadCount: 0 })
    }
  },

  loadProfile() {
    UserService.getProfile()
      .then((data) => {
        this.setData({
          userInfo: data,
          profileLoaded: true,
          stats: data.stats || { total_bookings: 0, total_reviews: 0, total_activities: 0 }
        })
      })
      .catch(() => {
        // 静默回退到 mock
        var u = mock.mockUser
        this.setData({
          userInfo: u,
          profileLoaded: true,
          stats: u.stats || { total_bookings: 0, total_reviews: 0, total_activities: 0 }
        })
      })
  },

  loadCoachStatus() {
    CoachService.getMyCoachStatus().then(res => {
      this.setData({ coachInfo: res })
    }).catch(() => {})
  },

  loadUnreadCount() {
    NotificationService.getUnreadCount().then(res => {
      this.setData({ unreadCount: res.count || 0 })
    }).catch(() => {})
  },

  goReapply() {
    wx.navigateTo({ url: '/pages/user/coach-apply/index?mode=edit' })
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/user/login/index' })
  },

  goEditProfile() {
    wx.navigateTo({ url: '/pages/user/edit-profile/index' })
  },

  goOrders() {
    wx.navigateTo({ url: '/pages/order/list/index' })
  },

  goReviews() {
    wx.navigateTo({ url: '/pages/review/list/index?from=mine' })
  },

  goSettings() {
    wx.navigateTo({ url: '/pages/user/settings/index' })
  },

  goNotifications() {
    wx.showToast({ title: '通知列表即将上线', icon: 'none' })
  }
})
```

---

### T8 · `miniprogram/app.js` · 整文件替换

**完整文件内容**:

```js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 以上的基础库以使用云能力')
    } else {
      try {
        wx.cloud.init({
          // env: 'your-env-id', // 接入云环境后替换为真实环境ID
          traceUser: true
        })
      } catch (e) {
        console.warn('云开发初始化失败（暂无云环境）:', e.message)
      }
    }

    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync()
    this.globalData.systemInfo = systemInfo
    this.globalData.statusBarHeight = systemInfo.statusBarHeight
    this.globalData.navBarHeight = 44
    this.globalData.safeAreaBottom = systemInfo.screenHeight - systemInfo.safeArea.bottom

    // 静默登录尝试（不阻塞首屏，失败绝不弹 toast）
    this.silentLogin()
  },

  silentLogin() {
    const { request } = require('./utils/request')
    request('user', 'login', {}, { showLoading: false, showError: false })
      .then((data) => {
        this.globalData.openid = data._openid
        this.globalData.userInfo = data
        console.log('[silentLogin] success', data._openid)
      })
      .catch((err) => {
        console.log('[silentLogin] fail（无云环境或首次）', err.message || 'unknown')
      })
  },

  globalData: {
    userInfo: null,
    openid: null,
    systemInfo: null,
    statusBarHeight: 0,
    navBarHeight: 44,
    safeAreaBottom: 0
  }
})
```

---

### T9 · `miniprogram/pages/index/index.js` · 整文件替换

**完整文件内容**:

```js
const CoachService = require('../../services/coach')
const { getMyInfo, checkLogin } = require('../../utils/auth')
var mock = require('../../common/mock-data')

Page({
  data: {
    userInfo: null,
    recommendCoaches: [],
    loading: true,
    __routeLeft: false
  },

  onShow() {
    if (checkLogin()) {
      getMyInfo().catch(() => {})
    }
    this.loadRecommendCoaches()
    this.checkRoleGuide()
    this.maybePromptLogin()
  },

  onHide() {
    this.setData({ __routeLeft: true })
  },

  onPullDownRefresh() {
    this.loadRecommendCoaches()
      .finally(() => wx.stopPullDownRefresh())
  },

  loadRecommendCoaches() {
    return CoachService.getList({ page: 1, pageSize: 3, sortBy: 'rating' })
      .then((res) => { this.setData({ recommendCoaches: res.list, loading: false }) })
      .catch(() => { this.setData({ recommendCoaches: mock.mockCoaches.slice(0, 3), loading: false }) })
  },

  checkRoleGuide() {
    if (wx.getStorageSync('role_guide_shown')) return

    CoachService.getMyCoachStatus().then(res => {
      wx.setStorageSync('role_guide_shown', true)
      if (!res.has_apply) {
        wx.navigateTo({ url: '/pages/user/select-role/index' })
      } else if (res.coach.status === 'pending') {
        wx.showToast({ title: '教练认证审核中...', icon: 'none' })
      } else if (res.coach.status === 'suspended') {
        wx.showModal({
          title: '教练认证状态',
          content: `您的教练认证已被${res.coach.reject_reason ? '驳回：' + res.coach.reject_reason : '停用'}。`,
          confirmText: '重新申请',
          success: ({ confirm }) => {
            if (confirm) wx.navigateTo({ url: '/pages/user/coach-apply/index?mode=edit' })
          }
        })
      }
    }).catch(() => {
      if (!wx.getStorageSync('role_guide_shown')) {
        wx.setStorageSync('role_guide_shown', true)
      }
    })
  },

  maybePromptLogin() {
    if (checkLogin()) return
    if (wx.getStorageSync('login_prompt_shown')) return

    setTimeout(() => {
      if (this.data.__routeLeft) return
      wx.setStorageSync('login_prompt_shown', true)
      wx.showModal({
        title: '登录提示',
        content: '登录后可同步数据、约教练、发评价，是否立即登录？',
        confirmText: '立即登录',
        cancelText: '稍后再说',
        success: ({ confirm }) => {
          if (confirm) wx.navigateTo({ url: '/pages/user/login/index' })
        }
      })
    }, 1500)
  },

  goCoachList() { wx.navigateTo({ url: '/pages/coach/list/index' }) },
  goActivity() { wx.navigateTo({ url: '/pages/activity/list/index' }) },
  goTennisCircle() { wx.switchTab({ url: '/pages/tennis-circle/index' }) },
  goMatch() { wx.showToast({ title: '即将开放', icon: 'none' }) },

  goCoachDetail(e) {
    wx.navigateTo({ url: `/pages/coach/detail/index?id=${e.currentTarget.dataset.id}` })
  }
})
```

---

## Part 2 · 约教练模块（来自 vibe-01）

### T10 · `miniprogram/pages/user/select-role/index.js` · 整文件替换

**完整文件内容**:

```js
Page({
  data: {
    userInfo: null
  },

  onLoad() {
    const app = getApp()
    this.setData({ userInfo: app.globalData.userInfo })
  },

  // 选择"我是学员"—— 直接回到首页（role 默认已是 ['user']）
  selectStudent() {
    wx.switchTab({ url: '/pages/index/index' })
  },

  // 选择"我是教练"—— 跳转申请页
  selectCoach() {
    wx.navigateTo({ url: '/pages/user/coach-apply/index' })
  }
})
```

**文件** `miniprogram/pages/user/select-role/index.wxml` · 整文件替换:

```xml
<view class="select-role-page page-container">
  <view class="select-role-header">
    <image class="logo" src="/common/images/logo.png" mode="aspectFit" />
    <text class="app-name">TennisVibe</text>
    <text class="welcome">请选择您的身份</text>
  </view>

  <view class="role-cards">
    <view class="role-card card" bindtap="selectStudent">
      <view class="role-icon">🎾</view>
      <view class="role-title">我是学员</view>
      <view class="role-subtitle">开始约教练</view>
    </view>

    <view class="role-card card" bindtap="selectCoach">
      <view class="role-icon">🏆</view>
      <view class="role-title">我是教练</view>
      <view class="role-subtitle">创建教练主页</view>
    </view>
  </view>
</view>
```

**文件** `miniprogram/pages/user/select-role/index.wxss` · 整文件替换:

```css
.select-role-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx var(--space-4) var(--space-6);
}

.select-role-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 80rpx;
}
.logo { width: 120rpx; height: 120rpx; margin-bottom: 24rpx; }
.app-name { font-size: 36rpx; font-weight: 600; color: var(--text-primary); margin-bottom: 12rpx; }
.welcome { font-size: 28rpx; color: var(--text-secondary); }

.role-cards { width: 100%; display: flex; flex-direction: column; gap: 32rpx; }
.role-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64rpx var(--space-5);
  border-radius: 16rpx;
  background-color: var(--bg-primary);
  box-shadow: var(--shadow-card);
}
.role-icon { font-size: 96rpx; margin-bottom: 24rpx; }
.role-title { font-size: 32rpx; font-weight: 600; color: var(--text-primary); margin-bottom: 8rpx; }
.role-subtitle { font-size: 24rpx; color: var(--text-secondary); }
```

**文件** `miniprogram/pages/user/select-role/index.json` · 整文件替换:

```json
{
  "navigationBarTitleText": "选择身份",
  "usingComponents": {}
}
```

---

### T11 · 教练申请页（4 个新文件）

**新文件** `miniprogram/pages/user/coach-apply/index.js`:

```js
const CoachService = require('../../../services/coach')
const { getProfile } = require('../../../utils/auth')

const PRESET_TAGS = ['青少年', '成人', '初学者', '进阶', '双打', '体能', '备战比赛']

Page({
  data: {
    form: {
      real_name: '',
      phone: '',
      specialties: [],
      teaching_years: 0,
      hourly_rate: '',
      trial_rate: '',
      bio: '',
      certification_labels: [],
      certifications: [],
      photos: [],
      service_areas: []
    },
    presetTags: PRESET_TAGS,
    submitting: false,
    agreed: false,
    errors: {},
    editMode: false
  },

  onLoad(options) {
    if (options.mode === 'edit') {
      this.setData({ editMode: true })
      this.loadExisting()
    } else {
      this.prefillFromUser()
    }
  },

  prefillFromUser() {
    getProfile().then(u => {
      this.setData({
        'form.real_name': u.nickname || '',
        'form.phone': u.phone || ''
      })
    }).catch(() => {})
  },

  loadExisting() {
    // 调 getMyCoachStatus 拉已有数据
    CoachService.getMyCoachStatus().then(res => {
      if (res.has_apply) {
        const c = res.coach
        this.setData({
          form: {
            real_name: c.real_name || '',
            phone: c.phone || '',
            specialties: c.specialties || [],
            teaching_years: c.teaching_years || 0,
            hourly_rate: c.hourly_rate ? (c.hourly_rate / 100).toString() : '',
            trial_rate: c.trial_rate ? (c.trial_rate / 100).toString() : '',
            bio: c.bio || '',
            certification_labels: c.certification_labels || [],
            certifications: c.certifications || [],
            photos: c.photos || [],
            service_areas: c.service_areas || []
          }
        })
      }
    }).catch(() => {})
  },

  // === 校验 ===
  validate() {
    const errors = {}
    const { real_name, phone, specialties, teaching_years, hourly_rate } = this.data.form

    if (!real_name || real_name.length < 2 || real_name.length > 20) {
      errors.real_name = '请输入 2-20 位真实姓名'
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      errors.phone = '请输入正确的手机号'
    }
    if (!specialties.length) {
      errors.specialties = '至少选择一个特长标签'
    }
    if (teaching_years < 0 || teaching_years > 50) {
      errors.teaching_years = '教学年限 0-50 年'
    }
    if (!hourly_rate || hourly_rate <= 0 || hourly_rate > 10000) {
      errors.hourly_rate = '每小时费用 1-10000 元'
    }
    if (!this.data.agreed) {
      errors.agreed = '请先阅读并同意入驻协议'
    }

    this.setData({ errors })
    return Object.keys(errors).length === 0
  },

  // === 提交 ===
  onSubmit() {
    if (!this.validate()) return
    if (this.data.submitting) return

    this.setData({ submitting: true })
    wx.showLoading({ title: '提交中...', mask: true })

    const formData = {
      real_name: this.data.form.real_name,
      phone: this.data.form.phone,
      specialties: this.data.form.specialties,
      teaching_years: Number(this.data.form.teaching_years),
      hourly_rate: Math.round(Number(this.data.form.hourly_rate) * 100),
      trial_rate: Math.round(Number(this.data.form.trial_rate || 0) * 100),
      bio: this.data.form.bio,
      certification_labels: this.data.form.certification_labels,
      certifications: this.data.form.certifications,
      photos: this.data.form.photos,
      service_areas: this.data.form.service_areas
    }

    CoachService.apply(formData).then(res => {
      wx.hideLoading()
      if (res.code === 0 || res._id) {
        wx.showToast({ title: '提交成功', icon: 'success' })
        setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 1500)
      } else if (res.code === 2001) {
        wx.showModal({
          title: '提示',
          content: '您已提交过教练申请，请耐心等待审核',
          showCancel: false,
          success: () => wx.switchTab({ url: '/pages/index/index' })
        })
      } else {
        wx.showModal({ title: '提交失败', content: res.message || '请稍后重试', showCancel: false })
      }
    }).catch(() => {
      wx.hideLoading()
      wx.showModal({ title: '网络错误', content: '请检查网络后重试', showCancel: false })
    }).finally(() => {
      this.setData({ submitting: false })
    })
  },

  // === 图片上传 ===
  uploadPhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: (res) => {
        const tempPath = res.tempFiles[0].tempFilePath
        const cloudPath = `coach_photos/${Date.now()}_${Math.random().toString(36).substr(2)}.jpg`
        wx.showLoading({ title: '上传中...', mask: true })
        wx.cloud.uploadFile({
          cloudPath,
          filePath: tempPath,
          success: (uploadRes) => {
            const photos = [...this.data.form.photos, uploadRes.fileID]
            this.setData({ 'form.photos': photos })
          },
          fail: () => {
            wx.showToast({ title: '图片上传失败', icon: 'none' })
          },
          complete: () => { wx.hideLoading() }
        })
      }
    })
  },

  removePhoto(e) {
    const idx = e.currentTarget.dataset.index
    const photos = [...this.data.form.photos]
    photos.splice(idx, 1)
    this.setData({ 'form.photos': photos })
  },

  // === 标签 ===
  toggleTag(e) {
    const tag = e.currentTarget.dataset.tag
    const specialties = this.data.form.specialties
    if (specialties.includes(tag)) {
      this.setData({ 'form.specialties': specialties.filter(t => t !== tag) })
    } else {
      this.setData({ 'form.specialties': [...specialties, tag] })
    }
  },

  // === 表单输入 ===
  onInputName(e) { this.setData({ 'form.real_name': e.detail.value }) },
  onInputPhone(e) { this.setData({ 'form.phone': e.detail.value }) },
  onInputYears(e) { this.setData({ 'form.teaching_years': e.detail.value }) },
  onInputRate(e) { this.setData({ 'form.hourly_rate': e.detail.value }) },
  onInputTrial(e) { this.setData({ 'form.trial_rate': e.detail.value }) },
  onInputBio(e) { this.setData({ 'form.bio': e.detail.value }) },
  toggleAgree() { this.setData({ agreed: !this.data.agreed }) }
})
```

**新文件** `miniprogram/pages/user/coach-apply/index.wxml`:

```xml
<view class="coach-apply-page page-container">
  <view class="form-section card">
    <view class="section-title">必填信息</view>

    <view class="form-item">
      <text class="form-label">真实姓名 *</text>
      <input class="form-input" placeholder="请输入姓名" value="{{form.real_name}}" bindinput="onInputName" />
      <text wx:if="{{errors.real_name}}" class="form-error">{{errors.real_name}}</text>
    </view>

    <view class="form-item">
      <text class="form-label">手机号 *</text>
      <input class="form-input" type="number" maxlength="11" placeholder="请输入手机号" value="{{form.phone}}" bindinput="onInputPhone" />
      <text wx:if="{{errors.phone}}" class="form-error">{{errors.phone}}</text>
    </view>

    <view class="form-item">
      <text class="form-label">教学经验(年) *</text>
      <input class="form-input" type="number" placeholder="请输入年限" value="{{form.teaching_years}}" bindinput="onInputYears" />
      <text wx:if="{{errors.teaching_years}}" class="form-error">{{errors.teaching_years}}</text>
    </view>

    <view class="form-item">
      <text class="form-label">每小时费用(元) *</text>
      <input class="form-input" type="digit" placeholder="请输入价格" value="{{form.hourly_rate}}" bindinput="onInputRate" />
      <text wx:if="{{errors.hourly_rate}}" class="form-error">{{errors.hourly_rate}}</text>
    </view>

    <view class="form-item">
      <text class="form-label">特长标签 *</text>
      <view class="tag-list">
        <view
          wx:for="{{presetTags}}"
          wx:key="*this"
          class="tag {{form.specialties.indexOf(item) > -1 ? 'tag-active' : ''}}"
          data-tag="{{item}}"
          bindtap="toggleTag"
        >{{item}}</view>
      </view>
      <text wx:if="{{errors.specialties}}" class="form-error">{{errors.specialties}}</text>
    </view>
  </view>

  <view class="form-section card">
    <view class="section-title">选填信息</view>

    <view class="form-item">
      <text class="form-label">体验课价格(元)</text>
      <input class="form-input" type="digit" placeholder="请输入价格" value="{{form.trial_rate}}" bindinput="onInputTrial" />
    </view>

    <view class="form-item">
      <text class="form-label">个人简介</text>
      <textarea class="form-textarea" maxlength="500" placeholder="请输入个人简介" value="{{form.bio}}" bindinput="onInputBio" />
    </view>

    <view class="form-item">
      <text class="form-label">个人照片</text>
      <view class="photo-list">
        <view wx:for="{{form.photos}}" wx:key="*this" class="photo-item">
          <image class="photo-img" src="{{item}}" mode="aspectFill" />
          <view class="photo-remove" data-index="{{index}}" bindtap="removePhoto">×</view>
        </view>
        <view wx:if="{{form.photos.length < 9}}" class="photo-add" bindtap="uploadPhoto">+</view>
      </view>
    </view>
  </view>

  <view class="agreement">
    <view class="agreement-check {{agreed ? 'checked' : ''}}" bindtap="toggleAgree"></view>
    <text class="agreement-text">我已阅读并同意《教练入驻协议》和《隐私政策》</text>
  </view>
  <text wx:if="{{errors.agreed}}" class="form-error">{{errors.agreed}}</text>

  <view class="submit-wrap">
    <button class="btn btn-primary btn-block" bindtap="onSubmit" disabled="{{submitting}}">提交申请</button>
  </view>
</view>
```

**新文件** `miniprogram/pages/user/coach-apply/index.wxss`:

```css
.coach-apply-page { padding-bottom: 200rpx; }
.form-section { margin-bottom: var(--space-4); padding: var(--space-5); }
.section-title { font-size: 30rpx; font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-4); }
.form-item { margin-bottom: var(--space-4); }
.form-item:last-child { margin-bottom: 0; }
.form-label { display: block; font-size: 28rpx; color: var(--text-secondary); margin-bottom: 12rpx; }
.form-input { width: 100%; height: 80rpx; padding: 0 16rpx; background-color: var(--bg-secondary); border-radius: 8rpx; font-size: 28rpx; }
.form-textarea { width: 100%; height: 160rpx; padding: 16rpx; background-color: var(--bg-secondary); border-radius: 8rpx; font-size: 28rpx; }
.form-error { display: block; font-size: 24rpx; color: #EF4444; margin-top: 8rpx; }

.tag-list { display: flex; flex-wrap: wrap; gap: 16rpx; }
.tag { padding: 8rpx 24rpx; background-color: var(--bg-secondary); border-radius: 24rpx; font-size: 26rpx; color: var(--text-secondary); }
.tag-active { background-color: var(--accent); color: var(--accent-contrast); }

.photo-list { display: flex; flex-wrap: wrap; gap: 16rpx; }
.photo-item { position: relative; width: 160rpx; height: 160rpx; }
.photo-img { width: 100%; height: 100%; border-radius: 8rpx; }
.photo-remove { position: absolute; top: -10rpx; right: -10rpx; width: 36rpx; height: 36rpx; background: rgba(0,0,0,0.6); color: #fff; border-radius: 50%; text-align: center; line-height: 36rpx; font-size: 28rpx; }
.photo-add { width: 160rpx; height: 160rpx; background-color: var(--bg-secondary); border-radius: 8rpx; display: flex; align-items: center; justify-content: center; font-size: 60rpx; color: var(--text-tertiary); }

.agreement { display: flex; align-items: center; padding: 0 var(--space-5); margin-top: var(--space-4); }
.agreement-check { width: 36rpx; height: 36rpx; border: 2rpx solid var(--border); border-radius: 4rpx; margin-right: 12rpx; }
.agreement-check.checked { background-color: var(--accent); border-color: var(--accent); }
.agreement-text { font-size: 24rpx; color: var(--text-secondary); }

.submit-wrap { position: fixed; left: 0; right: 0; bottom: 0; padding: var(--space-4); background-color: var(--bg-primary); border-top: 1rpx solid var(--border-light); padding-bottom: calc(var(--space-4) + env(safe-area-inset-bottom)); }
```

**新文件** `miniprogram/pages/user/coach-apply/index.json`:

```json
{
  "navigationBarTitleText": "教练认证申请",
  "usingComponents": {}
}
```

---

### T12 · `cloudfunctions/coach/actions/applyCoach.js` · 整文件替换

```js
/**
 * 申请成为教练
 */
module.exports = async function applyCoach(db, openid, event) {
  const {
    real_name, phone, specialties, certifications, certification_labels,
    teaching_years, hourly_rate, trial_rate, bio, photos,
    service_areas, venue_ids
  } = event

  if (!real_name) return { code: 9002, message: '请输入真实姓名' }
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) return { code: 9002, message: '请输入正确的手机号' }
  if (!specialties || specialties.length === 0) return { code: 9002, message: '请至少选择一个特长标签' }
  if (teaching_years < 0 || teaching_years > 50) return { code: 9002, message: '教学年限 0-50' }
  if (!hourly_rate || hourly_rate <= 0) return { code: 9002, message: '请输入有效的每小时费用' }

  // 查询当前用户 city
  const { data: users } = await db.collection('users').where({ _openid: openid }).limit(1).get()
  const userCity = users.length > 0 ? users[0].city : ''

  // 检查是否已有教练资料
  const { data: existing } = await db.collection('coaches')
    .where({ user_id: openid })
    .limit(1)
    .get()

  if (existing.length > 0 && existing[0].status !== 'suspended') {
    return { code: 2001, message: '您已提交过教练申请' }
  }

  const now = new Date()
  const coachData = {
    user_id: openid,
    real_name,
    phone,
    city: userCity,
    specialties: specialties || [],
    certifications: certifications || [],
    certification_labels: certification_labels || [],
    teaching_years: teaching_years || 0,
    hourly_rate: hourly_rate || 0,
    trial_rate: trial_rate || 0,
    bio: bio || '',
    photos: photos || [],
    service_areas: service_areas || [],
    venue_ids: venue_ids || [],
    rating: 0,
    review_count: 0,
    total_students: 0,
    status: 'pending',
    created_at: now,
    updated_at: now
  }

  let coachId
  if (existing.length > 0) {
    await db.collection('coaches').doc(existing[0]._id).update({
      data: { ...coachData, status: 'pending', updated_at: now }
    })
    coachId = existing[0]._id
  } else {
    const { _id } = await db.collection('coaches').add({ data: coachData })
    coachId = _id
  }

  // 写角色
  await db.collection('users').where({ _openid: openid }).update({
    data: { role: db.command.addToSet('coach'), updated_at: now }
  })

  return { code: 0, data: { _id: coachId } }
}
```

---

### T13 · `cloudfunctions/coach/actions/approve.js` · 新建

```js
/**
 * 管理员审核通过
 */
module.exports = async function approve(db, openid, event) {
  const { coachId } = event

  // 权限校验
  const { data: users } = await db.collection('users').where({ _openid: openid }).get()
  if (!users[0] || !users[0].role || !users[0].role.includes('admin')) {
    return { code: 5001, message: '无权限' }
  }

  // 更新状态
  await db.collection('coaches').doc(coachId).update({
    data: { status: 'active', updated_at: new Date() }
  })

  // 确认用户角色
  const coach = (await db.collection('coaches').doc(coachId).get()).data
  await db.collection('users').where({ _openid: coach.user_id }).update({
    data: { role: db.command.addToSet('coach'), updated_at: new Date() }
  })

  // 发通知
  await db.collection('notifications').add({
    data: {
      user_id: coach.user_id,
      type: 'coach_audit_result',
      title: '教练认证已通过',
      content: '恭喜！您的教练认证已审核通过，现在学员可以在教练列表中看到您了。',
      extra: { coachId, status: 'active' },
      is_read: false,
      created_at: new Date()
    }
  })

  return { code: 0 }
}
```

---

### T14 · `cloudfunctions/coach/actions/reject.js` · 新建

```js
/**
 * 管理员驳回
 */
module.exports = async function reject(db, openid, event) {
  const { coachId, reason } = event

  // 权限校验
  const { data: users } = await db.collection('users').where({ _openid: openid }).get()
  if (!users[0] || !users[0].role || !users[0].role.includes('admin')) {
    return { code: 5001, message: '无权限' }
  }

  if (!reason) {
    return { code: 9002, message: '请填写驳回原因' }
  }

  await db.collection('coaches').doc(coachId).update({
    data: {
      status: 'suspended',
      reject_reason: reason,
      updated_at: new Date()
    }
  })

  const coach = (await db.collection('coaches').doc(coachId).get()).data
  await db.collection('notifications').add({
    data: {
      user_id: coach.user_id,
      type: 'coach_audit_result',
      title: '教练认证未通过',
      content: `您的教练认证未通过审核，原因：${reason}`,
      extra: { coachId, status: 'suspended', reason },
      is_read: false,
      created_at: new Date()
    }
  })

  return { code: 0 }
}
```

---

### T15 · `cloudfunctions/coach/actions/getMyStatus.js` · 新建

```js
/**
 * 获取当前用户的教练认证状态
 */
module.exports = async function getMyStatus(db, openid) {
  const { data } = await db.collection('coaches')
    .where({ user_id: openid })
    .limit(1)
    .get()

  if (data.length === 0) {
    return { code: 0, data: { has_apply: false } }
  }

  return {
    code: 0,
    data: {
      has_apply: true,
      coach: data[0]
    }
  }
}
```

---

### T16 · `cloudfunctions/coach/index.js` · 整文件替换

```js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const list = require('./actions/list')
const detail = require('./actions/detail')
const search = require('./actions/search')
const applyCoach = require('./actions/applyCoach')
const approve = require('./actions/approve')
const reject = require('./actions/reject')
const getMyStatus = require('./actions/getMyStatus')

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const db = cloud.database()

  try {
    switch (event.action) {
      case 'list':         return await list(db, event)
      case 'detail':       return await detail(db, event)
      case 'search':       return await search(db, event)
      case 'applyCoach':   return await applyCoach(db, OPENID, event)
      case 'getMyStatus':  return await getMyStatus(db, OPENID)
      case 'approve':      return await approve(db, OPENID, event)
      case 'reject':       return await reject(db, OPENID, event)
      default:             return { code: 9001, message: '未知操作' }
    }
  } catch (err) {
    console.error(`[coach:${event.action}]`, err)
    return { code: 9999, message: err.message || '服务器错误' }
  }
}
```

---

## Part 3 · 个人中心+登录（来自 vibe-02）

### T17 · 隐私政策页（4 个新文件）

**新文件** `miniprogram/pages/user/privacy/index.js`:

```js
Page({ data: {} })
```

**新文件** `miniprogram/pages/user/privacy/index.wxml`:

```xml
<view class="rich-text-page page-container">
  <view class="content">
    <view class="content-title">隐私政策</view>
    <view class="content-section">
      <view class="section-heading">一、信息收集</view>
      <view class="section-body">本小程序仅收集您在注册、使用过程中主动提供的信息，包括：微信头像、昵称、手机号码、网球水平、所在城市等。未经您明确同意，我们不会收集其他个人信息。</view>
    </view>
    <view class="content-section">
      <view class="section-heading">二、信息使用</view>
      <view class="section-body">收集的信息用于：为您提供预约教练、参与活动、评价服务等功能。我们不会将您的个人信息出售、交易或转让给第三方。</view>
    </view>
    <view class="content-section">
      <view class="section-heading">三、信息存储</view>
      <view class="section-body">您的信息存储在微信云开发（CloudBase）平台，采用行业标准的安全措施保护您的数据。</view>
    </view>
    <view class="content-section">
      <view class="section-heading">四、您的权利</view>
      <view class="section-body">您可以在个人中心编辑或删除您的基本信息。如需彻底注销账号，请联系客服。</view>
    </view>
    <view class="content-section">
      <view class="section-heading">五、联系我们</view>
      <view class="section-body">如有隐私相关问题，请在设置页的"意见反馈"中联系我们。</view>
    </view>
  </view>
</view>
```

**新文件** `miniprogram/pages/user/privacy/index.wxss`:

```css
.rich-text-page { padding: var(--space-5); }
.content-title { font-size: 40rpx; font-weight: 700; color: var(--text-primary); text-align: center; margin-bottom: var(--space-6); }
.content-section { margin-bottom: var(--space-6); }
.section-heading { font-size: 30rpx; font-weight: 600; color: var(--text-primary); margin-bottom: 16rpx; }
.section-body { font-size: 28rpx; color: var(--text-secondary); line-height: 1.8; }
```

**新文件** `miniprogram/pages/user/privacy/index.json`:

```json
{
  "navigationBarTitleText": "隐私政策",
  "usingComponents": {}
}
```

---

### T18 · 用户协议页（4 个新文件）

**新文件** `miniprogram/pages/user/agreement/index.js`:

```js
Page({ data: {} })
```

**新文件** `miniprogram/pages/user/agreement/index.wxml`:

```xml
<view class="rich-text-page page-container">
  <view class="content">
    <view class="content-title">用户协议</view>
    <view class="content-section">
      <view class="section-heading">一、服务说明</view>
      <view class="section-body">TennisVibe 网球生态小程序致力于为用户提供便捷的网球教练预约、场地查询、球友社交等服务。</view>
    </view>
    <view class="content-section">
      <view class="section-heading">二、用户义务</view>
      <view class="section-body">您承诺所提供的个人信息真实有效，不发布违法、违规或侵犯他人权益的内容。</view>
    </view>
    <view class="content-section">
      <view class="section-heading">三、平台权利</view>
      <view class="section-body">平台有权审核用户提交的信息，并对违规行为采取警告、限制或封禁措施。</view>
    </view>
    <view class="content-section">
      <view class="section-heading">四、免责声明</view>
      <view class="section-body">平台作为信息中介，不对教练与学员之间的实际服务质量和交易纠纷承担责任，但会积极配合协商解决。</view>
    </view>
    <view class="content-section">
      <view class="section-heading">五、协议修改</view>
      <view class="section-body">我们可能根据需要更新本协议，更新后的协议将在小程序内公布。</view>
    </view>
  </view>
</view>
```

**新文件** `miniprogram/pages/user/agreement/index.wxss`:

```css
.rich-text-page { padding: var(--space-5); }
.content-title { font-size: 40rpx; font-weight: 700; color: var(--text-primary); text-align: center; margin-bottom: var(--space-6); }
.content-section { margin-bottom: var(--space-6); }
.section-heading { font-size: 30rpx; font-weight: 600; color: var(--text-primary); margin-bottom: 16rpx; }
.section-body { font-size: 28rpx; color: var(--text-secondary); line-height: 1.8; }
```

**新文件** `miniprogram/pages/user/agreement/index.json`:

```json
{
  "navigationBarTitleText": "用户协议",
  "usingComponents": {}
}
```

---

### T19 · 设置页（修改）

**文件** `miniprogram/pages/user/settings/index.js` · 整文件替换:

```js
Page({
  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '退出后需重新登录',
      success: (res) => {
        if (res.confirm) {
          const { logout } = require('../../utils/auth')
          logout()
          wx.showToast({ title: '已退出', icon: 'success' })
          setTimeout(() => wx.switchTab({ url: '/pages/user/profile/index' }), 800)
        }
      }
    })
  },

  onClearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '将清除本地缓存数据，是否继续？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync()
          wx.showToast({ title: '已清除', icon: 'success' })
        }
      }
    })
  },

  goPrivacy() { wx.navigateTo({ url: '/pages/user/privacy/index' }) },
  goAgreement() { wx.navigateTo({ url: '/pages/user/agreement/index' }) }
})
```

**文件** `miniprogram/pages/user/settings/index.wxml` · 整文件替换:

```xml
<view class="settings-page page-container">
  <view class="settings-list card">
    <view class="settings-item">
      <text class="settings-label">关于 TennisVibe</text>
      <text class="settings-value">v1.0.0</text>
    </view>
    <view class="settings-item" bindtap="goAgreement">
      <text class="settings-label">用户协议</text>
      <text class="settings-arrow">></text>
    </view>
    <view class="settings-item" bindtap="goPrivacy">
      <text class="settings-label">隐私政策</text>
      <text class="settings-arrow">></text>
    </view>
    <view class="settings-item" bindtap="onClearCache">
      <text class="settings-label">清除缓存</text>
      <text class="settings-arrow">></text>
    </view>
  </view>

  <view class="logout-wrap">
    <button class="btn btn-danger btn-block" bindtap="onLogout">退出登录</button>
  </view>
</view>
```

---

### T20 · 登录页（修改）

**文件** `miniprogram/pages/user/login/index.wxml` · 整文件替换:

```xml
<view class="login-page">
  <view class="login-header">
    <image class="logo" src="/common/images/logo.png" mode="aspectFit" />
    <text class="app-name">TennisVibe</text>
    <text class="app-subtitle">你的全方位网球生态</text>
  </view>

  <view class="login-body">
    <button class="btn btn-primary btn-block" bindtap="onLogin">微信一键登录</button>
  </view>

  <view class="login-footer">
    <text class="agreement">
      登录即表示同意
      <text class="link" bindtap="goAgreement">《用户协议》</text>
      和
      <text class="link" bindtap="goPrivacy">《隐私政策》</text>
    </text>
  </view>
</view>
```

**文件** `miniprogram/pages/user/login/index.js` · 整文件替换:

```js
const UserService = require('../../services/user')

Page({
  data: { logging: false },

  onLogin() {
    if (this.data.logging) return
    this.setData({ logging: true })

    UserService.login()
      .then(() => {
        wx.showToast({ title: '登录成功', icon: 'success' })
        setTimeout(() => wx.switchTab({ url: '/pages/user/profile/index' }), 1000)
      })
      .catch((err) => {
        wx.showToast({ title: err.message || '登录失败', icon: 'none' })
      })
      .finally(() => {
        this.setData({ logging: false })
      })
  },

  goPrivacy() { wx.navigateTo({ url: '/pages/user/privacy/index' }) },
  goAgreement() { wx.navigateTo({ url: '/pages/user/agreement/index' }) }
})
```

---

### T21 · 编辑资料页（修改）

**文件** `miniprogram/pages/user/edit-profile/index.js` · 整文件替换:

```js
const UserService = require('../../services/user')
const { validateForm } = require('../../utils/validator')
const { TENNIS_LEVELS, GENDER_OPTIONS } = require('../../common/constants/user')

Page({
  data: {
    form: { nickname: '', gender: 0, phone: '', tennis_level: '', bio: '' },
    tennisLevels: TENNIS_LEVELS,
    genderOptions: GENDER_OPTIONS,
    genderIndex: 0,
    levelIndex: -1,
    avatarUrl: '',
    submitting: false
  },

  onLoad() { this.loadProfile() },

  loadProfile() {
    UserService.getProfile().then((data) => {
      const genderIdx = GENDER_OPTIONS.findIndex((g) => g.value === data.gender)
      const levelIdx = TENNIS_LEVELS.findIndex((l) => l.value === data.tennis_level)
      this.setData({
        form: {
          nickname: data.nickname || '',
          gender: data.gender || 0,
          phone: data.phone || '',
          tennis_level: data.tennis_level || '',
          bio: data.bio || ''
        },
        avatarUrl: data.avatar_url || '',
        genderIndex: genderIdx >= 0 ? genderIdx : 0,
        levelIndex: levelIdx
      })
    }).catch(() => {})
  },

  onChooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: (res) => {
        const tempPath = res.tempFiles[0].tempFilePath
        this.setData({ avatarUrl: tempPath })
        const cloudPath = `avatars/${Date.now()}-${Math.random().toString(36).substr(2, 8)}.jpg`
        wx.showLoading({ title: '上传中...', mask: true })
        wx.cloud.uploadFile({
          cloudPath,
          filePath: tempPath,
          success: (uploadRes) => {
            this.setData({ 'form.avatar_url': uploadRes.fileID })
          },
          fail: () => {
            wx.showToast({ title: '头像上传失败，请重试', icon: 'none' })
          },
          complete: () => { wx.hideLoading() }
        })
      }
    })
  },

  onInputNickname(e) { this.setData({ 'form.nickname': e.detail.value }) },
  onGenderChange(e) {
    const idx = Number(e.detail.value)
    this.setData({ genderIndex: idx, 'form.gender': GENDER_OPTIONS[idx].value })
  },
  onInputPhone(e) { this.setData({ 'form.phone': e.detail.value }) },
  onLevelChange(e) {
    const idx = Number(e.detail.value)
    this.setData({ levelIndex: idx, 'form.tennis_level': TENNIS_LEVELS[idx].value })
  },
  onInputBio(e) { this.setData({ 'form.bio': e.detail.value }) },

  onSubmit() {
    const error = validateForm([
      { field: 'nickname', rules: [{ type: 'required', message: '昵称' }] },
      { field: 'phone', rules: [{ type: 'phone', message: '手机号格式不正确' }] }
    ], this.data.form)

    if (error) {
      wx.showToast({ title: error, icon: 'none' })
      return
    }

    this.setData({ submitting: true })
    UserService.updateProfile(this.data.form)
      .then(() => {
        wx.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 1000)
      })
      .catch((err) => {
        wx.showToast({ title: err.message || '保存失败', icon: 'none' })
      })
      .finally(() => { this.setData({ submitting: false }) })
  }
})
```

---

### T22 · `cloudfunctions/review/actions/myList.js` · 新建

```js
/**
 * 获取当前用户发表的所有评价
 */
module.exports = async function myList(db, openid, event) {
  const { page = 1, pageSize = 10 } = event
  const _ = db.command

  const condition = {
    created_by: openid,
    status: _.neq('hidden')
  }

  const { total } = await db.collection('reviews').where(condition).count()

  const skip = (page - 1) * pageSize
  const { data: reviews } = await db.collection('reviews')
    .where(condition)
    .orderBy('created_at', 'desc')
    .skip(skip)
    .limit(pageSize)
    .get()

  const orderIds = [...new Set(reviews.map(r => r.order_id).filter(Boolean))]
  let ordersMap = {}
  if (orderIds.length > 0) {
    const { data: orders } = await db.collection('orders')
      .where({ _id: _.in(orderIds) })
      .get()
    orders.forEach(o => { ordersMap[o._id] = o })
  }

  const list = reviews.map(r => ({
    ...r,
    order_snapshot: ordersMap[r.order_id]
      ? {
          order_type: ordersMap[r.order_id].order_type,
          date: ordersMap[r.order_id].date,
          resource_snapshot: ordersMap[r.order_id].resource_snapshot
        }
      : null
  }))

  return { code: 0, data: { list, total, page, pageSize } }
}
```

---

### T23 · `cloudfunctions/review/index.js` · 整文件替换

```js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const create = require('./actions/create')
const list = require('./actions/list')
const getStats = require('./actions/getStats')
const myList = require('./actions/myList')

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const db = cloud.database()
  try {
    switch (event.action) {
      case 'create':   return await create(db, OPENID, event)
      case 'list':     return await list(db, event)
      case 'getStats': return await getStats(db, event)
      case 'myList':   return await myList(db, OPENID, event)
      default:         return { code: 9001, message: '未知操作' }
    }
  } catch (err) {
    console.error(`[review:${event.action}]`, err)
    return { code: 9999, message: err.message || '服务器错误' }
  }
}
```

---

### T24 · `miniprogram/services/review.js` · 整文件替换

```js
const { get, post } = require('../utils/request')

module.exports = {
  create(data) { return post('review', 'create', data, '提交中...') },
  getList(params) { return get('review', 'list', params, { showError: false }) },
  getStats(targetType, targetId) { return get('review', 'getStats', { targetType, targetId }, { showError: false }) },
  getMyList(params) { return get('review', 'myList', params, { showError: false }) }
}
```

---

### T25 · `miniprogram/pages/review/list/index.js` · 整文件替换

```js
const ReviewService = require('../../services/review')

Page({
  data: {
    isMine: false,
    targetType: '',
    targetId: '',
    stats: null,
    list: [],
    page: 1,
    pageSize: 10,
    total: 0,
    loading: false,
    hasMore: true,
    sortBy: 'newest'
  },

  onLoad(options) {
    if (options.from === 'mine') {
      this.setData({ isMine: true })
      wx.setNavigationBarTitle({ title: '我的评价' })
      this.loadMyData(true)
    } else {
      this.setData({ targetType: options.targetType, targetId: options.targetId })
      this.loadStats()
      this.loadData(true)
    }
  },

  loadStats() {
    ReviewService.getStats(this.data.targetType, this.data.targetId).then((data) => {
      this.setData({ stats: data })
    }).catch(() => {})
  },

  onSortChange(e) {
    this.setData({ sortBy: e.currentTarget.dataset.sort })
    if (this.data.isMine) this.loadMyData(true)
    else this.loadData(true)
  },

  loadData(reset) {
    if (this.data.loading) return Promise.resolve()
    const page = reset ? 1 : this.data.page
    this.setData({ loading: true })
    if (reset) this.setData({ list: [], hasMore: true })

    return ReviewService.getList({
      targetType: this.data.targetType,
      targetId: this.data.targetId,
      page, pageSize: this.data.pageSize,
      sortBy: this.data.sortBy
    }).then((res) => {
      const newList = reset ? res.list : [...this.data.list, ...res.list]
      this.setData({ list: newList, total: res.total, page: page + 1, hasMore: newList.length < res.total })
    }).catch(() => {}).finally(() => { this.setData({ loading: false }) })
  },

  loadMyData(reset) {
    if (this.data.loading) return Promise.resolve()
    const page = reset ? 1 : this.data.page
    this.setData({ loading: true })
    if (reset) this.setData({ list: [], hasMore: true })

    return ReviewService.getMyList({ page, pageSize: this.data.pageSize })
      .then((res) => {
        const newList = reset ? res.list : [...this.data.list, ...res.list]
        this.setData({ list: newList, total: res.total, page: page + 1, hasMore: newList.length < res.total })
      })
      .catch(() => {})
      .finally(() => { this.setData({ loading: false }) })
  },

  onReachBottom() {
    if (!this.data.hasMore || this.data.loading) return
    if (this.data.isMine) this.loadMyData(false)
    else this.loadData(false)
  },

  previewImage(e) {
    const { src, urls } = e.currentTarget.dataset
    wx.previewImage({ current: src, urls })
  }
})
```

---

## Part 4 · app.json 一次性注册所有新页面

### T26 · `miniprogram/app.json` · 整文件替换

```json
{
  "pages": [
    "pages/index/index",
    "pages/coach/list/index",
    "pages/coach/detail/index",
    "pages/coach/book/index",
    "pages/activity/list/index",
    "pages/activity/detail/index",
    "pages/activity/create/index",
    "pages/order/list/index",
    "pages/order/detail/index",
    "pages/review/create/index",
    "pages/review/list/index",
    "pages/user/login/index",
    "pages/user/profile/index",
    "pages/user/edit-profile/index",
    "pages/user/settings/index",
    "pages/user/select-role/index",
    "pages/user/coach-apply/index",
    "pages/user/privacy/index",
    "pages/user/agreement/index",
    "pages/tennis-circle/index"
  ],
  "window": {
    "navigationBarBackgroundColor": "#FFFFFF",
    "navigationBarTitleText": "TennisVibe",
    "navigationBarTextStyle": "black",
    "backgroundColor": "#F5F5F5",
    "backgroundTextStyle": "dark"
  },
  "tabBar": {
    "color": "#999999",
    "selectedColor": "#B8E600",
    "backgroundColor": "#FFFFFF",
    "borderStyle": "white",
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "首页",
        "iconPath": "common/images/tab-home.png",
        "selectedIconPath": "common/images/tab-home-active.png"
      },
      {
        "pagePath": "pages/tennis-circle/index",
        "text": "网球圈",
        "iconPath": "common/images/tab-circle.png",
        "selectedIconPath": "common/images/tab-circle-active.png"
      },
      {
        "pagePath": "pages/user/profile/index",
        "text": "我的",
        "iconPath": "common/images/tab-user.png",
        "selectedIconPath": "common/images/tab-user-active.png"
      }
    ]
  },
  "sitemapLocation": "sitemap.json",
  "lazyCodeLoading": "requiredComponents",
  "cloud": true
}
```

**说明**: T26 把 vibe-01 需要注册的 `select-role`、`coach-apply` 和 vibe-02 需要注册的 `privacy`、`agreement` 四个新页面**一次性全部注册**。

---

## Part 5 · 云函数部署

完成 T13-T16、T22-T23 之后，**所有云函数都要重新部署**：

```bash
# 在 cloudfunctions 目录
cd cloudfunctions/coach && npm install && cd ../..
cd cloudfunctions/review && npm install && cd ../..

# 用微信开发者工具"云开发"面板上传部署：
# - coach
# - review
```

---

## 验收清单（共 22 条 AC）

| 编号 | 验证项 | 预期 |
|---|---|---|
| AC1 | 首次安装打开 App | 无红色 toast 弹窗 |
| AC2 | 首页停留 1.5s | 弹出"是否立即登录"Modal |
| AC3 | Modal 点"稍后再说" | 关闭，正常浏览 |
| AC4 | Modal 点"立即登录" | 跳转登录页 |
| AC5 | 不点"我的" tab | 整个 App 不弹"网络异常"toast |
| AC6 | 点击"我的"（未登录） | 0.1s 内看到 empty-state "立即登录" |
| AC7 | 登录后点击"我的" | 立即看到骨架屏，1s 后变成真实数据 |
| AC8 | 拔网线模拟 | UI 安静退化，无错误 toast |
| AC9 | 第二次进入首页 | Modal 不再弹出（已记录） |
| AC10 | 登录页底部"《用户协议》" | 跳转用户协议页 |
| AC11 | 登录页底部"《隐私政策》" | 跳转隐私政策页 |
| AC12 | 设置页"用户协议" | 跳转用户协议页 |
| AC13 | 设置页"隐私政策" | 跳转隐私政策页 |
| AC14 | 编辑资料手机号填"abc" | 提示"手机号格式不正确" |
| AC15 | 编辑资料头像上传失败 | 提示"上传失败" |
| AC16 | 未登录用户进入"选择身份"点"我是教练" | 跳转到教练申请页 |
| AC17 | 教练申请必填项缺一个 | 红色错误提示，不外发请求 |
| AC18 | 教练申请提交中再点 | 按钮禁用，不触发第二次 |
| AC19 | 申请成功 | 1.5s 后跳回首页，role 含 'coach' |
| AC20 | profile 页"我的评价" | 跳转到评价列表（标题"我的评价"） |
| AC21 | profile 页有未读通知 | 显示红点数字 |
| AC22 | 关闭云环境 | UI 安静退化，无错误 toast |

---

## 文件改动总表

| 任务 | 文件路径 | 操作 |
|---|---|---|
| T1 | `miniprogram/utils/request.js` | 修改 1 行 |
| T2 | `miniprogram/services/coach.js` | 整文件替换 |
| T3 | `miniprogram/services/notification.js` | 整文件替换 |
| T4 | `miniprogram/services/user.js` | 整文件替换 |
| T5 | `miniprogram/pages/user/profile/index.wxml` | 整文件替换 |
| T6 | `miniprogram/pages/user/profile/index.wxss` | 末尾追加 |
| T7 | `miniprogram/pages/user/profile/index.js` | 整文件替换 |
| T8 | `miniprogram/app.js` | 整文件替换 |
| T9 | `miniprogram/pages/index/index.js` | 整文件替换 |
| T10 | `miniprogram/pages/user/select-role/index.{js,wxml,wxss,json}` | 4 个文件全部整文件替换 |
| T11 | `miniprogram/pages/user/coach-apply/index.{js,wxml,wxss,json}` | 4 个新文件 |
| T12 | `cloudfunctions/coach/actions/applyCoach.js` | 整文件替换 |
| T13 | `cloudfunctions/coach/actions/approve.js` | 新建 |
| T14 | `cloudfunctions/coach/actions/reject.js` | 新建 |
| T15 | `cloudfunctions/coach/actions/getMyStatus.js` | 新建 |
| T16 | `cloudfunctions/coach/index.js` | 整文件替换 |
| T17 | `miniprogram/pages/user/privacy/index.{js,wxml,wxss,json}` | 4 个新文件 |
| T18 | `miniprogram/pages/user/agreement/index.{js,wxml,wxss,json}` | 4 个新文件 |
| T19 | `miniprogram/pages/user/settings/index.{js,wxml}` | 2 个文件全部整文件替换 |
| T20 | `miniprogram/pages/user/login/index.{js,wxml}` | 2 个文件全部整文件替换 |
| T21 | `miniprogram/pages/user/edit-profile/index.js` | 整文件替换 |
| T22 | `cloudfunctions/review/actions/myList.js` | 新建 |
| T23 | `cloudfunctions/review/index.js` | 整文件替换 |
| T24 | `miniprogram/services/review.js` | 整文件替换 |
| T25 | `miniprogram/pages/review/list/index.js` | 整文件替换 |
| T26 | `miniprogram/app.json` | 整文件替换 |

**汇总**：
- 整文件替换：**21 个**（包含 select-role 和 coach-apply 的 4 个文件）
- 末尾追加：**1 个**（profile/index.wxss）
- 纯新建：**6 个**（approve/reject/getMyStatus/myList + privacy/agreement 的 js/wxml/wxss/json）

---

## 执行约束

1. **严格按 T1→T26 顺序执行**，不可跳序
2. **不要扩展**：除上述文件外，不要修改任何其他文件
3. **不要重构**：本任务只做功能落地，不做任何"顺便优化"
4. **完整替换**：标"整文件替换"的 Task 必须用给出的代码**整体覆盖**原文件
5. **末尾追加**：仅 T6 是末尾追加，**不要覆盖**原 CSS
6. **云函数部署**：完成 T12-T16、T22-T23 后必须重新部署对应云函数
7. **执行后自验**：完成 T1-T26 后立即跑 §验收清单的 22 条 AC
8. **遇到失败立即停止**：如果某条 AC 不通过，先修复再继续

---

## 风险与回滚

| 风险 | 缓解 |
|---|---|
| silentLogin 失败导致 `globalData.openid` 为 null | silentLogin 仅成功时写 globalData，失败时不动 |
| `maybePromptLogin` setTimeout 在切走后触发 | `__routeLeft` 标记保护 |
| Service 层全静默后用户主动操作失败无提示 | `post` 仍默认弹错；用户主动 query 可单独 `{ showError: true }` 覆盖 |
| 骨架屏 shimmer 性能 | 仅动画 background-position，GPU 友好 |
| 云函数未部署导致请求失败 | 部署后必须自验 AC1-AC9 |

**回滚**：所有任务完成后如需回滚，git revert 即可。

---

> **文档结束**。开发 agent 按 T1→T26 顺序执行，**所有代码均已完整可粘贴，不需要再做技术决策**。
