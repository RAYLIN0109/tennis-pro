# 个人中心 + 登录 · 二期设计文档

> **文档编号**: VIBE-02
> **版本**: 1.0
> **创建日期**: 2026-06-02
> **适用范围**: 微信云开发小程序 · 全方位网球生态 · 二期：个人中心 & 登录模块完善

---

## 1. 背景与目标

一期已实现约教练核心闭环（申请 → 审核 → 列表 → 约课）。二期聚焦**个人中心**和**登录**模块的 bug 修复、补齐缺失功能和体验优化。

### 1.1 一期遗留问题（痛点）

| # | 问题 | 影响 |
|---|---|---|
| B1 | `profile` 页"我的评价"菜单 bindtap 指向 `goOrders`（复制粘贴错误） | 用户点"我的评价"跳到订单列表 |
| B2 | `profile` 页 `isLoggedIn: true` 硬编码 | 未登录也不会提示登录，mock 数据直接展示 |
| B3 | `settings` 页"隐私政策""用户协议"无 bindtap | 点了没反应，形同虚设 |
| B4 | `login` 页底部协议文字无法点击 | 合规风险 |
| B5 | `edit-profile` 手机号无格式校验 | 可填任意内容 |
| B6 | `edit-profile` 头像上传无 fail 回调 | 上传失败无提示 |

### 1.2 二期目标

| 目标 | 产出 |
|---|---|
| 修掉全部 6 个 Bug | 4 个页面代码修改 |
| 补齐隐私政策、用户协议页面 | 2 个新页面（简单富文本） |
| 补齐"我的评价"功能入口 | 新增云函数 action + Service 方法 + profile 菜单联动 |
| 优化登录态判断 | profile 页不依赖 mock 数据判断登录/未登录 |
| 个人中心通知入口 | profile 页显示未读通知红点 |

---

## 2. 现状评估（代码审查结论）

### 2.1 已有的功能（无需重建）

| 功能 | 状态 | 关键文件 |
|---|---|---|
| 微信一键登录 | 完整 | `pages/user/login/index.*` + `cloudfunctions/user/actions/login.js` |
| 个人中心展示 | 完整 | `pages/user/profile/index.*` + `cloudfunctions/user/actions/getProfile.js` |
| 编辑资料（含头像上传） | 完整 | `pages/user/edit-profile/index.*` + `cloudfunctions/user/actions/updateProfile.js` |
| 退出登录/清除缓存 | 完整 | `pages/user/settings/index.*` + `utils/auth.js` |
| 教练认证区块 | 完整 | `pages/user/profile/index.wxml:38-54` |
| 订单列表 Tab（全部/待付款/待使用/已完成） | 完整 | `pages/order/list/index.*` |
| 评价列表（某目标的评价） | 完整 | `pages/review/list/index.*`（按 targetType+targetId 查询） |
| Service 层封装 | 完整 | `services/user.js`, `services/notification.js`, `utils/request.js` |
| 表单校验工具 | 完整 | `utils/validator.js`（`required`/`phone`/`inRange`/`isPositiveInt`） |
| 空状态/用户卡片组件 | 完整 | `components/empty-state/`, `components/user-card/` |

### 2.2 待修复 / 待新建

| # | 类型 | 问题 | 文件 |
|---|---|---|---|
| P0-1 | Bug | "我的评价" bindtap = `goOrders`，`goReviews` 不存在 | [profile/index.wxml:63](miniprogram/pages/user/profile/index.wxml:63) |
| P0-2 | Bug | `isLoggedIn: true` 硬编码 | [profile/index.js:16](miniprogram/pages/user/profile/index.js:16) |
| P0-3 | 缺失 | "隐私政策"无 bindtap | [settings/index.wxml:7](miniprogram/pages/user/settings/index.wxml:7) |
| P0-4 | 缺失 | "用户协议"无 bindtap | [settings/index.wxml:11](miniprogram/pages/user/settings/index.wxml:11) |
| P0-5 | 缺失 | 登录页协议文字纯文本 | [login/index.wxml:18](miniprogram/pages/user/login/index.wxml:18) |
| P1-1 | 缺失 | 手机号格式校验 | [edit-profile/index.js:95](miniprogram/pages/user/edit-profile/index.js:95) |
| P1-2 | Bug | 头像上传无 fail | [edit-profile/index.js:61](miniprogram/pages/user/edit-profile/index.js:61) |
| P1-3 | 缺失 | "我的评价"云函数 action 不存在 | `cloudfunctions/review/index.js` |
| P1-4 | 缺失 | 隐私政策页面不存在 | 需新建 |
| P1-5 | 缺失 | 用户协议页面不存在 | 需新建 |

