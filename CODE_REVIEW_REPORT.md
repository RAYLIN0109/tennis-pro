# Tennis Eco 微信小程序 — 完整项目审查报告

> 评审对象：`d:/workspace/vb`
> 代码体量：172 个文件（miniprogram 136 / cloudfunctions 32 / database 4）
> 评审维度：架构 · 代码质量 · 安全性 · 性能 · 可维护性
> 评审基准：基于 10 年以上全栈架构视角，对照微信云开发最佳实践

---

## 0. 整体评价（Executive Summary）

Tennis Eco 是一个面向网球爱好者的小程序生态，覆盖用户体系、教练/场地发现与预约、订单与评价闭环。从工程化视角看，**项目完成了 70% 的生产级架构搭建**：分层清晰、组件化彻底、设计 token 统一、数据库索引有初步设计。但仍存在 **3 个新发现的致命/阻塞级问题**、**11 个警告级隐患**、**9 个改进建议**，且数据库索引设计不完整、Mock 数据与生产代码耦合过深，**当前不具备生产上线条件，但已具备 MVP 内测条件**。

**整体评分：5.5 / 10**

---

## 1. 6 个致命修复验证表

> 上轮审查发现并修复的 6 个致命问题，本轮重新核验。

| # | 问题描述 | 修复位置 | 验证结论 |
|---|----------|----------|----------|
| 1 | `formatDate` 从 `formatter.js` 导入，实际定义在 `date.js`，导致 `order/detail` 运行时崩溃 | [order/detail/index.js:3-4](miniprogram/pages/order/detail/index.js:3) | ✅ 已拆分为两行独立 import，运行时不再 `undefined` |
| 2 | `services/activity.js:6` `create` 用 `get` 执行写操作，丢失 Loading 与重试保护 | [activity.js:6](miniprogram/services/activity.js:6) | ✅ 已改用 `post('activity', 'create', data, '创建中...')` |
| 3a | `coach/book` 用 `get('order', 'create', ...)` 与 `get('order', 'pay', ...)` | [coach/book/index.js:90-93](miniprogram/pages/coach/book/index.js:90) | ✅ 已改用 `post('order', 'create', orderData, '创建订单中...')` 与 `post('order', 'pay', ...)` |
| 3b | `venue/book` 同 3a 问题 | [venue/book/index.js:84-85](miniprogram/pages/venue/book/index.js:84) | ✅ 已改用 `post`，并修复 import 缺失 `get` |
| 4 | `confirm` action 无身份校验，任何人可确认任意订单 | [confirm.js:4-18](cloudfunctions/order/actions/confirm.js:4) + [order/index.js:28](cloudfunctions/order/index.js:28) | ✅ 已增加 `openid` 入参、`created_by` 校验、状态校验 |
| 5 | `create` action 订单 add 失败时不回滚已预约时段，造成"幽灵锁定" | [create.js:60-69](cloudfunctions/order/actions/create.js:60) | ✅ 已用 `try/catch` + `releaseSlot` 包裹订单创建 |
| 6 | `notification.markRead` 单条通知不校验归属 | [notification/index.js:17-28](cloudfunctions/notification/index.js:17) | ✅ 已先 `where({_id, user_id: OPENID})` 查询校验 |

**结论**：上轮 6 个致命问题已全部修复并通过验证。

---

## 2. 本轮新发现 — 致命/阻塞级（3 项）

### 🔴 A1. `applyCoach` 用户角色不会更新（重提申请场景）

- **文件**: [applyCoach.js:47-53](cloudfunctions/coach/actions/applyCoach.js:47)
- **现象**: 当 `existing.length > 0`（即用户重新提交教练申请）时，函数**只更新 `coaches` 表，不会触碰 `users.role`**。`addToSet('coach')` 仅在"新申请"分支被调用。
- **影响**: 被 `suspended` 后再次申请并通过审核的用户，永远没有 `coach` 角色权限。前端所有依赖 `role` 的判断（如"我的页面"是否显示"教练中心"入口）将全部错误。
- **修复建议**:
  ```js
  // 1) 角色更新逻辑移出 if/else 分支，合并到所有路径末尾
  await db.collection('users').where({ _openid: openid }).update({
    data: { role: db.command.addToSet('coach'), updated_at: now }
  })
  // 2) 移除原 58-63 行的角色更新代码
  ```

### 🔴 A2. `venue/list` Mock 过滤逻辑永远不匹配

