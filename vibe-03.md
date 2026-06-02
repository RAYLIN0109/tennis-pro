# 三个体验问题修复任务 · 可执行文档

> **文档编号**: VIBE-03
> **版本**: 1.0
> **创建日期**: 2026-06-02
> **适用范围**: 微信云开发小程序 · 修复三个线上体验 Bug

---

## 0. 任务概述

修复用户反馈的 3 个体验问题：

| 编号 | 现象 | 根因文件 |
|---|---|---|
| Bug-1 | 进入小程序没有提示登录 | [app.js:1-32](miniprogram/app.js) `onLaunch` 无登录逻辑 |
| Bug-2 | 主页什么都不点也弹"网络异常" | [utils/request.js:47-51](miniprogram/utils/request.js) `fail` 强制弹 toast + Service `get*` 默认 `showError: true` |
| Bug-3 | 点击"我的"页面空白 | [profile/index.wxml:3,84](miniprogram/pages/user/profile/index.wxml) WXML 条件不全 + [profile/index.js:17-26](miniprogram/pages/user/profile/index.js) `onShow` 状态机错误 |

**总代码量**：~150 行 / 9 个文件 / 预计 1.5 小时。

---

## 1. 任务清单

执行顺序：**T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10**。
T2/T3/T4 可并行，T5/T6/T7 必须串行。

---

### T1 · utils/request.js · `get()` 支持 options 透传

**文件**: `miniprogram/utils/request.js`

**修改**: 把第 62-64 行的 `get()` 函数替换为：

```js
function get(name, action, data = {}, options = {}) {
  return request(name, action, data, { showLoading: false, showError: true, ...options })
}
```

**说明**: 让 `get()` 调用方能传 `{ showError: false }` 静默。

---

### T2 · services/coach.js · 列表/搜索类静默

**文件**: `miniprogram/services/coach.js`

**完整替换文件内容**:

```js
const { get, post } = require('../utils/request')

const CoachService = {
  // 列表/搜索类：静默（onShow 自动触发）
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

### T3 · services/notification.js · 全部静默

**文件**: `miniprogram/services/notification.js`

**完整替换文件内容**:

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

### T4 · services/user.js · 静默化查询

**文件**: `miniprogram/services/user.js`

**完整替换文件内容**:

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

### T5 · profile/index.wxml · 加 `wx:else` 骨架屏

**文件**: `miniprogram/pages/user/profile/index.wxml`

**完整替换文件内容**:

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

### T6 · profile/index.wxss · 末尾追加 skeleton + empty-wrap 样式

**文件**: `miniprogram/pages/user/profile/index.wxss`

**操作**: 在文件最末尾**追加**以下内容（不要覆盖原有内容）：

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

### T7 · profile/index.js · 修 onShow 状态机

**文件**: `miniprogram/pages/user/profile/index.js`

**完整替换文件内容**:

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

### T8 · app.js · 加 silentLogin

**文件**: `miniprogram/app.js`

**完整替换文件内容**:

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

### T9 · pages/index/index.js · 加 maybePromptLogin

**文件**: `miniprogram/pages/index/index.js`

**完整替换文件内容**:

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

### T10 · profile/index.wxss · 已是 T6 的一部分

**说明**: T10 不存在，骨架屏样式已在 T6 中追加。

---

## 2. 验收清单

完成所有 T1-T9 后，开发 agent 需自验以下 9 条：

| 编号 | 验证步骤 | 预期 |
|---|---|---|
| AC1 | 首次安装打开 App | 无任何红色 toast 弹窗 |
| AC2 | 首页停留 1.5 秒 | 弹出"是否立即登录"友好 Modal |
| AC3 | Modal 点"稍后再说" | 关闭，首页正常浏览 mock 数据 |
| AC4 | Modal 点"立即登录" | 跳转登录页 |
| AC5 | 不点"我的" tab | 整个 App 不弹任何"网络异常"toast |
| AC6 | 点击"我的" tab（未登录） | 0.1 秒内看到 empty-state "立即登录" |
| AC7 | 登录后点击"我的" tab | 立即看到骨架屏（shimmer 动画），1 秒后变成真实数据 |
| AC8 | 关闭云环境模拟（拔网线） | UI 安静退化到 mock/empty 状态，无错误 toast |
| AC9 | 第二次进入首页 | Modal 不再弹出（已记录 `login_prompt_shown`） |

---

## 3. 文件改动清单

| Task | 文件 | 操作 |
|---|---|---|
| T1 | `miniprogram/utils/request.js` | 替换 1 行 |
| T2 | `miniprogram/services/coach.js` | 整文件替换 |
| T3 | `miniprogram/services/notification.js` | 整文件替换 |
| T4 | `miniprogram/services/user.js` | 整文件替换 |
| T5 | `miniprogram/pages/user/profile/index.wxml` | 整文件替换 |
| T6 | `miniprogram/pages/user/profile/index.wxss` | 末尾追加 |
| T7 | `miniprogram/pages/user/profile/index.js` | 整文件替换 |
| T8 | `miniprogram/app.js` | 整文件替换 |
| T9 | `miniprogram/pages/index/index.js` | 整文件替换 |

**共 9 个文件，所有改动代码均已在 §1 中以"完整可直接复制粘贴"的形式给出。**

---

## 4. 执行约束

1. **不要扩展**：除上述 9 个文件外，不要修改任何其他文件
2. **不要重构**：本任务只修 3 个 Bug，不做任何"顺便优化"
3. **完整替换**：标"完整替换文件内容"的 Task 必须用给出的代码整体覆盖，**不要合并原有代码**
4. **追加而非覆盖**：T6 是"末尾追加"，不要覆盖原有 CSS
5. **执行后自验**：完成所有 Task 后立即跑 §2 的 9 条 AC

---

## 5. 风险与回滚

| 风险 | 缓解 |
|---|---|
| silentLogin 失败 → `globalData.openid` 仍为 null → 后续页面错乱 | silentLogin 仅在成功时写 globalData，失败时不动 |
| `maybePromptLogin` setTimeout 在用户切走后还触发 | 用 `__routeLeft` 标记，Modal 触发前检查 |
| Service 层全部静默后用户主动失败无提示 | `post` 仍默认弹错；用户主动 query 可单独传 `{ showError: true }` 覆盖 |
| 骨架屏 shimmer 性能 | 仅动画 `background-position`，GPU 友好 |

如果出现问题，git revert 本次 commit 即可回滚所有改动。

---

> **文档结束**。开发 agent 拿到此文件后，按 §1 的 T1→T9 顺序执行即可，所有代码均已完整给出，**不需要再做技术决策**。