---

## 3. 文件清单

### 3.1 新增文件

| 文件 | 说明 |
|---|---|
| `miniprogram/pages/user/privacy/index.js` | 隐私政策页 JS |
| `miniprogram/pages/user/privacy/index.wxml` | 隐私政策页 WXML（富文本） |
| `miniprogram/pages/user/privacy/index.wxss` | 隐私政策页样式 |
| `miniprogram/pages/user/privacy/index.json` | 隐私政策页 JSON |
| `miniprogram/pages/user/agreement/index.js` | 用户协议页 JS |
| `miniprogram/pages/user/agreement/index.wxml` | 用户协议页 WXML（富文本） |
| `miniprogram/pages/user/agreement/index.wxss` | 用户协议页样式 |
| `miniprogram/pages/user/agreement/index.json` | 用户协议页 JSON |
| `cloudfunctions/review/actions/myList.js` | 我的评价云函数 |

### 3.2 修改文件

| 文件 | 修改内容 |
|---|---|
| `miniprogram/app.json` | 注册 `pages/user/privacy/index` 和 `pages/user/agreement/index` |
| `miniprogram/pages/user/profile/index.js` | 删除 `isLoggedIn` hack、增加 `goReviews`/`loadUnreadCount`、修复登录态判断 |
| `miniprogram/pages/user/profile/index.wxml` | 修复"我的评价"bindtap、增加通知入口 |
| `miniprogram/pages/user/profile/index.wxss` | 通知红点样式 |
| `miniprogram/pages/user/settings/index.wxml` | "隐私政策""用户协议"加 bindtap |
| `miniprogram/pages/user/settings/index.js` | 新增 `goPrivacy`、`goAgreement` 方法 |
| `miniprogram/pages/user/login/index.wxml` | 协议文字加点击跳转 |
| `miniprogram/pages/user/login/index.js` | 新增 `goPrivacy`、`goAgreement` 方法 |
| `miniprogram/pages/user/edit-profile/index.js` | 增加手机号格式校验、头像上传 fail 回调 |
| `miniprogram/services/review.js` | 新增 `getMyList(params)` 方法 |
| `cloudfunctions/review/index.js` | 追加 `myList` 路由 |
| `miniprogram/common/mock-data.js` | 新增 `mockMyReviews` 数据 |

---

## 4. 数据库设计

**不变**。二期不创建新集合，不修改现有集合 schema。

"我的评价"功能复用 `reviews` 集合，通过 `created_by`（openid）索引查询（该索引已存在于 `database/indexes.json`）：
```
reviews 集合索引: { "fields": ["created_by", "order"] }
```

---

## 5. Bug 修复详设

### 5.1 P0-1：profile 页"我的评价"菜单修复

**根因**：`profile/index.wxml:63` 复制粘贴了第 59 行的 `bindtap="goOrders"`。

**修法**：

```js
// profile/index.js — 新增方法
goReviews() {
  wx.navigateTo({ url: '/pages/review/my-list/index' })
}

goOrders() {
  wx.navigateTo({ url: '/pages/order/list/index' })
}
```

```xml
<!-- profile/index.wxml:63 — 修复后 -->
<view class="menu-item" bindtap="goReviews">
  <text class="menu-label">我的评价</text>
  <text class="menu-arrow">></text>
</view>
```

### 5.2 P0-2：profile 页登录态 hack 修复

**根因**：`profile/index.js:16` 有 `this.setData({ isLoggedIn: true })` 注释写着"无云环境时直接使用模拟数据展示登录状态"，这是一个开发期 hack。

**修法**：

```js
// profile/index.js — onShow 改造
onShow() {
  const { checkLogin } = require('../../utils/auth')
  const loggedIn = checkLogin()
  this.setData({ isLoggedIn: loggedIn })

  if (loggedIn) {
    this.loadProfile()
    this.loadCoachStatus()
    this.loadUnreadCount()
  }
}
```

逻辑：`checkLogin()` 检查 `app.globalData.openid` 是否存在。存在 → 展示登录后页面；不存在 → 展示未登录引导（empty-state 组件）。

### 5.3 P0-3 / P0-4：settings 页协议入口补全

```js
// settings/index.js — 新增方法
goPrivacy() {
  wx.navigateTo({ url: '/pages/user/privacy/index' })
},

goAgreement() {
  wx.navigateTo({ url: '/pages/user/agreement/index' })
}
```