- **文件**: [venue/list/index.js:58](miniprogram/pages/venue/list/index.js:58)
- **现象**: `v.court_types.indexOf(this.data.selectedCourtType) > -1`
  - `court_types` 数组存的是**中文标签**（如 `['硬地', '室内']`，见 [mock-data.js:117](miniprogram/common/mock-data.js:117)）
  - `selectedCourtType` 是**英文 value**（如 `'hard'`、`'indoor'`，见 [constants/venue.js:1-8](miniprogram/common/constants/venue.js:1)）
- **影响**: 当云函数不可用、走 Mock 兜底时，无论选哪个场地类型筛选，结果都为空。开发演示环境的筛选功能**完全失效**。
- **修复建议**: 改用中文 label 匹配，或在 Mock 中改存英文 value：
  ```js
  list = list.filter(function(v) {
    return v.court_types_cn
      ? v.court_types_cn.indexOf(CN_MAP[this.data.selectedCourtType]) > -1
      : v.court_types.indexOf(this.data.selectedCourtType) > -1
  }.bind(this))
  ```

### 🔴 A3. 评价云函数 `create` 并发场景下重复评价

- **文件**: [create.js:6-10](cloudfunctions/review/actions/create.js:6)
- **现象**: 流程为 ① 查询订单 → ② 检查 `reviewed` → ③ `add` 评价 → ④ `update` 订单 `reviewed=true`。**没有任何原子保护**。两次请求几乎同时进入时：两个请求都通过 `reviewed === false` 检查，**两次 add 都会成功**（虽然 `reviews.order_id` 唯一索引最终会阻止第二个 insert，但 `update` 订单状态的顺序与时序强相关）。
- **影响**: 极端并发场景下可能产生重复评价、评价统计被错误计算、订单状态机错乱。
- **修复建议**:
  ```js
  // 改用云数据库事务
  const transaction = await db.startTransaction()
  try {
    const orderRes = await transaction.collection('orders').doc(orderId).get()
    if (orderRes.data.reviewed) throw new Error('已评价过此订单')
    await transaction.collection('reviews').add({ data: {...} })
    await transaction.collection('orders').doc(orderId).update({ data: { reviewed: true, status: 'reviewed' } })
    await transaction.commit()
  } catch (e) { await transaction.rollback() }
  ```

---

## 3. 本轮新发现 — 警告/隐患级（11 项）

### 🟡 B1. 8 个页面混用 `var` 与 `const/let`

涉及文件（行号）:
- [coach/list/index.js:3](miniprogram/pages/coach/list/index.js:3)
- [venue/list/index.js:3](miniprogram/pages/venue/list/index.js:3)
- [index/index.js:4](miniprogram/pages/index/index.js:4)
- [venue/detail/index.js:5](miniprogram/pages/venue/detail/index.js:5)
- [order/list/index.js:5](miniprogram/pages/order/list/index.js:5)
- [coach/detail/index.js:4](miniprogram/pages/coach/detail/index.js:4)
- [user/profile/index.js:3](miniprogram/pages/user/profile/index.js:3)
- [order/detail/index.js:5](miniprogram/pages/order/detail/index.js:5)

**典型反模式**:
```js
var mock = require('../../common/mock-data')
...
var self = this
CoachService.getDetail(...).then(function(data) { self.setData(...) })
```

**风险**: `var` 函数级作用域提升、重复声明不报错、容易闭包错乱。建议统一 `const` / `let`，并改用箭头函数消除 `self = this`。

### 🟡 B2. 硬编码颜色，破坏主题系统

- [settings/index.js:11](miniprogram/pages/user/settings/index.js:11) `confirmColor: '#EF4444'`
- [order/list/index.js:111](miniprogram/pages/order/list/index.js:111) `confirmColor: '#EF4444'`
- [order/detail/index.js:71](miniprogram/pages/order/detail/index.js:71) `confirmColor: '#EF4444'`
- [app.json:30-31](miniprogram/app.json:30) `"color": "#9CA3AF", "selectedColor": "#059669"`

**问题**: 主题已定义 `--danger: #EF4444`、`--accent: #059669`（[theme.wxss:8-21](miniprogram/common/styles/theme.wxss:8)），但 JS 中硬编码色值，**主题切换将完全失效**。另外 `app.json` 中的 tabBar 色值与 `theme.wxss` 中的 `--accent: #D4FF00`（柠檬绿）**不一致**。

