# 约教练模块 · 一期开发设计文档

> **文档编号**: VIBE-01
> **版本**: 1.0
> **创建日期**: 2026-06-02
> **适用范围**: 微信云开发小程序 · 全方位网球生态 · 约教练模块一期

---

## 1. 背景与目标

### 1.1 项目背景

"**全方位网球生态**" 微信小程序基于**微信云开发（CloudBase）**构建，核心服务包括：
- **云函数**（Cloud Functions）—— 全部后端逻辑
- **云数据库**（Cloud Database）—— 数据持久化
- **云存储**（Cloud Storage）—— 媒体资源

项目当前聚焦"**约教练**"核心功能，后续扩展"约球友 / 约看比赛"。采用数据库**高扩展性多态设计**：
- `activities` 表通过 `type` 字段复用（coach_booking / pickup_game / watch_party）
- `schedules` 统一管理排期（resource_type = coach / venue）
- `orders` 统一对接支付
- `reviews` 统一承载评价

### 1.2 一期目标

构建"**学员 → 申请教练 → 审核 → 教练列表可见 → 学员约课**"完整闭环的最小可行版本（MVP）。

---

## 2. 设计原则

| 原则 | 说明 |
|---|---|
| **无本地角色存储** | `role` 以云数据库 `users.role: string[]` 为唯一事实来源，禁止 `wx.setStorageSync('user_role', ...)` |
| **服务器校验** | 即使前端做了校验，云函数也要 **再做一次校验** |
| **状态与 schema 对齐** | `coaches.status` 仅用 `pending / active / suspended`（与 `database/collections.json` 一致），不另造值 |
| **Service 层统一请求** | 所有云函数调用走 `services/*.js`，使用 `post()` 包裹写操作（继承 Loading 提示） |
| **表单防重** | 所有提交按钮必须 `disabled + wx.showLoading({ mask: true })`，禁止双击触发两次 |
| **复用已有产物** | `CoachService` 已有 `getList/getDetail/search`，云函数 `applyCoach` 已实现 |

---

## 3. 用户角色与状态机

### 3.1 角色定义

```
users.role: string[]    // 支持双角色，默认 ['user']
  └─ 'user'           // 学员（默认，登录时自动获得）
  └─ 'coach'          // 教练（申请 + 审核通过后由云函数写入）
  └─ 'venue_owner'    // 场地主（由云函数写入，本模块不直接操作）
```

### 3.2 教练状态机

```
                      ┌─────────────────┐
           applyCoach  │    pending      │  admin approve
        ┌──────────────►  (审核中)        ├──────────────────┐
        │              └────┬────────────┘                  │
        │                   │ admin suspend/                 │
        │   re-apply        │ reject                        ▼
        │                   ▼                     ┌─────────────────┐
  ┌─────┴─────┐    ┌─────────────────┐           │     active       │
  │ suspended │    │   suspended     │           │  (已通过·展示)    │
  │ (已停用)   │◄───│ (被驳回/停用)   │           └─────────────────┘
  └───────────┘    └─────────────────┘
```

- `pending`：用户已提交申请，等待管理员审核。教练列表**不可见**。
- `active`：审核通过。**出现在教练列表**（`list.js` 过滤 `status: 'active'`）。
- `suspended`：被驳回 / 停用。教练列表不可见。用户可**重新申请**（走 `applyCoach` 更新）。

> **注意**：schema 目前状态只有 `pending / active / suspended`，**没有独立的 `rejected`**。被驳回也用 `suspended`，管理员可附带驳回原因写入 `coaches.reject_reason` 字段。

### 3.3 角色判断入口——何时弹 `select-role`

```
进入 App (index page onShow)
  │
  ├─ 1. 调 getMyInfo() 获取 role
  │
  ├─ 2. 若 role 不含 'coach'
  │    │
  │    ├─ coaches 表中无该 user_id 记录 → 显示 select-role
  │    └─ coaches 表中 status === 'suspended' → 显示"认证已被驳回/停用" + 重新申请入口
  │
  └─ 3. 若 role 含 'coach'
       │
       ├─ coaches.status === 'pending' → 显示"审核中···"占位
       └─ coaches.status === 'active' → 回归首页正常浏览
```

---

## 4. 文件清单

### 4.1 新增文件