```xml
<!-- settings/index.wxml:7 — 修复后 -->
<view class="settings-item" bindtap="goPrivacy">
  <text class="settings-label">隐私政策</text>
  <text class="settings-arrow">></text>
</view>

<!-- settings/index.wxml:11 — 修复后 -->
<view class="settings-item" bindtap="goAgreement">
  <text class="settings-label">用户协议</text>
  <text class="settings-arrow">></text>
</view>
```

### 5.4 P0-5：login 页协议文字可点击

```xml
<!-- login/index.wxml:18 — 修复后 -->
<text class="login-agreement">
  登录即表示同意
  <text class="link" bindtap="goAgreement">《用户协议》</text>
  和
  <text class="link" bindtap="goPrivacy">《隐私政策》</text>
</text>
```

```js
// login/index.js — 新增方法（与 settings 相同）
goPrivacy() { wx.navigateTo({ url: '/pages/user/privacy/index' }) },
goAgreement() { wx.navigateTo({ url: '/pages/user/agreement/index' }) }
```

### 5.5 P1-1：edit-profile 手机号格式校验

```js
// edit-profile/index.js:94 — 修复 onSubmit 校验规则
onSubmit() {
  const error = validateForm([
    { field: 'nickname', rules: [{ type: 'required', message: '昵称' }] },
    { field: 'phone', rules: [{ type: 'phone', message: '手机号格式不正确' }] }  // 新增
  ], this.data.form)

  if (error) {
    wx.showToast({ title: error, icon: 'none' })
    return
  }
  // ... 后续逻辑不变
}
```

`validator.js` 中 `phone` 规则已存在，匹配 `/^1[3-9]\d{9}$/`，只需应用即可。

### 5.6 P1-2：edit-profile 头像上传 fail 处理

```js
// edit-profile/index.js:54 — 修复 onChooseAvatar
wx.cloud.uploadFile({
  cloudPath,
  filePath: tempPath,
  success: (uploadRes) => {
    this.setData({ 'form.avatar_url': uploadRes.fileID })
  },
  fail: (err) => {
    console.error('[uploadAvatar]', err)
    wx.showToast({ title: '头像上传失败，请重试', icon: 'none' })
    // 回退显示临时图片，不阻塞保存（用户可下次再传）
  }
})
```

---

## 6. 新增页面与功能

### 6.1 隐私政策页（`pages/user/privacy/index`）

**定位**：纯展示页，静态文案，不依赖后端。

**WXML 结构**：
```xml
<view class="rich-text-page page-container">
  <view class="content">
    <h1>隐私政策</h1>
    <section>
      <h2>一、信息收集</h2>
      <p>本小程序仅收集您在注册、使用过程中主动提供的信息，包括：微信头像、昵称、手机号码、网球水平、所在城市等。未经您明确同意，我们不会收集其他个人信息。</p>
    </section>
    <section>
      <h2>二、信息使用</h2>
      <p>收集的信息用于：为您提供预约教练、参与活动、评价服务等功能。我们不会将您的个人信息出售、交易或转让给第三方。</p>
    </section>
    <section>
      <h2>三、信息存储</h2>
      <p>您的信息存储在微信云开发（CloudBase）平台，采用行业标准的安全措施保护您的数据。</p>
    </section>
    <section>
      <h2>四、您的权利</h2>
      <p>您可以在个人中心编辑或删除您的基本信息。如需彻底注销账号，请联系客服。</p>
    </section>
    <section>
      <h2>五、联系我们</h2>
      <p>如有隐私相关问题，请在设置页的"意见反馈"中联系我们。</p>
    </section>
  </view>
</view>
```

**JS**：空 Page — 纯展示，无逻辑。

**JSON**：`{ "navigationBarTitleText": "隐私政策" }`

**样式**：`rich-text-page` — 大标题居中，section 间距 48rpx，p 行高 1.8。

### 6.2 用户协议页（`pages/user/agreement/index`）

**定位**：与隐私政策类似，纯展示静态页。