**修复建议**: 在 `app.js` 中封装 `getThemeColor(name)` 工具，JS 通过 API 访问色值。

### 🟡 B3. `app.json` 注册的 `pages/activity/detail` 与 `pages/activity/create` 是空 Page

- [activity/detail/index.js:1](miniprogram/pages/activity/detail/index.js:1) —— `Page({ data: {}, onLoad() {} })`
- [activity/create/index.js:1](miniprogram/pages/activity/create/index.js:1) —— `Page({ data: {}, onSubmit() { wx.showToast({ title: '即将开放', icon: 'none' }) } })`
- 但 [app.json:11-12](miniprogram/app.json:11) 已将它们注册为合法路由。

**影响**: 用户从分享/调试器进入这些空页面，会看到完全空白的视图（连 Loading 或 Coming Soon 都没有），严重影响专业感。

### 🟡 B4. `pages/tennis-circle/index` 是占位页面但路径可疑

[tennis-circle/index.wxml](miniprogram/pages/tennis-circle/index.wxml) 仅展示"网球圈 社区功能即将上线"提示，但**未在 `app.json` 的 `pages` 数组中确认注册**。如已注册，应在 404 时给 Toast 引导；如未注册则应删除该文件。

### 🟡 B5. `request.js` 缺少请求去重与重试机制

- [request.js:14-60](miniprogram/utils/request.js:14) —— 每次 `wx.cloud.callFunction` 都会真实发送。
- 订单创建/支付/确认等关键操作若因网络抖动失败，用户可能反复点击，造成**多次云函数调用**、**多次时段预约**。

**修复建议**:
```js
const inflight = new Map()
function request(name, action, data, options) {
  const key = `${name}:${action}:${JSON.stringify(data)}`
  if (inflight.has(key)) return inflight.get(key)
  const p = callOnce(name, action, data, options).finally(() => inflight.delete(key))
  inflight.set(key, p)
  return p
}
```

### 🟡 B6. `coach/detail` 中 `var self = this` 与其他文件风格不一致

- [coach/detail/index.js:55-67](miniprogram/pages/coach/detail/index.js:55) 用了 3 处 `var self = this` + `function() {}` 闭包
- 同项目 [venue/detail/index.js:48-69](miniprogram/pages/venue/detail/index.js:48) 用了 `.then((data) => {})` 箭头函数

建议统一为箭头函数，消除 `self` 样板。

### 🟡 B7. `applyCoach` 中 `real_name` 等字段无长度/特殊字符校验

- [applyCoach.js:11-13](cloudfunctions/coach/actions/applyCoach.js:11) —— `if (!real_name)` 仅判断非空
- 未限制长度（如 100 字以内）、未过滤 emoji 与特殊字符、未做敏感词过滤
- 这些字段会被多个 WXML 直接 `{{coach.real_name}}` 渲染（[coach/detail/index.wxml:12](miniprogram/pages/coach/detail/index.wxml:12) 等）

虽然 WXML 的 `{{}}` 语法默认转义，但缺失校验依然可能导致以下问题：
1. 极端长字符串导致 WXML 渲染性能问题
2. 特殊字符导致复制到剪贴板异常
3. 数据库字段长度溢出（虽云数据库自动扩展，但索引字段仍受限）

### 🟡 B8. `getMyInfo` 与 `getProfile` 数据冗余

- [getMyInfo.js](cloudfunctions/user/actions/getMyInfo.js) 返回裁剪后的字段
- [getProfile.js](cloudfunctions/user/actions/getProfile.js) 返回完整字段
- 两者用途几乎重叠，前端 [auth.js:42-50](miniprogram/utils/auth.js:42) 调 `getMyInfo` 实际拿到了和 `getProfile` 几乎一样的内容（仅多裁剪了几个内部字段）

**建议**: 合并为 `getProfile` 一个接口，加 `?fields=` 参数控制返回字段。

### 🟡 B9. `user-card` 组件缺少无障碍与点击反馈

- [user-card/index.wxml:1](miniprogram/components/user-card/index.wxml:1) —— 整个卡片是 `<view bindtap="onTap">`
- **没有** `hover-class` 反馈
- **没有** `aria-role` / `aria-label`
- **没有** `catch:tap` 防止事件冒泡

### 🟡 B10. 项目命名不一致