| 文件 | 说明 |
|---|---|
| `miniprogram/pages/user/coach-apply/index.js` | 教练申请页 JS |
| `miniprogram/pages/user/coach-apply/index.wxml` | 教练申请页 WXML |
| `miniprogram/pages/user/coach-apply/index.wxss` | 教练申请页 WXSS |
| `miniprogram/pages/user/coach-apply/index.json` | 教练申请页 JSON |
| `cloudfunctions/coach/actions/approve.js` | 管理员审核通过 |
| `cloudfunctions/coach/actions/reject.js` | 管理员驳回 |

### 4.2 修改文件

| 文件 | 修改内容 |
|---|---|
| `miniprogram/app.json` | 注册 `pages/user/select-role/index` 和 `pages/user/coach-apply/index` |
| `miniprogram/pages/user/select-role/index.js` | **完全重写**（删除 `wx.setStorageSync`，基于 `getMyInfo` 驱动） |
| `miniprogram/pages/user/select-role/index.wxml` | 新增 UI 布局 |
| `miniprogram/pages/user/select-role/index.wxss` | 新增样式 |
| `miniprogram/services/coach.js` | 新增 `apply(data)` 方法 |
| `miniprogram/pages/index/index.js` | `onShow` 增加角色引导逻辑（提调 select-role） |
| `miniprogram/pages/user/profile/index.js` | 新增"我的教练认证"区块 + 状态徽标 + 重新申请入口 |
| `miniprogram/pages/user/profile/index.wxml` | 新增认证区 UI |
| `miniprogram/pages/user/profile/index.wxss` | 新增认证区样式 |
| `cloudfunctions/coach/actions/applyCoach.js` | 移除 `suspended` 阻隔（允许重新申请）、增加 city 字段存储 |

---

## 5. 数据模型

### 5.1 现有表（不用改结构）

#### `users` 集合（关键字段）

```
role:        string[]       // ['user'] | ['user', 'coach'] | ['user', 'venue_owner']
status:      string         // 'active' | 'banned'
phone:       string         // encrypted
city:        string
```

#### `coaches` 集合（完整字段 —— 来自 `database/collections.json`）

```
user_id:              string          // FK → users._id（unique index）
real_name:            string
specialties:          string[]        // 标签数组
certifications:       string[]        // cloud fileIDs（证书图片）
certification_labels: string[]        // 证书名称
teaching_years:       number
hourly_rate:          number          // cents
trial_rate:           number          // cents（体验课价格）
bio:                  string
photos:               string[]        // cloud fileIDs
service_areas:        array<object>   // 服务区域
venue_ids:            string[]        // 关联场地
rating:               number          // 0-5
review_count:         number
total_students:       number
status:               string          // pending | active | suspended
city:                 string          // 教练所属城市（从 user.city 复制后独立维护）
reject_reason:        string          // 驳回原因（新增字段，一期先不写 schema 文件）
created_at:           Date
updated_at:           Date
```

> **关于 `city` 字段**：`database/collections.json` 的 `coaches` 字段列表中未显式列出，但 `indexes.json` 有 `(status, city)` 联合索引，且 `list.js` 查询使用了 `condition.city`。一期在 `applyCoach` 中写入 `city: user.city`，确保索引生效。

### 5.2 表关系

```
users ──1:0..1── coaches (user_id)
  │
  └── reviews (created_by)
  │
  └── orders (created_by)

coaches ──1:N── reviews (target_type='coach', target_id=coach_id)
  └── schedules (resource_type='coach', resource_id=coach_id)
```

---

## 6. 接口设计

### 6.1 Service 层

#### `services/coach.js`（追加方法）

```js
// 在现有 getList / getDetail / search 基础上新增：
apply(data) {
  return post('coach', 'applyCoach', data, '提交中...')
},
getMyCoachStatus() {
  return get('coach', 'getMyStatus')
}
```

### 6.2 云函数

#### 6.2.1 `coach/applyCoach`（已存在，需微调）

