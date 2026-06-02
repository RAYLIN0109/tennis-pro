# D:\workspace\vb 项目知识库

> 本文件由代码反推得出，作为新会话的架构锚点。如与代码不一致，以代码为准并提交 PR 修订本文。

## 1. 项目概况

- 名称：`tennis-eco`（Tennis Ecosystem WeChat Mini Program）
- 技术栈：微信小程序 + 微信云开发（云函数 + 云数据库）
- 基础库：`libVersion 3.3.4`（`project.config.json`）
- AppID：`wxd78e98cafe1dff67`
- 入口配置：`miniprogramRoot: miniprogram/`，`cloudfunctionRoot: cloudfunctions/`
- 当前迭代：约教练 MVP（申请 / 审核 / 选角色 闭环）
- 编辑器：缩进 2 空格（`editorSetting.tabSize: 2`）
- 关键约定：金额一律以「分（cents）」存储与传输；时间字段混合使用 `Date` / `YYYY-MM-DD` / `{ start, end }`

## 2. 目录结构

```
D:\workspace\vb\
├── miniprogram/                   # 小程序前端
│   ├── app.js                     # 启动 + wx.cloud.init + silentLogin
│   ├── app.json                   # 21 个页面 + 3 个 tabBar
│   ├── common/
│   │   ├── mock-data.js           # 无云环境时的兜底数据
│   │   └── constants/             # 业务枚举（user / coach / order / venue / activity）
│   ├── components/                # 8 个自定义组件
│   │                              # rating-stars / status-badge / empty-state / price-display
│   │                              # skeleton-loader / user-card / search-bar / time-slot-picker
│   ├── pages/                     # 21 个页面，统一四件套
│   │   ├── index/                 # 首页
│   │   ├── tennis-circle/         # tabBar：网球圈
│   │   ├── coach/                 # list / detail / book
│   │   ├── activity/              # list / detail / create
│   │   ├── order/                 # list / detail
│   │   ├── review/                # create / list
│   │   └── user/                  # login / profile / edit-profile / settings
│   │                              # select-role / coach-apply / privacy / agreement
│   ├── services/                  # 8 个 service，封装云函数调用
│   └── utils/                     # request / auth / date / validator / formatter / location / payment
├── cloudfunctions/                # 8 个云函数
│   ├── user/{index.js, actions/}                  # login / getProfile / updateProfile / getMyInfo
│   ├── coach/{index.js, actions/}                 # list / detail / search / applyCoach / approve / reject / getMyStatus
│   ├── order/{index.js, actions/}                 # create / detail / list / pay / cancel / confirm
│   ├── review/{index.js, actions/}                # create / list / getStats / myList
│   ├── schedule/{index.js, actions/}              # getSchedule / generateSchedule / bookSlot / releaseSlot
│   ├── venue/{index.js, actions/}                 # list / detail / search
│   ├── activity/index.js                          # 占位：list / detail / create 均返回 mock
│   └── notification/index.js                      # list / markRead / unreadCount（无 actions 拆分）
└── database/
    ├── collections.json           # 8 张集合的字段 + 索引定义
    ├── indexes.json
    └── init-data/
```

## 3. 命名规范

| 层级 | 约定 | 示例 |
| --- | --- | --- |
| 云函数 | 小写单数名词 | `user` / `coach` / `order` / `review` / `schedule` / `venue` / `activity` / `notification` |
| 云函数入口 | `exports.main = async (event, context)`，内部 `switch (event.action)` | — |
| 云函数 action 文件 | 文件名 = 动作；默认导出 `async (db, OPENID?, event?)` | `applyCoach.js` / `getMyStatus.js` |
| Service | 暴露 `XxxService` 对象；方法语义对应云函数 action | `CoachService.getList / apply` |
| 页面 | `pages/<domain>/<page>/{index.js, index.json, index.wxml, index.wxss}` | `pages/coach/list/index.js` |
| 业务常量 | 全部大写枚举对象 + 配套 `_MAP`（label/color） | `ORDER_STATUS` / `ORDER_STATUS_MAP` |
| 金额字段 | `*_rate` / `*_amount` / `price` 一律「分」 | `hourly_rate: 30000` = 300 元 |
| 时间 | `Date` / `YYYY-MM-DD` / `{ start:'HH:mm', end:'HH:mm' }` 三种形态 | `schedules.date` / `slots.start_time` |

## 4. 关键模块

| 模块 | 前端入口 | 云函数 | 职责 |
| --- | --- | --- | --- |
| 用户 | `pages/user/*`、`utils/auth.js` | `user` | 登录 / 资料 / 我的信息 / 角色（user / coach / venue_owner） |
| 教练 | `pages/coach/*`、`pages/user/coach-apply` | `coach` | 列表 / 详情 / 搜索 / 申请 / 审核（approve / reject）/ 我的状态 |
| 排期 | `pages/coach/book` 复用 | `schedule` | 通用时段表（教练 / 场地），含生成、占用、释放 |
| 订单 | `pages/order/*` | `order` | 创建 / 详情 / 列表 / 支付 / 取消 / 确认完成 |
| 评价 | `pages/review/*` | `review` | 创建 / 列表 / 统计 / 我的评价 |
| 场地 | （页面未实现） | `venue` | 列表 / 详情 / 搜索（仅读，无写） |
| 活动 | `pages/activity/*` | `activity` | **占位**，云函数全部返回 mock |
| 通知 | （无独立页面） | `notification` | 列表 / 标记已读 / 未读数 |
| Venue | `pages/venue` 未实现 | `venue` | 同样只读 |