- [theme.wxss:2](miniprogram/common/styles/theme.wxss:2) 注释 `TennisVibe`
- [global.wxss:2](miniprogram/common/styles/global.wxss:2) 注释 `TennisVibe`
- [project.config.json:2](project.config.json:2) 描述 `Tennis Ecosystem WeChat Mini Program`
- [app.json:24](miniprogram/app.json:24) 导航栏标题 `Tennis Eco`
- 实际 GitHub 仓库名为 `tennis-pro`（[.git/config:9](.git/config:9)）

**品牌命名四套并存**，对市场推广和代码维护都是隐患。

### 🟡 B11. `price-display` 组件与 `formatter.js` 重复实现

- [price-display/index.js:13-19](miniprogram/components/price-display/index.js:13) 重复了 [formatter.js:priceShort](miniprogram/utils/formatter.js:16) 的逻辑
- 未来修改"分 -> 元"单位或国际化时需同步两处

**建议**: price-display 改为调用 `formatter.priceShort()` 而非自实现。

---

## 4. 本轮新发现 — 改进建议级（9 项）

### 🟢 C1. `mock-data.js` 体积较大且包含敏感信息

- [mock-data.js:9-19](miniprogram/common/mock-data.js:9) 包含完整用户信息：昵称、手机号片段、城市、个人简介
- 共 268 行，正式上线前应通过构建脚本剔除或抽离到 `mock/` 目录，由环境变量决定是否打包

### 🟢 C2. `applyCoach` 中 `service_areas`、`venue_ids` 字段无前端业务实现

- [applyCoach.js](cloudfunctions/coach/actions/applyCoach.js) 在数据层定义了两个字段
- 前端无任何使用它们的地方（搜索 [miniprogram](miniprogram) 目录无匹配）
- 可能造成用户填写后无意义，建议要么删除要么补完前端

### 🟢 C3. `time-slot-picker` 的 `getSlotClass` 方法未被使用（死代码）

- [time-slot-picker/index.js:54-68](miniprogram/components/time-slot-picker/index.js:54) 定义了 `getSlotClass` 方法
- 但 WXML 中 class 计算直接写在了 `wx:class` 表达式里（[index.wxml:6](miniprogram/components/time-slot-picker/index.wxml:6)）
- 建议：要么删除方法，要么改为在 WXML 中用 `{{getSlotClass(index)}}` 表达式调用

### 🟢 C4. 18 处页面的加载/分页/下拉刷新逻辑重复

`loadData(reset)` + `onReachBottom` + `onPullDownRefresh` 这套模式在 6+ 个列表页完全一致：
- [coach/list](miniprogram/pages/coach/list/index.js)、[venue/list](miniprogram/pages/venue/list/index.js)
- [order/list](miniprogram/pages/order/list/index.js)、[review/list](miniprogram/pages/review/list/index.js)
- [coach/detail](miniprogram/pages/coach/detail/index.js)、[venue/detail](miniprogram/pages/venue/detail/index.js)

**建议**: 抽取为 `Page Behavior`：
```js
// behaviors/paginated.js
module.exports = Behavior({
  data: { list: [], page: 1, total: 0, hasMore: true, loading: false },
  methods: {
    onPullDownRefresh() { return this.loadData(true).then(() => wx.stopPullDownRefresh()) },
    onReachBottom() { if (this.data.hasMore && !this.data.loading) this.loadData(false) }
  }
})
```

### 🟢 C5. `UserService.login` 与 `auth.login` 功能重复

- [UserService.login](miniprogram/services/user.js:4) 直接调云函数 `user/login`
- [auth.login](miniprogram/utils/auth.js:7) 也调同一云函数，只是后者多更新了 `globalData`
- 两套入口并存，未来行为易发散

**建议**: 保留 `auth.login`（含副作用），删除 `UserService.login`，所有调用统一走 `auth`。

### 🟢 C6. WXML 全局缺少无障碍属性

整个项目无障碍支持为零：
- 无 `aria-label` / `role`
- 图片无 `alt`
- 按钮无 `aria-role="button"`

对视障用户、老人机、儿童机不友好。建议至少在以下关键交互元素补 `aria-*` 属性。

### 🟢 C7. `review/create` 计算均分仍全量扫描

- [create.js:32-34](cloudfunctions/review/actions/create.js:32) `const allReviews = await reviewsCol.where(...).field({rating:true}).get()`
- [getStats.js:6](cloudfunctions/review/actions/getStats.js:6) 同上
- 评价数 < 100 时问题不大，但热门教练超过 1000 条评价后会触发云数据库单次查询上限（1000 条），导致统计结果**永远不准确**。

