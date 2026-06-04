# Spec Lock — TennisVibe 项目介绍 PPT

> 🔒 **FROZEN** — Step 5 output. Every SVG page MUST look up colors / fonts / sizes here.
> DO NOT modify after Step 5. Any change requires a new spec lock.

## 1. Canvas

```
viewBox: 0 0 1280 720
unit: px
slide_size: 1280 × 720 (16:9)
outer_margin: { top: 64, right: 64, bottom: 56, left: 64 }
content_box: { x: 64, y: 64, w: 1152, h: 600 }
footer_band: { x: 64, y: 660, w: 1152, h: 32 }
```

## 2. Color Tokens (唯一来源)

```
primary:        #B8E600
primary-dim:    #E6F7C8
dark:           #1F2A37
dark-2:         #161F2A
text:           #333333
muted:          #777777
bg:             #FAFAF7
white:          #FFFFFF
accent:         #2D6CDF
accent-dim:     #E3EDFB
warning:        #FF8A00
warning-dim:    #FFE7C2
danger:         #E0394B
rule:           #E5E5E0
```

## 3. Typography Tokens

```
font-cjk:    "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif
font-latin:  "Inter", "Helvetica Neue", Arial, sans-serif
font-mono:   "JetBrains Mono", "Consolas", monospace

cover-h1:    font-cjk, 88px, weight=700
h1:          font-cjk, 36px, weight=700
h2:          font-cjk, 22px, weight=600
h3:          font-cjk, 18px, weight=600
body:        font-cjk, 14px, weight=400
small:       font-cjk, 11px, weight=400
code:        font-mono, 12px, weight=400
big-number:  font-latin, 56px, weight=700
```

## 4. Spacing & Shape

```
card-radius:        12
card-padding:       24
gutter:             24
title-bar-height:   56
section-pill:       h=24, radius=12, padding=0 12
risk-pill:          w=70, h=22, radius=11
```

## 5. Decoration Rules

- 主色细线 1-2 px 段章区隔，禁区：emoji
- 数字圈号 ①②③ 等 Unicode 仅作序号用途
- 风险徽章 = 圆角矩形 + 白字 + `--warning` 或 `--danger` 底
- 进度条高度 8 px，圆角 4 px
- 卡片 stroke 仅在 white 底卡片出现，1 px `--rule`
- 不使用阴影（避免导出 PPTX 时体积膨胀）

## 6. Page Numbering Footer

```
text:  "TennisVibe · 网球生态小程序项目介绍"
right: "{NN} / 12"
font:  small (11px), color: muted
position: y=672, x=64 / x=1080
```

## 7. Section Pill (页眉)

```
shape:   rect 4 × 24 (圆角 2)
color:   primary
text:    "{NN} / 11"  Microsoft YaHei 14px white
gap:     16 px → H1 标题
rule:    bottom line 1px primary, x=64→1216, y=64
```

## 8. Page-by-Page Lookups

| Page | File | Rhythm | primary-color usage | icon style |
|---|---|---|---|---|
| 01 | page_001_cover.svg | anchor | 装饰线、网环、左侧竖条 | tennis-rings |
| 02 | page_002_background.svg | breathing | 痛点卡标题底色、目标圆点 | 序号圈 |
| 03 | page_003_positioning.svg | breathing | 角色卡描边、生态关系引线 | 角色图标 |
| 04 | page_004_techstack.svg | breathing | 段落标题底色、列表短条 | — |
| 05 | page_005_architecture.svg | dense | 模块块底色、箭头 | 模块标号 |
| 06 | page_006_business_flow.svg | anchor | 步骤方块、连线、约定面板 | 序号 |
| 07 | page_007_coach_loop.svg | breathing | 流程短条、设计点底 | — |
| 08 | page_008_data_model.svg | dense | 表名左侧色条 | — |
| 09 | page_009_dir_structure.svg | dense | 段标题底 | — |
| 10 | page_010_progress.svg | anchor | 进度条、徽章 | ✓/⚠ |
| 11 | page_011_roadmap.svg | anchor | 阶段大卡底色 | 三角箭头 |
| 12 | page_012_risks_summary.svg | breathing | 风险等级色条 | — |

## 9. Hard Rules (per skill spec)

1. 每写一页前 `read_file` 本文件
2. 所有颜色 / 字体 / 数值必须查表，不允许"凭印象"
3. SVG 手写，不允许 Python/Node 脚本批量生成
4. 一次一页，连续推进
5. 文件命名 `page_NNN_<slug>.svg`
