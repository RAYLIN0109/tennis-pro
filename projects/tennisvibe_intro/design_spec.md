# Design Spec — TennisVibe 项目介绍 PPT

> Strategist output (Step 4 confirmation). Freeze baseline for Executor.
> **Source materials**: `CLAUDE.md` (project knowledge base), `docs/phase1-plan.md`, `docs/phase2-plan.md`, `docs/phase3-plan.md`, `miniprogram/app.json`, `database/collections.json`.
> **Conversation language**: 简体中文 (matches user input).
> **Format**: PPT 16:9, 1280×720 viewBox, 12 pages.

## 1. Project Brief

| 字段 | 值 |
|---|---|
| 项目名 | TennisVibe（tennis-eco） |
| 类型 | 微信小程序 + 微信云开发 |
| 入口 | `miniprogram/`，云函数根 `cloudfunctions/` |
| AppID | `wxd78e98cafe1dff67` |
| 基础库 | 3.3.4+ |
| 风格 | sport-tech, clean, calm |

## 2. Color Scheme

> Role-bound palette. All SVG colors must come from this table — no ad-hoc values.

| Token | Hex | Role | Usage |
|---|---|---|---|
| `--primary` | `#B8E600` | 主色 / 强调 | 进度条、强调色块、图标、装饰线 |
| `--primary-dim` | `#E6F7C8` | 主色弱化 | 卡片底色、徽章背景 |
| `--dark` | `#1F2A37` | 深色 | 封面背景、标题字 |
| `--dark-2` | `#161F2A` | 深色变体 | 封面色块叠加 |
| `--text` | `#333333` | 正文 | 段落、列表项 |
| `--muted` | `#777777` | 弱化 | 注释、副标题 |
| `--bg` | `#FAFAF7` | 背景 | 全局画布底 |
| `--white` | `#FFFFFF` | 反白 | 卡片底、深底字 |
| `--accent` | `#2D6CDF` | 蓝 | 二级强调、链接、章节色（Phase 2） |
| `--accent-dim` | `#E3EDFB` | 蓝弱化 | 蓝徽章底 |
| `--warning` | `#FF8A00` | 橙 | 风险、缺口、未完成 |
| `--warning-dim` | `#FFE7C2` | 橙弱化 | 风险徽章底 |
| `--danger` | `#E0394B` | 红 | 高风险标识 |
| `--rule` | `#E5E5E0` | 分隔线 | 卡片描边、分割 |

## 3. Typography

| Role | CJK Font | Latin / Number | Size | Weight |
|---|---|---|---|---|
| 大标题 (Cover H1) | Microsoft YaHei | Inter | 88 px | 700 |
| H1 (Section Title) | Microsoft YaHei | Inter | 36 px | 700 |
| H2 (Subsection) | Microsoft YaHei | Inter | 22 px | 600 |
| H3 (Card Title) | Microsoft YaHei | Inter | 18 px | 600 |
| Body | Microsoft YaHei | Inter | 14 px | 400 |
| Small / Caption | Microsoft YaHei | Inter | 11 px | 400 |
| Code / Mono | — | JetBrains Mono | 12 px | 400 |
| Number (Big) | — | Inter | 56 px | 700 |

> Microsoft YaHei is system-available on Windows; falls back to PingFang SC on macOS / Noto Sans CJK on Linux. Spec lists YaHei as canonical.

## 4. Canvas & Grid

| Property | Value |
|---|---|
| Slide size | 1280 × 720 px (16:9) |
| Outer margin | 64 px (left/right/top), 56 px (bottom) |
| Content width | 1152 px |
| Grid columns | 12 |
| Gutter | 24 px |
| Card radius | 12 px |
| Card padding | 24 px |
| Title bar height | 56 px |
| Footer height | 32 px |

## 5. Visual Tone

- **Mood**: sport-tech 干净利落，留白充足
- **Density**:
  - `breathing` (default, 6 pages) — 单卡 1 个核心点 + 2-3 行说明
  - `anchor` (5 pages) — 多卡 / 大图 / 满版，承担视觉锚点
  - `dense` (1 page) — 表格/列表/多指标对比
- **Icon style**: 线性 1.5 px stroke，圆角端点，色 = `--primary` 或 `--dark`
- **Decoration**: 主色细线条（1-2 px）做章节区隔；禁止使用 emoji 表情符号（部分页面已含数字圈号 ① ② 等 Unicode 字符，仅作为序号用途）
- **Voice**: 理性、专业；避免营销词

## 6. Page Rhythm Map

| Page | Title | Rhythm | Layout Hint |
|---|---|---|---|
| 01 | 封面 | anchor | 深色满版 + 主色装饰 + 大标题 |
| 02 | 项目背景 | breathing | 3 痛点卡 + 目标列表 |
| 03 | 产品定位 | breathing | 3 角色卡 + 生态关系说明 |
| 04 | 技术栈 | breathing | 3 段（前端/后端/工具链） |
| 05 | 总体架构 | dense | 端→云函数→数据库 三段 + 注解 |
| 06 | 核心业务流程 | anchor | 6 步骤横排 + 数据约定面板 |
| 07 | 关键模块·教练闭环 | breathing | 流程左 / 设计点右 |
| 08 | 数据模型 | dense | 8 集合卡片网格 |
| 09 | 项目目录结构 | dense | 3 段（miniprogram/cloudfunctions/database） |
| 10 | 当前完成度 | anchor | 进度条 8 行 + 亮点/缺口 |
| 11 | 阶段路线图 | anchor | 3 阶段大卡 + 箭头 |
| 12 | 风险 & 总结 | breathing | 6 风险卡 + 收尾 |

## 7. Image Generation

**OFF**. 全部使用 icon + 几何 + 进度条 + 文字版式表达。无 AI 配图。

## 8. Speaker Notes (Optional)

OFF. 当前 batch 不生成旁白。

## 9. Constraints Reminder

- 所有颜色/字体/图标只能来自本 spec
- 每页生成前必须 `read_file spec_lock.md`
- 一次一页面 SVG，禁止批量生成
- 文件命名 `page_NNN_<slug>.svg`
- 输出目录 `svg_output/`