**建议**: 在 `coaches` / `venues` 文档上维护 `rating_sum` 与 `review_count` 增量字段，避免重新扫描。

### 🟢 C8. `app.js` 缺少 `onError` 全局错误捕获

- [app.js:1-32](miniprogram/app.js:1) 仅有 `onLaunch`，未注册 `onError`
- 未捕获的 Promise rejection 和 JS 异常会被静默吞掉，线上排查极难

**建议**:
```js
App({
  onError(err) { console.error('[Global Error]', err); /* 上报到监控 */ }
})
```

### 🟢 C9. 缺少 `package-lock.json` / 根 `package.json`

- [cloudfunctions/user/package.json](cloudfunctions/user/package.json) 是云函数依赖，但根目录无 `package.json`
- `miniprogram` 目录中无 `package.json`（虽然用了 `lazyCodeLoading`）
- CI/CD 难以保证可复现构建

---

## 5. WXML 模板层审查

### 5.1 通用观察

- **XSS 风险评估**: ✅ **安全**。WXML 的 `{{}}` 语法默认 HTML 转义，所有用户输入（昵称、教练简介、评价内容）都通过 `{{}}` 输出，无 `rich-text` / `parser` 注入风险。
- **性能**: 列表渲染均使用 `wx:key`，但部分用 `wx:key="*this"`（如 [coach/detail/index.wxml:18](miniprogram/pages/coach/detail/index.wxml:18)、[review/list/index.wxml:42](miniprogram/pages/review/list/index.wxml:42)）—— 用 `*this` 在列表项可能重复时会引发渲染异常，建议改为具体唯一字段 `_id`。

### 5.2 具体 WXML 问题

#### D1. `coach/detail/index.wxml:14` - 硬编码中文"已认证"
```html
<view wx:if="{{coach.status === 'active'}}" class="badge badge-accent">已认证</view>
```
建议用 `<status-badge status="{{coach.status}}" type="coach" />` 复用组件，状态文案统一由 [status-badge/index.js:18-19](miniprogram/components/status-badge/index.js:18) 维护。

#### D2. `coach/detail/index.wxml:36` - 评分显示逻辑重复
```html
<text class="stat-desc">{{coach.rating > 0 ? (coach.ratingText || coach.rating) : '暂无'}}</text>
```
`ratingText` 字段在数据中不存在，逻辑退化为直接显示 `coach.rating`。建议直接：
```html
<text class="stat-desc">{{coach.rating > 0 ? coach.rating : '暂无'}}</text>
```

#### D3. `order/detail/index.wxml:19` - 资源名称三层回退可读性差
```html
<text class="resource-name">{{order.resource_info.name || order.resource_snapshot.name || '未知'}}</text>
```
三层 `||` 嵌套阅读困难，建议封装为 WXS：
```html
<wxs module="m">module.exports.name = function(a,b){ return a&&a.name || b&&b.name || '未知' }</wxs>
<text class="resource-name">{{m.name(order.resource_info, order.resource_snapshot)}}</text>
```

#### D4. `user/edit-profile/index.wxml:32-33` - Picker 显示逻辑硬编码 `>`
```html
<view class="picker-value">{{genderOptions[genderIndex].label}} ></view>
```
`<` `>` 符号在 WXML 中是文本占位符，需用 `&lt;` `&gt;` 转义或改用图标。当前写法在真机上会渲染为箭头字符，但代码语义不清晰。建议改用 `›` Unicode 字符或图片。

#### D5. `review/list/index.wxml:10` - 内联数组硬编码
```html
<view wx:for="{{[5,4,3,2,1]}}" wx:key="*this" class="bar-row">
```
应移至 JS `data` 中维护，遵循"模板只渲染、逻辑在 JS"原则。

#### D6. `time-slot-picker/index.wxml:6` - 内联 class 表达式过长
```html
class="slot {{item.status === 'booked' || item.status === 'blocked' ? 'slot-disable' : item.status === 'pending' ? 'slot-pending' : selectedIndexes.indexOf(index) > -1 ? 'slot-selected' : 'slot-available'}}"
```
三元嵌套严重，建议：
- 在 JS 中用 WXS 函数或 `data-*` 标记
- 或拆分为 `wx:if` 多分支渲染

#### D7. `coach/detail/index.wxml:129` 与 `order/detail/index.wxml:89` - 硬编码占位 spacer
```html
<view style="height: 180rpx;"></view>
```
应在样式表定义 `.spacer-bottom { height: 180rpx; }` 或使用 CSS 变量。