| 参数 | 类型 | 必填 | 校验 |
|---|---|---|---|
| `real_name` | string | ✓ | 2–20 字符，汉字为主 |
| `phone` | string | ✓ | `^1[3-9]\d{9}$` |
| `specialties` | string[] | ✓ | 至少 1 项 |
| `teaching_years` | number | ✓ | 0–50 整数 |
| `hourly_rate` | number | ✓ | 0–10000 |
| `trial_rate` | number | ✗ | 0–10000 |
| `bio` | string | ✗ | max 500 |
| `certification_labels` | string[] | ✗ | 证书名称 |
| `certifications` | string[] | ✗ | cloud fileIDs |
| `photos` | string[] | ✗ | cloud fileIDs，≤ 9 张 |
| `service_areas` | array<object> | ✗ | `[{ city, district }]` |
| `venue_ids` | string[] | ✗ | 关联场地 ID |

**返回**: `{ code: 0, data: { _id } }`

**现有代码已覆盖上述字段**，只需做以下微调：
1. 允许 `status === 'suspended'` 时重新申请（目前只允许 `suspended` 重新申请，这是正确的，保持不变）
2. 增加 `city` 写入：从 `users` 表查出 `city`，写入 `coaches.city`

#### 6.2.2 `coach/approve`（新增）