**WXML 结构**：
```xml
<view class="rich-text-page page-container">
  <view class="content">
    <h1>用户协议</h1>
    <section>
      <h2>一、服务说明</h2>
      <p>TennisVibe 网球生态小程序致力于为用户提供便捷的网球教练预约、场地查询、球友社交等服务。</p>
    </section>
    <section>
      <h2>二、用户义务</h2>
      <p>您承诺所提供的个人信息真实有效，不发布违法、违规或侵犯他人权益的内容。</p>
    </section>
    <section>
      <h2>三、平台权利</h2>
      <p>平台有权审核用户提交的信息，并对违规行为采取警告、限制或封禁措施。</p>
    </section>
    <section>
      <h2>四、免责声明</h2>
      <p>平台作为信息中介，不对教练与学员之间的实际服务质量和交易纠纷承担责任，但会积极配合协商解决。</p>
    </section>
    <section>
      <h2>五、协议修改</h2>
      <p>我们可能根据需要更新本协议，更新后的协议将在小程序内公布。</p>
    </section>
  </view>
</view>
```

**JSON**：`{ "navigationBarTitleText": "用户协议" }`

### 6.3 我的评价功能 —— 后端（新增）

#### 6.3.1 云函数 `cloudfunctions/review/actions/myList.js`

```js
/**
 * 获取当前用户发表的所有评价
 * 复用 reviews 集合的 created_by 索引
 */
module.exports = async function myList(db, openid, event) {
  const { page = 1, pageSize = 10 } = event
  const _ = db.command

  // 屏蔽被隐藏的评价
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

  // 批量获取关联的订单信息（展示"评价了什么"）
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

#### 6.3.2 云函数路由注册

```js
// cloudfunctions/review/index.js — 追加 import
const myList = require('./actions/myList')

// switch case 中追加
case 'myList': return await myList(db, OPENID, event)
```

#### 6.3.3 Service 层

```js
// services/review.js — 追加方法
getMyList(params) { return get('review', 'myList', params) }
```

### 6.4 我的评价页面（前端）

**路由**：`pages/review/my-list/index`

> **策略**：不新建页面，因为已有 `review/list/index` 页面（按 target 评价列表）。但"我的评价"查询逻辑完全不同（按 created_by）。一期直接用**复用 `review/list` 页面**的方式：
> - 在 `review/list/index.js` 的 `onLoad` 中检查 URL 参数 `from === 'mine'`
> - 若 `from === 'mine'`，调用 `ReviewService.getMyList()` 而非 `ReviewService.getList()`

```js
// review/list/index.js — 修改 onLoad
onLoad(options) {
  if (options.from === 'mine') {
    this.setData({ isMine: true })
    wx.setNavigationBarTitle({ title: '我的评价' })
    this.loadMyData(true)
    return
  }
  // 原有逻辑不变
  this.setData({ targetType: options.targetType, targetId: options.targetId })
  this.loadStats()
  this.loadData(true)
},

loadMyData(reset) {
  if (this.data.loading) return Promise.resolve()
  const page = reset ? 1 : this.data.page
  this.setData({ loading: true })
  if (reset) this.setData({ list: [], hasMore: true })

  return ReviewService.getMyList({ page, pageSize: this.data.pageSize })
    .then((res) => {
      const newList = reset ? res.list : [...this.data.list, ...res.list]
      this.setData({
        list: newList,
        total: res.total,
        page: page + 1,
        hasMore: newList.length < res.total
      })
    })
    .catch(() => {})
    .finally(() => { this.setData({ loading: false }) })
}
```

```js
// profile/index.js — goReviews 导航
goReviews() {
  wx.navigateTo({ url: '/pages/review/list/index?from=mine' })
}
```

### 6.5 Profile 页通知入口

```xml
<!-- profile/index.wxml — 在统计行与教练认证之间插入 -->
<view class="profile-notify card" bindtap="goNotifications">
  <text class="menu-label">消息通知</text>
  <view class="notify-right">
    <text wx:if="{{unreadCount > 0}}" class="badge-unread">{{unreadCount > 99 ? '99+' : unreadCount}}</text>
    <text class="menu-arrow">></text>
  </view>
</view>
```

```js
// profile/index.js — 新增方法
loadUnreadCount() {
  const NotificationService = require('../../services/notification')
  NotificationService.getUnreadCount().then(res => {
    this.setData({ unreadCount: res.count || 0 })
  }).catch(() => {})
},