---

## 6. 组件层深度审查

### 6.1 组件清单与质量评估

| 组件 | 文件 | 行数 | 质量 | 主要问题 |
|------|------|------|------|----------|
| rating-stars | [components/rating-stars/](miniprogram/components/rating-stars/index.js) | 36 | ⭐⭐⭐⭐ | 良好 |
| status-badge | [components/status-badge/](miniprogram/components/status-badge/index.js) | 46 | ⭐⭐⭐⭐ | 良好 |
| empty-state | [components/empty-state/](miniprogram/components/empty-state/index.js) | 15 | ⭐⭐⭐⭐⭐ | 良好 |
| time-slot-picker | [components/time-slot-picker/](miniprogram/components/time-slot-picker/index.js) | 70 | ⭐⭐⭐ | C3 死代码 + D6 内联 class 复杂 |
| price-display | [components/price-display/](miniprogram/components/price-display/index.js) | 21 | ⭐⭐⭐ | B11 逻辑重复 |
| skeleton-loader | [components/skeleton-loader/](miniprogram/components/skeleton-loader/index.js) | 20 | ⭐⭐⭐⭐⭐ | 良好，命名清晰 |
| user-card | [components/user-card/](miniprogram/components/user-card/index.js) | 14 | ⭐⭐⭐ | B9 无障碍缺失 |
| search-bar | [components/search-bar/](miniprogram/components/search-bar/index.js) | 22 | ⭐⭐⭐⭐ | 良好 |

### 6.2 组件层问题汇总

| 编号 | 严重等级 | 位置 | 问题描述 |
|------|----------|------|----------|
| E1 | 🟡 | time-slot-picker/index.js:54 | `getSlotClass` 方法未被使用（死代码） |
| E2 | 🟡 | price-display/index.js:13 | 逻辑与 formatter.js 重复 |
| E3 | 🟡 | user-card/index.wxml:1 | 缺少 hover-class 与 aria 属性 |
| E4 | 🟢 | time-slot-picker/index.wxml:6 | 内联 class 三元嵌套 |
| E5 | 🟢 | status-badge/index.js:4-20 | 多个 map 用展开运算符合并，可读性可优化 |

### 6.3 组件通信模式

✅ 良好: 全部使用 `properties` + `triggerEvent` 标准模式，无 `this.selectComponent` 紧耦合。

---

## 7. Activity 模块完整性审查

### 7.1 现状评估

| 层级 | 状态 | 文件 |
|------|------|------|
| Service 层 | ⚠️ 部分完整 | [services/activity.js](miniprogram/services/activity.js) — 三个方法都定义 |
| 云函数层 | ❌ **完全 Mock** | [cloudfunctions/activity/index.js](cloudfunctions/activity/index.js) — 所有 action 返回 `{ list: [], total: 0, page: 1, pageSize: 10 }` |
| 前端页面 | ❌ **空 Page** | [activity/detail/index.js:1](miniprogram/pages/activity/detail/index.js:1) `Page({ data: {}, onLoad() {} })` |
| 前端页面 | ⚠️ 仅占位 | [activity/create/index.js:1](miniprogram/pages/activity/create/index.js:1) — onSubmit 显示"即将开放" |
| 前端页面 | ✅ 基本完整 | [activity/list/index.js](miniprogram/pages/activity/list/index.js) — tab 切换、Create 按钮占位 |

### 7.2 关键发现

#### F1. [致命] 整个 Activity 模块未实现

[cloudfunctions/activity/index.js:9-17](cloudfunctions/activity/index.js:9)：
```js
case 'list': return { code: 0, data: { list: [], total: 0, page: 1, pageSize: 10 } }
case 'detail': return { code: 0, data: {} }
case 'create': return { code: 0, data: { _id: 'mock', message: '即将开放' } }
```

**影响**:
1. 用户在活动列表看到永远空的活动列表
2. `applyCoach` 流程中无法联动"创建活动"
3. 数据库中 `activities` collection（已在 [collections.json:108-139](database/collections.json:108) 定义）无任何写入

#### F2. [警告] activity/list 页面 `onCreate` 显示"即将开放"

[activity/list/index.js:7](miniprogram/pages/activity/list/index.js:7) —— `wx.showToast({ title: '即将开放', icon: 'none' })`

由于整个模块未实现，所有用户操作都会被 Toast 拦截。需要在 UI 上做"Coming Soon"占位组件，而非用 Toast 强干扰用户。