## 5. 跨端调用约定

### 5.1 请求协议（`miniprogram/utils/request.js`）

```js
// 入口
const { request, get, post } = require('../utils/request')

// 用法
get('coach', 'list', { city: '上海' }, { showError: false })        // 静默查询
post('coach', 'applyCoach', payload, '提交中...')                   // 主动写
```

- `get(name, action, data, options)`：默认 `showLoading: false`、`showError: true`
- `post(name, action, data, loadingText)`：默认 `showLoading: true`、`showError: true`
- 实际代码约定：列表 / 详情 / 搜索等**只读**接口，前端传 `showError: false`（静默失败时降级到 mock）；**写操作**用 `post()` 走 loading + 错误提示
- 底层：`wx.cloud.callFunction({ name, data: { action, ...data } })`

### 5.2 响应协议

```js
// 成功
{ code: 0, data: { ... } }
// 失败
{ code: <number>, message: '...' }
```

`request.js` 行为：`code === 0` 时 `resolve(result.data)`；否则 `reject(Error)` 并附 `err.code`。

### 5.3 错误码约定

| code | 含义 | 出处示例 |
| --- | --- | --- |
| 0 | 成功 | 所有 action |
| 9001 | 未知 action | 所有云函数 `default` 分支 |
| 9002 | 缺少 / 非法参数 | `applyCoach.js`、`order/create.js` 等 |
| 9999 | 服务器异常 | 所有 `catch (err)` |
| 2001 | 业务冲突（如重复申请） | `coach/applyCoach.js` |
| 5001 | 资源不存在 / 无权操作 | `notification/markRead` |

## 6. 关键数据约定

- `users._openid`：云开发自动注入，唯一索引
- `coaches.user_id`：逻辑外键 → `users._openid`，唯一索引
- `coaches.status`：`pending` / `active` / `suspended`（见 `constants/coach.js:COACH_STATUS`）
- `orders.status`：`pending_payment` / `paid` / `completed` / `cancelled` / `refunded` / `reviewed`
- `orders.order_type`：`coach_booking` / `venue_booking`
- `reviews.order_id` 唯一（一单一评）
- `reviews.target_type`：`coach` / `venue` / `activity`
- `schedules.resource_type`：`coach` / `venue`（排期表多态）
- `activities.type`：`coach_booking` / `venue_booking` / `pickup_game` / `watch_party`

## 7. 已知 TODO / 占位 / 不一致

> 来自 `git status` 与代码扫描，不是猜测。

- **活动模块完全占位**：`cloudfunctions/activity/index.js` 的 `list` / `detail` / `create` 全部直接 `return { code: 0, data: ...mock }`；前端 `pages/activity/*` 走的是 mock 降级路径
- **首页"约球"功能未实现**：`miniprogram/pages/index/index.js:85` 的 `goMatch()` 仅 `wx.showToast({ title: '即将开放' })`
- **教练列表 / 详情兜底 mock**：`pages/coach/list/index.js:73-81`、`pages/coach/detail/index.js:57-60` 在云函数失败时降级到 `common/mock-data.js`
- **mock-data 整体保留**：`miniprogram/common/mock-data.js` 顶部注释「接入云环境后可删除此文件」
- **通知 / 活动云函数未拆 actions**：`cloudfunctions/notification/index.js` 与 `cloudfunctions/activity/index.js` 把所有 action 内联在 `switch` 里，与 `user` / `coach` / `order` / `review` / `schedule` / `venue` 的 `actions/` 拆分风格不一致
- **场地无写操作**：`cloudfunctions/venue` 只有 `list` / `detail` / `search`；`pages/venue` 页面尚未实现
- **服务层 `showError` 默认值不一致**：`coach.js` 显式传 `showError: false`，`order.js` / `review.js` 不传（走 `get` 默认 `true`）；列表/详情类应统一为 `showError: false`（配合 mock 降级）

## 8. 开发约定（建议默认遵循）

- 新增云函数 action：先在 `cloudfunctions/<mod>/actions/<actionName>.js` 落文件，再在 `index.js` 的 `switch` 注册
- 新增页面：放 `pages/<domain>/<page>/` 下，登记到 `app.json` 的 `pages` 数组
- 新增枚举：放 `miniprogram/common/constants/<mod>.js`，并在 `constants/index.js` re-export
- 金额字段：永远存「分」；展示时除以 100，保留 2 位小数
- 写接口统一走 `post()`，读接口统一走 `get()` 且显式传 `showError: false`
- 云函数失败 fallback：先静默降级到 `mock-data.js`，再 `wx.showToast` 提示

## 9. 关键文件索引

- 请求封装：`miniprogram/utils/request.js:14`
- 登录 & openid 入口：`miniprogram/app.js:27`
- 用户态工具：`miniprogram/utils/auth.js`
- 错误码基线：`miniprogram/utils/request.js:36` + 各云函数 `default` 分支
- 排期 / 订单数据形状：`database/collections.json:93-176`