goNotifications() {
  // 暂时跳转到订单列表占位（通知列表页面二期后补）
  wx.showToast({ title: '通知列表即将上线', icon: 'none' })
}
```

```css
/* profile/index.wxss — 追加 */
.badge-unread {
  background-color: #EF4444;
  color: #FFFFFF;
  font-size: 22rpx;
  padding: 2rpx 12rpx;
  border-radius: 20rpx;
  margin-right: 12rpx;
}
```

---

## 7. Mock 数据补充

`miniprogram/common/mock-data.js` 追加：

```js
mockMyReviews: [
  {
    _id: 'mock_review_001',
    order_id: 'mock_order_001',
    rating: 5,
    content: '教练非常专业，讲解清晰，对我的正手技术帮助很大！',
    target_type: 'coach',
    target_id: 'mock_coach_001',
    images: [],
    reply: null,
    is_anonymous: false,
    status: 'visible',
    created_at: '2026-05-20'
  },
  {
    _id: 'mock_review_002',
    order_id: 'mock_order_002',
    rating: 4,
    content: '场地环境不错，教练也很有耐心',
    target_type: 'coach',
    target_id: 'mock_coach_002',
    images: [],
    reply: null,
    is_anonymous: false,
    status: 'visible',
    created_at: '2026-05-15'
  }
]
```

---

## 8. 任务拆分（Phase 2 — 全部 12 个 Task）

| Task | 内容 | 文件 | 工作量 |
|---|---|---|---|
| T1 | `app.json` 注册 privacy/agreement 页面 | `app.json` | 1 行 |
| T2 | 新建隐私政策页 | `pages/user/privacy/index.{js,wxml,wxss,json}` | 纯静态，约 60 行 WXML |
| T3 | 新建用户协议页 | `pages/user/agreement/index.{js,wxml,wxss,json}` | 纯静态，约 60 行 WXML |
| T4 | 修 profile "我的评价" bug + 登录态 hack | `pages/user/profile/index.{js,wxml}` | ~30 行改动 |
| T5 | 修 settings 协议入口 | `pages/user/settings/index.{js,wxml}` | ~10 行 |
| T6 | 修 login 协议链接 | `pages/user/login/index.{js,wxml}` | ~10 行 |
| T7 | 修 edit-profile 校验+上传 fail | `pages/user/edit-profile/index.js` | ~15 行 |
| T8 | 新增 `myList` 云函数 + 路由注册 | `cloudfunctions/review/actions/myList.js` + `cloudfunctions/review/index.js` | ~50 行 |
| T9 | 新增 `ReviewService.getMyList()` | `services/review.js` | 1 行 |
| T10 | 复用 `review/list` 页面支持 `from=mine` | `pages/review/list/index.js` | ~30 行 |
| T11 | Profile 页通知红点 | `pages/user/profile/index.{js,wxml,wxss}` | ~25 行 |
| T12 | Mock 数据补充 | `common/mock-data.js` | ~30 行 |

**执行顺序**：T1 → T2/T3/T8 可并行 → T4/T5/T6/T7/T9 可并行 → T10/T11/T12 可并行

---

## 9. 验收标准

| 编号 | 验收项 | 预期结果 |
|---|---|---|
| AC1 | 点击 profile 页"我的评价" | 跳转到评价列表页（标题"我的评价"），展示当前用户历史评价 |
| AC2 | 未登录状态进入 profile | 展示 empty-state 引导登录，不显示 mock 用户数据 |
| AC3 | 已登录状态进入 profile | 正常加载用户信息、统计、教练认证、未读通知数 |
| AC4 | 点击 settings 页"隐私政策" | 跳转隐私政策页，可阅读完整条款 |
| AC5 | 点击 settings 页"用户协议" | 跳转用户协议页，可阅读完整条款 |
| AC6 | 点击 login 页底部"《用户协议》" | 跳转用户协议页 |
| AC7 | 点击 login 页底部"《隐私政策》" | 跳转隐私政策页 |
| AC8 | edit-profile 手机号填"abc"提交 | 显示"手机号格式不正确"，不外发请求 |
| AC9 | edit-profile 头像上传失败 | 显示 toast 提示，不阻塞页面操作 |
| AC10 | profile 页有未读通知 | 通知入口显示红色数字徽标 |
| AC11 | 无未读通知 | 通知入口不显示数字徽标 |

---

## 10. 风险与依赖

| 风险 | 缓解 |
|---|---|
| "我的评价"复用 `review/list` 页面，两种查询逻辑共存可能引入 bug | `isMine` flag 严格隔开两种分支，`loadData` vs `loadMyData` 互不调用 |
| `review/list` 页面的 WXML 可能不适用"我的评价"展示格式 | 若差异大，二期后补独立页面；一期先用 `wx:if="{{isMine}}"` 切换布局 |
| 通知列表页面未实现，"消息通知"点击仅 toast | 如时间允许加到本迭代；否则三期单独做 |

---

> **文档结束**。请按 §8 任务拆分顺序开发，所有 Task 的代码修改量均控制在 10–60 行，单个 Task 不超过 1 小时。