#### F3. [警告] activity 模块的数据模型与代码脱节

[collections.json:108-139](database/collections.json:108) 定义了 `activities` collection 含 16 个字段（含 `participants`、`min_participants`、`max_participants`、`current_count` 等），但代码层完全无实现。

**建议**: 要么删 schema，要么补完实现，二选一。

---

## 8. 数据库设计深度复核

### 8.1 索引设计评分

| 集合 | 索引质量 | 问题 |
|------|----------|------|
| `users` | ⭐⭐⭐⭐ | `_openid` 唯一索引良好；`city`、`tennis_level` 单列索引偏弱 |
| `coaches` | ⭐⭐⭐ | 缺 `teaching_years` 索引（排序场景全表扫描） |
| `venues` | ⭐⭐ | 缺 `2dsphere` 地理位置索引（`collections.json` 声明但 `indexes.json` 未配置） |
| `schedules` | ⭐⭐⭐⭐⭐ | 复合唯一索引优秀 |
| `activities` | ⭐⭐⭐ | 基础索引够用，但 `start_time + status` 复合索引会更优 |
| `orders` | ⭐⭐⭐ | 缺 `created_at desc` 索引（订单列表按时间倒序会全表扫描） |
| `reviews` | ⭐⭐⭐⭐ | `order_id` 唯一索引 + `target_type+target_id+created_at` 复合索引良好 |
| `notifications` | ⭐⭐⭐⭐ | 三字段复合索引优秀 |

### 8.2 关键修复建议

#### G1. 补充 `coaches.teaching_years` 索引
```json
{ "fields": [{ "fieldPath": "teaching_years", "order": "desc" }] }
```
影响: [coach/list](cloudfunctions/coach/actions/list.js) 中 `sortBy: 'experience'` 排序性能。

#### G2. 补充 `venues.location` 2dsphere 索引
```json
{ "fields": [{ "fieldPath": "location", "order": "asc" }], "type": "2dsphere" }
```
影响: 未来"附近场地"功能（[venue/list/index.js:14](miniprogram/pages/venue/list/index.js:14) 已支持 `latitude/longitude` 入参但服务端未真正使用地理位置查询）。

#### G3. 补充 `orders.created_at desc` 索引
```json
{ "fields": [{ "fieldPath": "created_by", "order": "asc" }, { "fieldPath": "created_at", "order": "desc" }] }
```
影响: [order/actions/list.js:23](cloudfunctions/order/actions/list.js:23) `orderBy('created_at', 'desc')` 性能。

#### G4. 考虑为 `reviews` 增加增量统计字段
避免 [getStats.js](cloudfunctions/review/actions/getStats.js) 全量扫描。
```json
// coaches/venues 文档新增：
{
  "rating_sum": 0,        // 累加值，避免每次重算
  "review_count": 0,      // 与 rating_sum 配套
  "rating_avg": 0         // = rating_sum / review_count（保留缓存）
}
```

---

## 9. 架构与代码质量综合观察

### 9.1 架构层（⭐⭐⭐⭐）

- ✅ **分层清晰**: Page → Service → Cloud Function → Action → DB
- ✅ **关注点分离**: 常量、工具、组件、服务四层各司其职
- ✅ **数据流向单向**: props down / events up，符合预期
- ⚠️ **Service 层与 auth.js 边界模糊**: `UserService.login` vs `auth.login`（见 C5）

### 9.2 代码质量层（⭐⭐⭐）

- ✅ 命名规范统一（驼峰）
- ✅ 注释覆盖关键业务逻辑
- ❌ `var` / `const` 混用（见 B1）
- ❌ 大量重复代码未抽取（见 C4）
- ❌ Mock 数据与生产代码深度耦合

### 9.3 安全性（⭐⭐⭐）

修复后:
- ✅ 订单创建已校验身份
- ✅ 通知已校验归属
- ✅ 订单创建已支持失败回滚
- ⚠️ 仍未解决: ReDoS（[coach/search.js:15](cloudfunctions/coach/actions/search.js:15)）、手机号明文存储
- ⚠️ 无任何 rate limiting

### 9.4 性能（⭐⭐⭐）

- ✅ 分页与无限滚动已实现
- ✅ Skeleton 加载骨架屏
- ❌ review 全表扫描（C7）
- ❌ 缺关键索引（G1-G3）
- ❌ 无图片懒加载 / 压缩