```js
// cloudfunctions/coach/actions/approve.js
module.exports = async function approve(db, openid, event) {
  const { coachId } = event

  // 1. 权限：调用者 role 含 'admin'
  const { data: users } = await db.collection('users').where({ _openid: openid }).get()
  if (!users[0]?.role?.includes('admin')) {
    return { code: 5001, message: '无权限' }
  }

  // 2. 更新 coaches 状态
  await db.collection('coaches').doc(coachId).update({
    data: { status: 'active', updated_at: new Date() }
  })

  // 3. 确认用户 role 包含 coach
  const coach = (await db.collection('coaches').doc(coachId).get()).data
  await db.collection('users').where({ _openid: coach.user_id }).update({
    data: { role: db.command.addToSet('coach'), updated_at: new Date() }
  })

  // 4. 发通知
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

#### 6.2.3 `coach/reject`（新增）

```js
// cloudfunctions/coach/actions/reject.js
module.exports = async function reject(db, openid, event) {
  const { coachId, reason } = event

  // 1. 权限检查（同 approve）
  const { data: users } = await db.collection('users').where({ _openid: openid }).get()
  if (!users[0]?.role?.includes('admin')) {
    return { code: 5001, message: '无权限' }
  }

  if (!reason) {
    return { code: 9002, message: '请填写驳回原因' }
  }

  // 2. 更新 coaches 状态
  await db.collection('coaches').doc(coachId).update({
    data: {
      status: 'suspended',
      reject_reason: reason,
      updated_at: new Date()
    }
  })

  // 3. 发通知
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

#### 6.2.4 `coach/getMyStatus`（新增）

```js
// cloudfunctions/coach/actions/getMyStatus.js
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

#### 6.2.5 `coach/index.js` 路由注册（追加 action）

在 `switch (event.action)` 中追加：
```js
case 'getMyStatus':
  return await require('./actions/getMyStatus')(db, OPENID)
case 'approve':
  return await require('./actions/approve')(db, OPENID, event)
case 'reject':
  return await require('./actions/reject')(db, OPENID, event)
```

---

## 7. 页面与组件设计

### 7.1 `select-role` 页面（角色选择）

**路由**: `pages/user/select-role/index`

**触发时机**: 首页 `index.js` 的 `onShow` 中判断（见 §8 关键流程）

**UI 布局**（参考设计线框）:
```
┌──────────────────────────┐
│      TennisVibe          │
│                          │
│   请选择您的身份           │
│                          │
│  ┌──────────────────┐    │
│  │    🎾             │    │
│  │   我是学员         │    │
│  │   开始约教练       │    │
│  └──────────────────┘    │
│                          │
│  ┌──────────────────┐    │
│  │    🎾             │    │
│  │   我是教练         │    │
│  │   创建教练主页     │    │
│  └──────────────────┘    │
└──────────────────────────┘
```

**JS 逻辑**（重写要点）:
```js
Page({
  data: {
    userInfo: null
  },

  onLoad() {
    // 获取当前用户信息（头像、昵称展示）
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

**样式**（设计规范）:
- 主色 `#B8E600`（TennisVibe 绿），文字 `#333333`
- 两个大卡片，圆角 16rpx，阴影 `0 4rpx 20rpx rgba(0,0,0,0.08)`
- 卡片间距 32rpx

---

### 7.2 `coach-apply` 页面（教练申请表单）

**路由**: `pages/user/coach-apply/index`

**UI 布局**:
```
┌──────────────────────────────────────────┐
│  教练认证申请                 [提交]      │
├──────────────────────────────────────────┤
│                                          │
│  必填信息                                │
│  ┌──────────────────────────────────┐   │
│  │ 真实姓名 *        [ 请输入姓名 ]  │   │
│  ├──────────────────────────────────┤   │
│  │ 手机号 *          [ 请输入手机号 ] │   │
│  ├──────────────────────────────────┤   │
│  │ 教学经验 *        [ 请选择年限 ▾ ] │   │
│  ├──────────────────────────────────┤   │
│  │ 每小时费用 *      [ 请输入价格 ]  │   │
│  ├──────────────────────────────────┤   │
│  │ 特长标签 *        [+ 添加标签]   │   │
│  │  [青少年] [成人] [进阶]          │   │
│  └──────────────────────────────────┘   │
│                                          │
│  选填信息                                │
│  ┌──────────────────────────────────┐   │
│  │ 体验课价格         [ 请输入价格 ]  │   │
│  ├──────────────────────────────────┤   │
│  │ 个人简介           [ 请输入... ]  │   │
│  ├──────────────────────────────────┤   │
│  │ 资质证书           [+ 上传证书]  │   │
│  │  [证书名] [证书名]              │   │
│  ├──────────────────────────────────┤   │
│  │ 个人照片           [+ 上传照片]  │   │
│  │  [📷] [📷] [📷]               │   │
│  ├──────────────────────────────────┤   │
│  │ 服务区域           [+ 添加区域]  │   │
│  │  [北京·朝阳] [上海·浦东]        │   │
│  └──────────────────────────────────┘   │
│                                          │
│  □ 我已阅读并同意《教练入驻协议》         │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │          提交申请                │   │
│  └──────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

**JS 核心逻辑**:

```js
const CoachService = require('../../../services/coach')

Page({
  data: {
    // 表单数据
    real_name: '',
    phone: '',
    teaching_years: 0,
    hourly_rate: '',
    trial_rate: '',
    bio: '',
    specialties: [],           // string[]
    certification_labels: [],  // string[]
    certifications: [],        // cloud fileIDs
    photos: [],                // cloud fileIDs
    service_areas: [],         // [{ city, district }]

    // UI 状态
    submitting: false,
    agreed: false,
    errors: {}                 // 字段错误信息
  },

  onLoad(options) {
    // 如果是从 profile 的"重新申请"进入，options.mode === 'edit'
    if (options.mode === 'edit') {
      this.loadExistingData()
    }
  },

  // === 表单校验 ===
  validate() {
    const errors = {}
    const { real_name, phone, specialties, teaching_years, hourly_rate } = this.data

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
  async onSubmit() {
    if (!this.validate()) return
    if (this.data.submitting) return

    this.setData({ submitting: true })
    wx.showLoading({ title: '提交中...', mask: true })

    try {
      const formData = {
        real_name: this.data.real_name,
        phone: this.data.phone,
        specialties: this.data.specialties,
        teaching_years: this.data.teaching_years,
        hourly_rate: Math.round(this.data.hourly_rate * 100),  // cents
        trial_rate: Math.round((this.data.trial_rate || 0) * 100),
        bio: this.data.bio,
        certification_labels: this.data.certification_labels,
        certifications: this.data.certifications,
        photos: this.data.photos,
        service_areas: this.data.service_areas
      }

      const res = await CoachService.apply(formData)
      wx.hideLoading()

      if (res.code === 0) {
        wx.showToast({ title: '提交成功', icon: 'success' })
        // 延时 1.5s 后返回首页
        setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 1500)
      } else if (res.code === 2001) {
        wx.showModal({
          title: '提示',
          content: '您已提交过教练申请，请耐心等待审核',
          showCancel: false,
          success: () => wx.switchTab({ url: '/pages/index/index' })
        })
      } else {
        wx.showModal({
          title: '提交失败',
          content: res.message || '请稍后重试',
          showCancel: false
        })
      }
    } catch (err) {
      wx.hideLoading()
      wx.showModal({
        title: '网络错误',
        content: '请检查网络后重试',
        showCancel: false
      })
    } finally {
      this.setData({ submitting: false })
    }
  },

  // === 图片上传 ===
  async uploadPhoto() {
    const { tempFiles } = await wx.chooseMedia({ count: 1, mediaType: ['image'] })
    // 上传到 cloud storage
    const result = await wx.cloud.uploadFile({
      cloudPath: `coach_photos/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`,
      filePath: tempFiles[0].tempFilePath
    })
    const photos = [...this.data.photos, result.fileID]
    this.setData({ photos })
  },

  // === 图片删除 ===
  removePhoto(e) {
    const idx = e.currentTarget.dataset.index
    const photos = [...this.data.photos]
    photos.splice(idx, 1)
    this.setData({ photos })
  },

  // === 标签管理 ===
  addSpecialty(e) {
    const tag = e.currentTarget.dataset.tag
    if (!this.data.specialties.includes(tag)) {
      this.setData({ specialties: [...this.data.specialties, tag] })
    }
  },

  removeSpecialty(e) {
    const idx = e.currentTarget.dataset.index
    const specialties = [...this.data.specialties]
    specialties.splice(idx, 1)
    this.setData({ specialties })
  }
})
```

**预置特长标签**（预设，可自定义）:
```js
const PRESET_TAGS = ['青少年', '成人', '初学者', '进阶', '双打', '体能', '备战比赛']
```

---

### 7.3 `index` 首页（角色引导追加）

**文件**: `miniprogram/pages/index/index.js`

在 `onShow` 中追加：

```js
onShow() {
  this.checkRoleGuide()  // 新增
  getMyInfo().catch(() => {})
  this.loadRecommendCoaches()
},

checkRoleGuide() {
  const { get } = require('../../utils/request')
  get('coach', 'getMyStatus').then(res => {
    if (!res.has_apply) {
      // 从未申请过 → 跳选择角色页（首次引导）
      wx.navigateTo({ url: '/pages/user/select-role/index' })
    } else if (res.coach.status === 'pending') {
      // 审核中
      wx.showToast({ title: '教练认证审核中...', icon: 'none' })
    } else if (res.coach.status === 'suspended') {
      // 被驳回/停用
      wx.showModal({
        title: '教练认证状态',
        content: `您的教练认证已被${res.coach.reject_reason ? '驳回：' + res.coach.reject_reason : '停用'}。`,
        confirmText: '重新申请',
        success: ({ confirm }) => {
          if (confirm) wx.navigateTo({ url: '/pages/user/coach-apply/index?mode=edit' })
        }
      })
    }
  }).catch(() => {})
}
```

> **说明**：`checkRoleGuide` 封装了"是否需要展示教练引导"的全部逻辑（§3.3 状态机）。用户已是 `active` 教练时直接返回，不做任何弹窗。

---

### 7.4 `profile` 个人中心（认证区块）

**文件**: `miniprogram/pages/user/profile/index.js`

在 `loadProfile` 方法后追加，加载教练状态并渲染认证区块。

**WXML 新增区块**（插在现有内容上方）:

```xml
<!-- 教练认证区块 -->
<view wx:if="{{coachInfo && coachInfo.has_apply}}" class="coach-cert-card">
  <view class="cert-header">
    <text class="cert-title">我的教练认证</text>
  </view>

  <!-- pending：审核中 -->
  <block wx:if="{{coachInfo.coach.status === 'pending'}}">
    <view class="cert-badge badge-pending">
      <text>审核中，请耐心等待</text>
    </view>
  </block>

  <!-- active：已通过 -->
  <block wx:if="{{coachInfo.coach.status === 'active'}}">
    <view class="cert-badge badge-active">
      <text>已认证</text>
    </view>
  </block>

  <!-- suspended：被驳回/停用 -->
  <block wx:if="{{coachInfo.coach.status === 'suspended'}}">
    <view class="cert-badge badge-suspended">
      <text>认证状态：{{coachInfo.coach.reject_reason || '已停用'}}</text>
    </view>
    <button class="btn-reapply" bindtap="goReapply">重新申请</button>
  </block>
</view>
```

**JS 追加**:
```js
goReapply() {
  wx.navigateTo({ url: '/pages/user/coach-apply/index?mode=edit' })
}
```

**样式**（状态色）:
- `pending` 灰 `#999999`
- `active` 绿 `#B8E600`（主色）
- `suspended` 橙 `#FF9500`

---

## 8. 关键流程

### 8.1 首次用户 → 教练审核通过

```
1. 用户首次打开小程序 → login() 写入 role: ['user']
                                ↓
2. 首页 index.js  onShow → checkRoleGuide()
   getMyStatus 返回 { has_apply: false }
                                ↓
3. navigateTo → select-role 页面
   - 点"我是学员" → switchTab 回首页（无需任何操作）
   - 点"我是教练" → navigateTo coach-apply
                                ↓
4. coach-apply 页面
   - 填写表单 → 点击"提交申请"
   - CoachService.apply(data) → cloud/coach/applyCoach
   - applyCoach: 写入 coaches { status: 'pending', ... }
   - 返回成功 → switchTab 回首页
                                ↓
5. 管理员通过 approve 云函数
   - coaches.status = 'active'
   - users.role = addToSet('coach')
   - notifications 发通过通知
                                ↓
6. 教练列表 list.js 过滤 status='active' → 该教练出现
```

### 8.2 被驳回 → 重新申请

```
1. 用户 profile 页 → "我的教练认证"区块 → status='suspended' → 驳回原因 + "重新申请"
                              ↓
2. navigateTo → coach-apply/index?mode=edit
                              ↓
3. applyCoach 云函数（existing.length > 0 && status === 'suspended'）
   → 更新已有记录，status 重置为 'pending'
   → 再次 addToSet('coach')（幂等操作）
```

### 8.3 已认证教练再次进入

```
首页 index.js onShow → checkRoleGuide()
  → getMyStatus 返回 { has_apply: true, coach: { status: 'active' } }
  → 跳过引导，正常使用
```

---

## 9. 字段校验规则（完整版）

| 字段 | 客户端校验 | 云函数校验 |
|---|---|---|
| `real_name` | 2-20 字符，非空 | 同客户端 |
| `phone` | `^1[3-9]\d{9}$` | 同客户端 |
| `specialties` | 数组长度 ≥ 1 | 同客户端 |
| `teaching_years` | 0-50 整数 | 同客户端 |
| `hourly_rate` | 1-10000 数字 | 同客户端 + 转 cents |
| `trial_rate` | 0-10000 数字（可选） | 同客户端 |
| `bio` | max 500 字符 | max 500 字符 |
| `certification_labels` | max 10 项 | max 10 项 |
| `certifications` | 每项是 cloud fileID | 每项是 cloud fileID |
| `photos` | ≤ 9 张，cloud fileIDs | ≤ 9 张，cloud fileIDs |
| `service_areas` | 数组，每项 `{ city, district }` | 同客户端 |

---

## 10. 验收标准

| 编号 | 验收项 | 预期结果 |
|---|---|---|
| AC1 | 新用户进入 → 选"我是学员" | 直接进入首页，role 保持 `['user']` |
| AC2 | 新用户进入 → 选"我是教练" | 跳转申请页 |
| AC3 | 填写完整表单 → 提交 | 成功写入 coaches（status=pending），role 含 `coach` |
| AC4 | 必填字段任一为空 → 提交 | 红色错误提示，不外发请求 |
| AC5 | 提交中 → 再次点击 | 按钮禁用，不触发第二次请求 |
| AC6 | 管理员调用 approve | coaches.status=active，列表可搜索到 |
| AC7 | 管理员调用 reject + 原因 | coaches.status=suspended，用户 profile 页显示驳回原因 |
| AC8 | rejected 用户 → profile → 重新申请 | 预填已有资料，更新记录 status=pending |
| AC9 | active 教练再次进入 App | 不弹 select-role，正常浏览 |
| AC10 | select-role 和 coach-apply 已在 app.json 注册 | 无"页面不存在"错误 |

---

## 11. 任务拆分（Phase 1）

### Task 1：`app.json` 注册新页面
- 文件：`miniprogram/app.json`
- 在 `pages` 数组追加 `pages/user/select-role/index` 和 `pages/user/coach-apply/index`

### Task 2：重写 `select-role` 页面
- 文件：`miniprogram/pages/user/select-role/index.{js,wxml,wxss}`
- 删除 `wx.setStorageSync`，改为纯导航逻辑
- UI：两个卡片按钮

### Task 3：构建 `coach-apply` 页面
- 文件：`miniprogram/pages/user/coach-apply/index.{js,wxml,wxss,json}`
- 4 必填 + 4 选填表单
- 图片上传（chooseMedia + uploadFile）
- 预置标签选择
- 表单校验 + 防重提交
- 协议勾选

### Task 4：`CoachService` 追加方法
- 文件：`miniprogram/services/coach.js`
- 新增 `apply(data)`, `getMyCoachStatus()`

### Task 5：首页角色引导（`checkRoleGuide`）
- 文件：`miniprogram/pages/index/index.js`
- `onShow` 中判断是否需要弹 `select-role`

### Task 6：个人中心认证区块
- 文件：`miniprogram/pages/user/profile/index.{js,wxml,wxss}`
- "我的教练认证"卡片 + 状态徽标 + 重新申请按钮

### Task 7：微调 `applyCoach` 云函数
- 文件：`cloudfunctions/coach/actions/applyCoach.js`
- 增加 `city` 从 `users` 表复制
- 确保 `suspended` 状态允许重新申请

### Task 8：新增 `approve` 云函数
- 文件：`cloudfunctions/coach/actions/approve.js`
- 权限校验 + 状态更新 + 通知

### Task 9：新增 `reject` 云函数
- 文件：`cloudfunctions/coach/actions/reject.js`
- 权限校验 + 驳回原因 + 通知

### Task 10：新增 `getMyStatus` 云函数
- 文件：`cloudfunctions/coach/actions/getMyStatus.js`
- 返回当前用户教练信息

### Task 11：`cloudfunctions/coach/index.js` 路由注册
- 追加 `getMyStatus`, `approve`, `reject` 三个 case

### Task 12：联调 + 验收
- 按 §10 验收标准逐项测试

---

## 12. 风险与依赖

| 风险 | 影响 | 缓解 |
|---|---|---|
| 管理员角色未建立 | `approve`/`reject` 无人能调 | 一期先超管手工改库，二期建管理后台 |
| `coaches.city` 字段与实际不符 | 按城市筛选失效 | `applyCoach` 中从 `users.city` 复制 |
| 图片上传并发量大 | 云存储超限 | 单次最多 9 张，并行 `Promise.all` |
| 微信隐私政策要求 | personal_info 收集需 consent | 勾选协议 + 一期硬编码隐私声明 |

---

## 13. 附录

### A. 教练入驻协议（占位）

```
miniprogram/common/text/coach-agreement.md

## 教练入驻协议（一期占位）

1. 您承诺所提交的姓名、资质、证件、照片等信息真实有效。
2. 平台有权审核并决定是否通过您的教练认证。
3. 认证通过后，您发布的课程、价格等信息须符合平台规范。
4. 平台保留暂停或撤销教练认证的权利。

更多条款详见完整版《网球生态用户协议》。
```

### B. 设计规范速查

| 变量 | 值 |
|---|---|
| 主色 | `#B8E600` |
| 主文字 | `#333333` |
| 次文字 | `#999999` |
| 背景 | `#F5F5F5` |
| 卡片圆角 | `16rpx` |
| 卡片阴影 | `0 4rpx 20rpx rgba(0,0,0,0.08)` |
| 状态-pending | `#999999` |
| 状态-active | `#B8E600` |
| 状态-suspended | `#FF9500` |

### C. 数据库 Schema 变更（一期）

**不新建集合**。仅 `coaches` 集合可能出现新字段：

| 字段 | 类型 | 说明 | 操作 |
|---|---|---|---|
| `city` | string | 教练所属城市 | 写入已有字段（索引已存在） |
| `reject_reason` | string | 驳回原因 | 一期不写 `collections.json`，二期统补 |

### D. 与现有模块的关系

```
本模块（约教练）
  依赖──→ coaches 集合（已存在）
  依赖──→ users 集合（已存在）
  依赖──→ notifications 集合（已存在）
  依赖──→ reviews 集合（target_type='coach'）
  依赖──→ schedules 集合（resource_type='coach'）
  依赖──→ orders 集合（order_type='coach_booking'）
  使用──→ activities 集合（type='coach_booking'，二期）

暂不涉及──→ venues 集合（约场地模块，已排除）
```

---

> **文档结束**。请按 §11 任务拆分顺序开发。如有问题参见 `CODE_REVIEW_REPORT.md` 了解已知问题清单。