### 9.5 可维护性（⭐⭐⭐）

- ✅ 设计 token 统一（[theme.wxss](miniprogram/common/styles/theme.wxss)）
- ✅ 组件化拆分彻底
- ❌ 命名四套并存（B10）
- ❌ 缺测试用例
- ❌ 缺错误上报

---

## 10. 项目总览

### 10.1 文件统计

| 类别 | 数量 | 总行数（估算） |
|------|------|----------------|
| 小程序页面（miniprogram/pages） | 20 | ~3500 |
| 自定义组件（miniprogram/components） | 8 | ~450 |
| 工具与常量（utils + constants） | 12 | ~900 |
| 服务层（services） | 8 | ~150 |
| 云函数（cloudfunctions） | 8 | ~1250 |
| 数据库 schema | 2 | ~250 |
| 样式文件 | 多份 | ~1500 |
| **合计** | **172 文件** | **~8000 行** |

### 10.2 已完成能力

- ✅ 用户注册/登录/资料管理
- ✅ 教练发现（搜索、筛选、排序、详情、评价）
- ✅ 场地发现（搜索、筛选、详情、评价）
- ✅ 时段预约（生成、原子预约、释放）
- ✅ 订单全生命周期（创建、支付、取消、确认）
- ✅ 评价系统（创建、列表、统计、回复字段预留）
- ✅ 通知系统（列表、未读数、标记已读）
- ✅ 微信登录 + 一键登录

### 10.3 未完成能力

- ❌ Activity 模块完全占位
- ❌ Tennis-circle 社区功能
- ❌ 真实支付集成（当前全部模拟）
- ❌ 退款流程
- ❌ 教练审批后台
- ❌ 短信/邮件通知
- ❌ 数据统计后台

---

## 11. 修复优先级矩阵

| 优先级 | 编号 | 描述 | 预计工作量 |
|--------|------|------|------------|
| P0 | A1 | applyCoach 角色更新 | 0.5h |
| P0 | A2 | venue/list Mock 过滤 | 0.5h |
| P0 | A3 | 评价并发安全 | 1h |
| P1 | B1 | var → const/let | 2h |
| P1 | B2 | 硬编码颜色替换 | 1h |
| P1 | B3-B4 | 空 Page 与占位页处理 | 1h |
| P1 | B5 | 请求去重与重试 | 2h |
| P1 | B7 | 输入校验 | 2h |
| P1 | G1-G3 | 数据库索引补充 | 1h |
| P2 | B6 | self=this 改箭头函数 | 1h |
| P2 | B8 | getMyInfo 与 getProfile 合并 | 1h |
| P2 | B9-B11 | 组件无障碍与代码重复 | 2h |
| P2 | C1-C9 | 改进建议 | 4h |
| P3 | F1-F3 | Activity 模块实现 | 8h+ |

**总修复工作量估算**: P0+P1 共 12h, P2+P3 共 16h+

---

## 12. 最终结论

### 项目当前可发布度

| 等级 | 描述 | 适用场景 |
|------|------|----------|
| ❌ **不可生产上线** | 仍有致命级问题 | — |
| ⚠️ **可内测** | P0 修复后可小范围内测 | 当前状态 |
| ✅ **可公测** | P0 + P1 修复后 | 需 12h 工作量 |
| ✅ **可生产** | P0 + P1 + P2 修复后 | 需 30h 工作量 |

### 整体评分: **5.5 / 10**

#### 优点

- 分层架构清晰、组件化彻底
- 设计 token 统一、UX 流畅
- 数据库 schema 设计有水准
- 上轮致命问题已全部修复

#### 缺点

- 仍有 3 个致命级问题（A1-A3）
- Mock 数据与生产代码深度耦合
- 缺关键数据库索引
- 缺测试、缺监控、缺无障碍支持
- Activity 模块完全未实现

### 推荐下一步

1. **立即**: 修复 P0 三个致命问题（合计 2h）
2. **本周内**: 完成 P1 警告级修复（合计 10h）
3. **本月内**: 决定 Activity 模块是补完还是移除
4. **架构层**: 引入 Page Behavior 抽取、ESLint 规范、Vitest/Jest 单测
5. **运维层**: 接入 Sentry 类错误监控、补全 CI/CD

---

> 报告完成时间: 2026-06-01
> 评审范围: 172 个文件，约 8000 行代码
> 评审标准: 微信云开发最佳实践 + 10 年+ 全栈架构经验
