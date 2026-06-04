"""
Generate TennisVibe Project Introduction PPT
网球生态小程序项目介绍 PPT 生成脚本
"""
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.ns import qn
from copy import deepcopy
from lxml import etree

# ================= 主题色（网球绿） =================
COLOR_PRIMARY   = RGBColor(0xB8, 0xE6, 0x00)   # 主题绿
COLOR_DARK      = RGBColor(0x1F, 0x2A, 0x37)   # 深灰
COLOR_TEXT      = RGBColor(0x33, 0x33, 0x33)   # 正文
COLOR_MUTED     = RGBColor(0x77, 0x77, 0x77)   # 弱化文字
COLOR_BG        = RGBColor(0xFA, 0xFA, 0xF7)   # 背景
COLOR_WHITE     = RGBColor(0xFF, 0xFF, 0xFF)
COLOR_ACCENT    = RGBColor(0x2D, 0x6C, 0xDF)   # 蓝
COLOR_ORANGE    = RGBColor(0xFF, 0x8A, 0x00)
COLOR_GREEN_LT  = RGBColor(0xE6, 0xF7, 0xC8)


# ================= 工具函数 =================
def set_slide_bg(slide, color):
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = color


def add_text(slide, left, top, width, height, text,
             font_size=18, bold=False, color=COLOR_TEXT,
             align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, font="Microsoft YaHei"):
    tb = slide.shapes.add_textbox(left, top, width, height)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.05)
    tf.margin_right = Inches(0.05)
    tf.margin_top = Inches(0.02)
    tf.margin_bottom = Inches(0.02)
    tf.vertical_anchor = anchor
    if isinstance(text, str):
        lines = text.split("\n")
    else:
        lines = text
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        run = p.add_run()
        run.text = line
        run.font.size = Pt(font_size)
        run.font.bold = bold
        run.font.color.rgb = color
        run.font.name = font
        # 同时设置中文字体
        rPr = run._r.get_or_add_rPr()
        eastAsia = rPr.find(qn('a:ea'))
        if eastAsia is None:
            eastAsia = etree.SubElement(rPr, qn('a:ea'))
        eastAsia.set('typeface', font)
    return tb


def add_rect(slide, left, top, width, height, fill_color, line_color=None):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill_color
    if line_color is None:
        shape.line.fill.background()
    else:
        shape.line.color.rgb = line_color
        shape.line.width = Pt(0.75)
    shape.shadow.inherit = False
    return shape


def add_rounded(slide, left, top, width, height, fill_color):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill_color
    shape.line.fill.background()
    shape.shadow.inherit = False
    # 调整圆角
    try:
        shape.adjustments[0] = 0.12
    except Exception:
        pass
    return shape


def add_title_bar(slide, title, subtitle=None):
    """统一标题栏：左侧色块 + 标题文字"""
    add_rect(slide, Inches(0.5), Inches(0.45), Inches(0.12), Inches(0.55), COLOR_PRIMARY)
    add_text(slide, Inches(0.75), Inches(0.4), Inches(10), Inches(0.5),
             title, font_size=28, bold=True, color=COLOR_DARK)
    if subtitle:
        add_text(slide, Inches(0.75), Inches(0.95), Inches(10), Inches(0.3),
                 subtitle, font_size=12, color=COLOR_MUTED)
    # 底部细线
    add_rect(slide, Inches(0.5), Inches(1.35), Inches(12.33), Inches(0.02), COLOR_PRIMARY)


def add_footer(slide, page_no, total):
    add_text(slide, Inches(0.5), Inches(7.05), Inches(8), Inches(0.3),
             "TennisVibe · 网球生态小程序项目介绍",
             font_size=9, color=COLOR_MUTED)
    add_text(slide, Inches(11.5), Inches(7.05), Inches(1.5), Inches(0.3),
             f"{page_no} / {total}", font_size=9, color=COLOR_MUTED, align=PP_ALIGN.RIGHT)


# ================= 幻灯片构建 =================
prs = Presentation()
prs.slide_width  = Inches(13.333)   # 16:9
prs.slide_height = Inches(7.5)
blank = prs.slide_layouts[6]
TOTAL = 14   # 计划页数（最后再校准）


# ---------- Slide 1: 封面 ----------
s = prs.slides.add_slide(blank)
set_slide_bg(s, COLOR_DARK)

# 装饰大色块
add_rect(s, Inches(0), Inches(0), Inches(13.333), Inches(7.5), COLOR_DARK)
add_rect(s, Inches(0), Inches(0), Inches(0.35), Inches(7.5), COLOR_PRIMARY)
add_rect(s, Inches(10.5), Inches(0), Inches(2.83), Inches(7.5), RGBColor(0x16, 0x1F, 0x2A))

# 圆形装饰
ring = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(8.6), Inches(0.7), Inches(4.2), Inches(4.2))
ring.fill.background()
ring.line.color.rgb = COLOR_PRIMARY
ring.line.width = Pt(4)

# 模拟网球纹路
for r, op in [(1.6, Pt(2)), (1.1, Pt(1.5))]:
    arc = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(8.6 + (4.2 - r)/2),
                             Inches(0.7 + (4.2 - r)/2), Inches(r), Inches(r))
    arc.fill.background()
    arc.line.color.rgb = COLOR_PRIMARY
    arc.line.width = op

# 主标题
add_text(s, Inches(0.8), Inches(2.2), Inches(10), Inches(1.0),
         "TennisVibe", font_size=64, bold=True, color=COLOR_PRIMARY)
add_text(s, Inches(0.8), Inches(3.2), Inches(10), Inches(0.6),
         "网球生态小程序 · 项目介绍",
         font_size=28, bold=True, color=COLOR_WHITE)

# 副标题
add_text(s, Inches(0.8), Inches(4.0), Inches(10), Inches(0.45),
         "WeChat Mini Program × Cloud Development · 体验闭环 + 交易闭环",
         font_size=16, color=COLOR_GREEN_LT)

# 信息条
add_rect(s, Inches(0.8), Inches(5.0), Inches(8.0), Inches(0.04), COLOR_PRIMARY)
add_text(s, Inches(0.8), Inches(5.2), Inches(8), Inches(0.35),
         "技术栈   微信小程序 · 微信云开发 · 云函数 · 云数据库",
         font_size=14, color=COLOR_WHITE)
add_text(s, Inches(0.8), Inches(5.6), Inches(8), Inches(0.35),
         "当前迭代   约教练 MVP 闭环完成 ｜ 活动/支付/管理后台 进入下一阶段",
         font_size=14, color=COLOR_WHITE)
add_text(s, Inches(0.8), Inches(6.0), Inches(8), Inches(0.35),
         "项目代号   tennis-eco  ｜  AppID  wxd78e98cafe1dff67",
         font_size=14, color=COLOR_WHITE)

add_text(s, Inches(0.8), Inches(6.85), Inches(8), Inches(0.3),
         "2026 · Project Briefing", font_size=10, color=COLOR_MUTED)


# ---------- Slide 2: 项目背景 ----------
s = prs.slides.add_slide(blank)
set_slide_bg(s, COLOR_BG)
add_title_bar(s, "01  项目背景", "为什么做 TennisVibe？")

# 痛点三栏
pain_points = [
    ("找教练难", "信息分散在朋友圈/微信群\n缺乏统一的教练库与评价体系"),
    ("约场地难", "档期、价格、可用时段不透明\n排期冲突频发"),
    ("建圈子难", "球友匹配低效\n活动组织缺少数字化工具"),
]
x0 = 0.5
w  = 4.1
gap = 0.05
for i, (h, body) in enumerate(pain_points):
    x = Inches(x0 + i * (w + gap))
    add_rounded(s, x, Inches(1.7), Inches(w), Inches(2.0), COLOR_WHITE)
    add_rect(s, x, Inches(1.7), Inches(w), Inches(0.5), COLOR_PRIMARY)
    add_text(s, x, Inches(1.75), Inches(w), Inches(0.4),
             h, font_size=18, bold=True, color=COLOR_DARK, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    add_text(s, x, Inches(2.4), Inches(w), Inches(1.3),
             body, font_size=13, color=COLOR_TEXT, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)

# 目标
add_rounded(s, Inches(0.5), Inches(4.0), Inches(12.33), Inches(2.7), COLOR_WHITE)
add_text(s, Inches(0.8), Inches(4.1), Inches(10), Inches(0.4),
         "🎯  项目目标", font_size=18, bold=True, color=COLOR_PRIMARY)
goals = [
    "打造网球教练 / 场地 / 活动 三位一体的微信生态小程序",
    "为球友提供「查 → 约 → 付 → 评」完整体验闭环",
    "沉淀结构化数据，逐步接入支付、运营、商家管理能力",
    "轻量起步：以微信云开发承载后端，零服务器运维成本",
]
for i, g in enumerate(goals):
    y = 4.55 + i * 0.5
    # 圆点
    dot = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(0.85), Inches(y + 0.1), Inches(0.15), Inches(0.15))
    dot.fill.solid()
    dot.fill.fore_color.rgb = COLOR_PRIMARY
    dot.line.fill.background()
    add_text(s, Inches(1.1), Inches(y), Inches(11), Inches(0.4),
             g, font_size=14, color=COLOR_TEXT, anchor=MSO_ANCHOR.MIDDLE)

add_footer(s, 2, TOTAL)


# ---------- Slide 3: 产品定位 ----------
s = prs.slides.add_slide(blank)
set_slide_bg(s, COLOR_BG)
add_title_bar(s, "02  产品定位", "三位一体的网球生态")

# 三大角色
roles = [
    ("球友 / User",
     "查找教练 · 预约时段\n下单支付 · 完成评价",
     "🏸"),
    ("教练 / Coach",
     "上架资料 · 管理排期\n接收订单 · 维护口碑",
     "👨‍🏫"),
    ("场地主 / Venue",
     "档期发布 · 订单管理\n(筹备中，二期接入)",
     "🏟"),
]
for i, (h, body, icon) in enumerate(roles):
    x = Inches(0.5 + i * 4.3)
    add_rounded(s, x, Inches(1.7), Inches(4.1), Inches(2.6), COLOR_WHITE)
    add_text(s, x, Inches(1.9), Inches(4.1), Inches(0.8),
             icon, font_size=44, align=PP_ALIGN.CENTER)
    add_text(s, x, Inches(2.8), Inches(4.1), Inches(0.4),
             h, font_size=18, bold=True, color=COLOR_DARK, align=PP_ALIGN.CENTER)
    add_text(s, x, Inches(3.25), Inches(4.1), Inches(1.0),
             body, font_size=13, color=COLOR_TEXT, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.TOP)

# 生态关系
add_rounded(s, Inches(0.5), Inches(4.55), Inches(12.33), Inches(2.2), COLOR_WHITE)
add_text(s, Inches(0.8), Inches(4.65), Inches(10), Inches(0.4),
         "🌐  生态关系：球友、教练、场地相互连接",
         font_size=18, bold=True, color=COLOR_PRIMARY)
add_text(s, Inches(0.8), Inches(5.1), Inches(11.5), Inches(1.5),
         "球友在 TennisVibe 内即可完成：浏览教练 → 选择时段 → 创建订单 → 微信支付 → 上场训练 → 课后评价。\n"
         "教练侧支持：申请入驻 → 平台审核 → 上架资料 → 维护排期 → 接收并完成订单。\n"
         "场地侧作为后续扩展角色，将共享同一套「排期 + 订单」原子能力，复用底层数据模型。",
         font_size=13, color=COLOR_TEXT)

add_footer(s, 3, TOTAL)


# ---------- Slide 4: 技术栈 ----------
s = prs.slides.add_slide(blank)
set_slide_bg(s, COLOR_BG)
add_title_bar(s, "03  技术栈", "微信原生 + 云开发一体化")

stack = [
    ("前端", "微信小程序原生框架",
     ["WXML + WXSS + JS(ES6+)", "21 个页面 / 3 个 tabBar", "8 个自定义组件", "基础库 3.3.4", "代码风格 2 空格缩进"]),
    ("后端", "微信云开发 (CloudBase)",
     ["云函数 8 个模块", "云数据库 NoSQL", "云存储（头像/图片）", "云调用 / 微信开放接口", "免运维、自动弹性"]),
    ("工具链", "开发 & 协作",
     ["微信开发者工具", "VSCode + 编辑器插件", "npm（云函数依赖）", "Git 版本管理", "Claude Code 协作"]),
]
for i, (h, sub, items) in enumerate(stack):
    x = Inches(0.5 + i * 4.3)
    add_rounded(s, x, Inches(1.7), Inches(4.1), Inches(5.0), COLOR_WHITE)
    add_rect(s, x, Inches(1.7), Inches(4.1), Inches(0.7), COLOR_PRIMARY)
    add_text(s, x, Inches(1.75), Inches(4.1), Inches(0.35),
             h, font_size=18, bold=True, color=COLOR_DARK, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    add_text(s, x, Inches(2.05), Inches(4.1), Inches(0.3),
             sub, font_size=11, color=COLOR_DARK, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    # 列表
    for j, it in enumerate(items):
        y = 2.6 + j * 0.65
        # 短色条
        add_rect(s, x + Inches(0.3), Inches(y + 0.1), Inches(0.08), Inches(0.4), COLOR_PRIMARY)
        add_text(s, x + Inches(0.5), Inches(y), Inches(3.5), Inches(0.6),
                 it, font_size=13, color=COLOR_TEXT, anchor=MSO_ANCHOR.MIDDLE)

add_footer(s, 4, TOTAL)


# ---------- Slide 5: 总体架构 ----------
s = prs.slides.add_slide(blank)
set_slide_bg(s, COLOR_BG)
add_title_bar(s, "04  总体架构", "端 → 云函数 → 云数据库 三层结构")

# 客户端大块
add_rounded(s, Inches(0.5), Inches(1.65), Inches(3.0), Inches(5.0), COLOR_WHITE)
add_rect(s, Inches(0.5), Inches(1.65), Inches(3.0), Inches(0.5), COLOR_PRIMARY)
add_text(s, Inches(0.5), Inches(1.7), Inches(3.0), Inches(0.4),
         "小程序端", font_size=16, bold=True, color=COLOR_DARK,
         align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
add_text(s, Inches(0.7), Inches(2.3), Inches(2.7), Inches(0.4),
         "Pages (21)", font_size=13, bold=True, color=COLOR_DARK)
add_text(s, Inches(0.7), Inches(2.7), Inches(2.7), Inches(1.6),
         "·  首页 / 网球圈 / 我的\n·  教练 列表·详情·预约\n·  活动 列表·详情·创建\n·  订单 列表·详情\n·  评价 创建·列表\n·  用户 登录·资料·设置",
         font_size=11, color=COLOR_TEXT)
add_text(s, Inches(0.7), Inches(4.5), Inches(2.7), Inches(0.4),
         "Components (8)", font_size=13, bold=True, color=COLOR_DARK)
add_text(s, Inches(0.7), Inches(4.9), Inches(2.7), Inches(1.6),
         "rating-stars · status-badge\nempty-state · price-display\nskeleton-loader · user-card\nsearch-bar · time-slot-picker",
         font_size=11, color=COLOR_TEXT)

# 中间：云函数
add_rounded(s, Inches(3.85), Inches(1.65), Inches(5.0), Inches(5.0), COLOR_WHITE)
add_rect(s, Inches(3.85), Inches(1.65), Inches(5.0), Inches(0.5), COLOR_PRIMARY)
add_text(s, Inches(3.85), Inches(1.7), Inches(5.0), Inches(0.4),
         "云函数层（8 模块 / 34 actions）", font_size=16, bold=True,
         color=COLOR_DARK, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)

cf_items = [
    ("user", "4 actions · 登录/资料"),
    ("coach", "7 actions · 申请/审核"),
    ("order", "6 actions · 创建/支付/取消"),
    ("review", "4 actions · 评价/统计"),
    ("schedule", "4 actions · 时段原子预约"),
    ("venue", "3 actions · 列表/详情/搜索"),
    ("activity", "3 actions · 占位中"),
    ("notification", "3 actions · 已读/未读"),
]
for i, (name, desc) in enumerate(cf_items):
    col = i % 2
    row = i // 2
    x = Inches(4.05 + col * 2.4)
    y = Inches(2.4 + row * 0.95)
    add_rounded(s, x, y, Inches(2.25), Inches(0.8), COLOR_GREEN_LT)
    add_text(s, x, y + Inches(0.05), Inches(2.25), Inches(0.35),
             name, font_size=13, bold=True, color=COLOR_DARK,
             align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    add_text(s, x, y + Inches(0.4), Inches(2.25), Inches(0.35),
             desc, font_size=10, color=COLOR_MUTED,
             align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)

# 右侧：数据库
add_rounded(s, Inches(9.2), Inches(1.65), Inches(3.65), Inches(5.0), COLOR_WHITE)
add_rect(s, Inches(9.2), Inches(1.65), Inches(3.65), Inches(0.5), COLOR_PRIMARY)
add_text(s, Inches(9.2), Inches(1.7), Inches(3.65), Inches(0.4),
         "云数据库 / 存储", font_size=16, bold=True, color=COLOR_DARK,
         align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
db_items = [
    "users · 用户档案",
    "coaches · 教练资料",
    "orders · 订单",
    "reviews · 评价",
    "schedules · 排期表（多态）",
    "venues · 场地",
    "activities · 活动",
    "notifications · 通知",
    "（含云存储：头像/认证图/评价图）",
]
for i, it in enumerate(db_items):
    y = 2.3 + i * 0.42
    add_text(s, Inches(9.4), Inches(y), Inches(0.15), Inches(0.3),
             "·", font_size=14, bold=True, color=COLOR_PRIMARY)
    add_text(s, Inches(9.55), Inches(y), Inches(3.2), Inches(0.35),
             it, font_size=12, color=COLOR_TEXT)

# 箭头注解
add_text(s, Inches(3.55), Inches(4.0), Inches(0.3), Inches(0.4),
         "→", font_size=24, bold=True, color=COLOR_PRIMARY,
         align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
add_text(s, Inches(8.9), Inches(4.0), Inches(0.3), Inches(0.4),
         "→", font_size=24, bold=True, color=COLOR_PRIMARY,
         align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
add_text(s, Inches(0.5), Inches(6.7), Inches(12), Inches(0.3),
         "调用链路：wx.cloud.callFunction({ name, data:{ action, ... } }) → 云函数 switch 路由 → actions/<name>.js → db.collection()",
         font_size=11, color=COLOR_MUTED, align=PP_ALIGN.CENTER)

add_footer(s, 5, TOTAL)


# ---------- Slide 6: 核心业务流程 ----------
s = prs.slides.add_slide(blank)
set_slide_bg(s, COLOR_BG)
add_title_bar(s, "05  核心业务流程", "球友下单 → 教练完成 → 课后评价")

steps = [
    ("① 浏览", "首页 / 教练列表\n筛选 / 搜索"),
    ("② 选时段", "time-slot-picker\n查看 30min 时段"),
    ("③ 下单", "创建订单\n原子占用排期"),
    ("④ 支付", "模拟支付\n(二期接入微信支付)"),
    ("⑤ 履约", "教练确认 / 用户到场\n确认完成"),
    ("⑥ 评价", "评分 + 文字 + 图片\n沉淀教练口碑"),
]
for i, (h, body) in enumerate(steps):
    x = Inches(0.4 + i * 2.15)
    add_rounded(s, x, Inches(2.0), Inches(2.0), Inches(2.0), COLOR_WHITE)
    add_text(s, x, Inches(2.1), Inches(2.0), Inches(0.5),
             h, font_size=18, bold=True, color=COLOR_PRIMARY,
             align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    add_text(s, x, Inches(2.7), Inches(2.0), Inches(1.2),
             body, font_size=11, color=COLOR_TEXT,
             align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    if i < len(steps) - 1:
        add_text(s, x + Inches(2.0), Inches(2.85), Inches(0.2), Inches(0.3),
                 "▶", font_size=16, bold=True, color=COLOR_PRIMARY)

# 关键数据约定
add_rounded(s, Inches(0.5), Inches(4.4), Inches(12.33), Inches(2.35), COLOR_WHITE)
add_text(s, Inches(0.8), Inches(4.5), Inches(10), Inches(0.4),
         "📌  关键数据约定（贯穿全链路）", font_size=16, bold=True, color=COLOR_PRIMARY)

conventions = [
    ("金额单位", "一律以「分（cents）」存储/传输；展示时 ÷ 100 保留两位小数"),
    ("时间格式", "Date / YYYY-MM-DD / { start:'HH:mm', end:'HH:mm' } 三种形态混用"),
    ("订单状态", "pending_payment → paid → completed → reviewed；cancelled / refunded 并列"),
    ("唯一性约束", "coaches.user_id、reviews.order_id（1 单 1 评）"),
    ("错误码", "0 成功 / 9001 未知 action / 9002 参数错 / 9999 服务器异常 / 2001 业务冲突"),
]
for i, (k, v) in enumerate(conventions):
    col = i % 2
    row = i // 2
    x = Inches(0.7 + col * 6.0)
    y = Inches(5.0 + row * 0.55)
    add_text(s, x, y, Inches(1.5), Inches(0.45),
             k, font_size=12, bold=True, color=COLOR_DARK, anchor=MSO_ANCHOR.MIDDLE)
    add_text(s, x + Inches(1.5), y, Inches(4.4), Inches(0.5),
             v, font_size=11, color=COLOR_TEXT, anchor=MSO_ANCHOR.MIDDLE)

add_footer(s, 6, TOTAL)


# ---------- Slide 7: 关键模块 · 教练闭环 ----------
s = prs.slides.add_slide(blank)
set_slide_bg(s, COLOR_BG)
add_title_bar(s, "06  关键模块 · 教练闭环", "申请 → 审核 → 选角色 全流程")

# 左侧：流程
add_rounded(s, Inches(0.5), Inches(1.6), Inches(6.0), Inches(5.1), COLOR_WHITE)
add_text(s, Inches(0.8), Inches(1.7), Inches(5.5), Inches(0.4),
         "🔁  教练入驻流程", font_size=16, bold=True, color=COLOR_PRIMARY)

flow = [
    "1. 用户在「我的」发起教练申请，填写资料 + 上传认证图片",
    "2. 云函数 coach/applyCoach 校验字段 + 去重（user_id 唯一）",
    "3. 状态置为 pending，等待平台审核",
    "4. 管理员在云开发控制台（或二期管理后台）调用 approve / reject",
    "5. 状态变为 active，通知模块推送结果给用户",
    "6. 教练可被球友在列表/搜索中检索到",
    "7. 球友选择教练 → 选择时段 → 创建订单",
    "8. 订单完成后产生评价，回写教练平均分",
]
for i, line in enumerate(flow):
    y = 2.2 + i * 0.55
    add_rect(s, Inches(0.8), Inches(y + 0.12), Inches(0.06), Inches(0.3), COLOR_PRIMARY)
    add_text(s, Inches(0.95), Inches(y), Inches(5.4), Inches(0.5),
             line, font_size=11.5, color=COLOR_TEXT, anchor=MSO_ANCHOR.MIDDLE)

# 右侧：关键设计点
add_rounded(s, Inches(6.7), Inches(1.6), Inches(6.13), Inches(5.1), COLOR_WHITE)
add_text(s, Inches(7.0), Inches(1.7), Inches(5.5), Inches(0.4),
         "💡  关键设计点", font_size=16, bold=True, color=COLOR_PRIMARY)
points = [
    ("状态机", "pending / active / suspended 三态；切换由云函数集中控制"),
    ("数据去重", "coaches.user_id 唯一索引 → 2001 业务冲突码 → 友好提示"),
    ("角色字段", "users.role 包含 user / coach / venue_owner / admin 多个"),
    ("审核权限", "云函数层强制校验 admin 角色；前端入口按角色显隐"),
    ("排期复用", "schedules 表以 resource_type(coach/venue) 多态承载"),
    ("评价回写", "review.create 走 db.runTransaction 保证评价与统计一致"),
]
for i, (k, v) in enumerate(points):
    y = 2.2 + i * 0.7
    add_text(s, Inches(7.0), Inches(y), Inches(1.4), Inches(0.4),
             k, font_size=12, bold=True, color=COLOR_DARK, anchor=MSO_ANCHOR.MIDDLE)
    add_text(s, Inches(8.4), Inches(y), Inches(4.3), Inches(0.6),
             v, font_size=11, color=COLOR_TEXT, anchor=MSO_ANCHOR.MIDDLE)

add_footer(s, 7, TOTAL)


# ---------- Slide 8: 数据模型 ----------
s = prs.slides.add_slide(blank)
set_slide_bg(s, COLOR_BG)
add_title_bar(s, "07  数据模型设计", "8 张核心集合（database/collections.json）")

tables = [
    ("users",     "用户档案",       "_openid, nickname, avatar, role, phone, created_at"),
    ("coaches",   "教练扩展资料",   "user_id→users, level, specialties[], hourly_rate, status, cert_imgs[]"),
    ("orders",    "订单",          "user_id, order_type, target_id, total_amount(分), status, schedule_slot"),
    ("reviews",   "评价",          "order_id(唯一), target_type, target_id, rating(1-5), content, images[]"),
    ("schedules", "排期（多态）",   "resource_type, resource_id, date, slots[{start,end,booked}])"),
    ("venues",    "场地",          "name, address, geo, price_per_hour, facilities[]"),
    ("activities","活动",          "type, title, start_time, location, max_players, fee, status"),
    ("notifications", "通知",      "user_id, type, title, content, read, created_at"),
]
for i, (tbl, zh, fields) in enumerate(tables):
    col = i % 2
    row = i // 2
    x = Inches(0.5 + col * 6.3)
    y = Inches(1.7 + row * 1.3)
    add_rounded(s, x, y, Inches(6.0), Inches(1.15), COLOR_WHITE)
    add_rect(s, x, y, Inches(0.15), Inches(1.15), COLOR_PRIMARY)
    add_text(s, x + Inches(0.3), y + Inches(0.08), Inches(2.5), Inches(0.4),
             tbl, font_size=15, bold=True, color=COLOR_DARK, anchor=MSO_ANCHOR.MIDDLE)
    add_text(s, x + Inches(2.3), y + Inches(0.1), Inches(3.6), Inches(0.35),
             zh, font_size=11, color=COLOR_MUTED, anchor=MSO_ANCHOR.MIDDLE)
    add_text(s, x + Inches(0.3), y + Inches(0.55), Inches(5.6), Inches(0.55),
             fields, font_size=10.5, color=COLOR_TEXT)

add_footer(s, 8, TOTAL)


# ---------- Slide 9: 项目目录结构 ----------
s = prs.slides.add_slide(blank)
set_slide_bg(s, COLOR_BG)
add_title_bar(s, "08  项目目录结构", "前端 / 云函数 / 数据库 三段式")

# 左侧 miniprogram
add_rounded(s, Inches(0.5), Inches(1.65), Inches(4.0), Inches(5.05), COLOR_WHITE)
add_rect(s, Inches(0.5), Inches(1.65), Inches(4.0), Inches(0.5), COLOR_PRIMARY)
add_text(s, Inches(0.5), Inches(1.7), Inches(4.0), Inches(0.4),
         "miniprogram/  小程序前端", font_size=14, bold=True,
         color=COLOR_DARK, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
mp_struct = [
    "app.js / app.json / app.wxss",
    "common/",
    "  ├── constants/  (5 个业务枚举)",
    "  ├── images/     (图标、tabBar)",
    "  ├── styles/     (theme / global)",
    "  ├── text/       (协议 markdown)",
    "  └── mock-data.js",
    "components/  (8 个自定义组件)",
    "pages/",
    "  ├── index/   tennis-circle/",
    "  ├── coach/   activity/",
    "  ├── order/   review/",
    "  └── user/    (login/profile/...)",
    "services/  (8 个 service 封装)",
    "utils/    (request/auth/date/...)",
]
for i, line in enumerate(mp_struct):
    y = 2.25 + i * 0.28
    add_text(s, Inches(0.7), Inches(y), Inches(3.7), Inches(0.3),
             line, font_size=10.5,
             color=COLOR_DARK if line.endswith("/") else COLOR_TEXT,
             bold=line.endswith("/"))

# 中间 cloudfunctions
add_rounded(s, Inches(4.65), Inches(1.65), Inches(4.0), Inches(5.05), COLOR_WHITE)
add_rect(s, Inches(4.65), Inches(1.65), Inches(4.0), Inches(0.5), COLOR_PRIMARY)
add_text(s, Inches(4.65), Inches(1.7), Inches(4.0), Inches(0.4),
         "cloudfunctions/  云函数", font_size=14, bold=True,
         color=COLOR_DARK, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
cf_struct = [
    "user/         index.js + actions/",
    "  ├── login.js  getProfile.js",
    "  ├── updateProfile.js  getMyInfo.js",
    "coach/        7 actions",
    "  ├── list/detail/search/applyCoach",
    "  └── approve/reject/getMyStatus",
    "order/        6 actions",
    "review/       4 actions",
    "schedule/     4 actions",
    "venue/        3 actions",
    "activity/     占位（内联）",
    "notification/ 占位（内联）",
    "统一风格: exports.main = (event)=>{",
    "  switch(event.action) { case ... } }",
]
for i, line in enumerate(cf_struct):
    y = 2.25 + i * 0.28
    add_text(s, Inches(4.85), Inches(y), Inches(3.7), Inches(0.3),
             line, font_size=10.5, color=COLOR_TEXT)

# 右侧 database
add_rounded(s, Inches(8.8), Inches(1.65), Inches(4.0), Inches(5.05), COLOR_WHITE)
add_rect(s, Inches(8.8), Inches(1.65), Inches(4.0), Inches(0.5), COLOR_PRIMARY)
add_text(s, Inches(8.8), Inches(1.7), Inches(4.0), Inches(0.4),
         "database/  数据库 & 文档", font_size=14, bold=True,
         color=COLOR_DARK, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
db_struct = [
    "collections.json",
    "  · 8 张集合 schema 定义",
    "  · 含字段类型 / 必填约束",
    "indexes.json",
    "  · 唯一索引: _openid, user_id",
    "  · 复合索引: status+created_at",
    "init-data/",
    "  ├── coaches.json  种子数据",
    "  └── venues.json   种子数据",
    "",
    "docs/  阶段规划",
    "  ├── phase1-plan.md  体验闭环",
    "  ├── phase2-plan.md  交易闭环",
    "  └── phase3-plan.md  运营闭环",
    "CLAUDE.md  项目知识库",
]
for i, line in enumerate(db_struct):
    y = 2.25 + i * 0.28
    add_text(s, Inches(9.0), Inches(y), Inches(3.7), Inches(0.3),
             line, font_size=10.5, color=COLOR_TEXT)

add_footer(s, 9, TOTAL)


# ---------- Slide 10: 当前完成度 ----------
s = prs.slides.add_slide(blank)
set_slide_bg(s, COLOR_BG)
add_title_bar(s, "09  当前完成度", "约教练 MVP 闭环 31/34 actions 已实现")

# 云函数完成度
modules = [
    ("user",         4, 4),
    ("coach",        7, 7),
    ("order",        6, 6),
    ("review",       4, 4),
    ("schedule",     4, 4),
    ("venue",        3, 3),
    ("notification", 3, 3),
    ("activity",     3, 0),
]
add_rounded(s, Inches(0.5), Inches(1.65), Inches(7.5), Inches(5.0), COLOR_WHITE)
add_text(s, Inches(0.8), Inches(1.75), Inches(6), Inches(0.4),
         "云函数模块完成度", font_size=16, bold=True, color=COLOR_PRIMARY)
for i, (m, total, done) in enumerate(modules):
    y = 2.25 + i * 0.5
    add_text(s, Inches(0.8), Inches(y), Inches(1.5), Inches(0.4),
             m, font_size=12, bold=True, color=COLOR_DARK, anchor=MSO_ANCHOR.MIDDLE)
    # 进度条背景
    bar_w = 4.0
    add_rect(s, Inches(2.4), Inches(y + 0.12), Inches(bar_w), Inches(0.2), RGBColor(0xEE, 0xEE, 0xEE))
    # 进度条
    pct = done / total if total else 0
    add_rect(s, Inches(2.4), Inches(y + 0.12),
             Inches(bar_w * pct), Inches(0.2),
             COLOR_ORANGE if done < total else COLOR_PRIMARY)
    add_text(s, Inches(6.6), Inches(y), Inches(1.2), Inches(0.4),
             f"{done} / {total}", font_size=12, bold=True,
             color=COLOR_DARK if done == total else COLOR_ORANGE,
             anchor=MSO_ANCHOR.MIDDLE)

# 汇总
add_text(s, Inches(0.8), Inches(6.3), Inches(7), Inches(0.4),
         "汇总：34 actions  ｜  31 已实现（91%）  ｜  3 占位（activity）",
         font_size=12, bold=True, color=COLOR_DARK)

# 右侧：亮点/缺口
add_rounded(s, Inches(8.2), Inches(1.65), Inches(4.6), Inches(5.0), COLOR_WHITE)
add_text(s, Inches(8.5), Inches(1.75), Inches(4), Inches(0.4),
         "✅ 已完成亮点", font_size=15, bold=True, color=COLOR_PRIMARY)
highlights = [
    "约教练全流程：申请→审核→预约",
    "原子排期：条件更新+回滚",
    "评价事务一致性",
    "8 个自定义组件沉淀",
    "金额/时间/错误码统一约定",
    "mock-data 兜底，无云环境也可跑",
]
for i, h in enumerate(highlights):
    y = 2.2 + i * 0.4
    add_text(s, Inches(8.5), Inches(y), Inches(0.2), Inches(0.3),
             "•", font_size=14, bold=True, color=COLOR_PRIMARY)
    add_text(s, Inches(8.7), Inches(y), Inches(4), Inches(0.4),
             h, font_size=11.5, color=COLOR_TEXT)

add_text(s, Inches(8.5), Inches(4.85), Inches(4), Inches(0.4),
         "⚠️  已知缺口", font_size=15, bold=True, color=COLOR_ORANGE)
gaps = [
    "activity 模块云函数 + 前端空壳",
    "首页「约球」入口未实现",
    "通知列表页面缺失",
    "真实微信支付未接入",
    "管理员审核页面缺失",
]
for i, g in enumerate(gaps):
    y = 5.3 + i * 0.3
    add_text(s, Inches(8.5), Inches(y), Inches(0.2), Inches(0.3),
             "•", font_size=14, bold=True, color=COLOR_ORANGE)
    add_text(s, Inches(8.7), Inches(y), Inches(4), Inches(0.4),
             g, font_size=11, color=COLOR_TEXT)

add_footer(s, 10, TOTAL)


# ---------- Slide 11: 阶段路线图 ----------
s = prs.slides.add_slide(blank)
set_slide_bg(s, COLOR_BG)
add_title_bar(s, "10  阶段路线图", "三阶段闭环：体验 → 交易 → 运营")

phases = [
    ("Phase 1", "体验闭环", COLOR_PRIMARY,
     ["活动模块真实化（云函数+前端）", "首页「约球」入口", "通知列表页", "已知问题修复（架构一致性）", "mock-data 保留作降级"]),
    ("Phase 2", "交易闭环", COLOR_ACCENT,
     ["真实微信支付接入", "管理员审核后台", "订单退款流程", "评价回复功能", "退款通知 + 消息触达"]),
    ("Phase 3", "运营闭环", COLOR_ORANGE,
     ["数据看板（订单/GMV/转化）", "营销工具（优惠券/拼团）", "商家自助管理", "智能推荐（教练/场地/活动）", "会员体系与积分"]),
]
for i, (h, sub, color, items) in enumerate(phases):
    x = Inches(0.5 + i * 4.3)
    add_rounded(s, x, Inches(1.7), Inches(4.1), Inches(5.0), COLOR_WHITE)
    add_rect(s, x, Inches(1.7), Inches(4.1), Inches(0.8), color)
    add_text(s, x, Inches(1.78), Inches(4.1), Inches(0.4),
             h, font_size=20, bold=True, color=COLOR_DARK,
             align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    add_text(s, x, Inches(2.2), Inches(4.1), Inches(0.3),
             sub, font_size=12, color=COLOR_DARK,
             align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    for j, it in enumerate(items):
        y = 2.7 + j * 0.65
        add_text(s, x + Inches(0.25), Inches(y), Inches(0.25), Inches(0.3),
                 "▸", font_size=12, bold=True, color=color)
        add_text(s, x + Inches(0.55), Inches(y), Inches(3.4), Inches(0.6),
                 it, font_size=11.5, color=COLOR_TEXT, anchor=MSO_ANCHOR.MIDDLE)

# 底部箭头
add_text(s, Inches(4.4), Inches(6.75), Inches(0.5), Inches(0.3),
         "▶", font_size=18, bold=True, color=COLOR_PRIMARY)
add_text(s, Inches(8.7), Inches(6.75), Inches(0.5), Inches(0.3),
         "▶", font_size=18, bold=True, color=COLOR_ACCENT)

add_footer(s, 11, TOTAL)


# ---------- Slide 12: 风险 & 质量保证 ----------
s = prs.slides.add_slide(blank)
set_slide_bg(s, COLOR_BG)
add_title_bar(s, "11  风险 & 质量保证", "架构师视角的关键风险点")

risks = [
    ("数据一致性", "高",
     "订单创建与排期占用、评价写入与统计回写\n需要事务保证；当前 schedule.bookSlot 已用条件更新+回滚"),
    ("架构一致性", "中",
     "activity / notification 云函数未拆 actions/\n与 user/coach 等模块风格不一致，需要补齐"),
    ("接口降级", "中",
     "云函数异常时 mock-data 兜底，但 service 层\nshowError 默认值不统一，存在误弹 toast 风险"),
    ("支付/退款", "高",
     "当前为模拟支付，二期接入需对接商户号\n+ 异步回调 + 对账，链路复杂度上升"),
    ("权限与审核", "中",
     "管理员入口仅在云函数校验，前端缺管理后台\n存在「数据裸跑」风险，phase2 必须补齐"),
    ("包体积/性能", "低",
     "mock-data 完整保留 + 8 个页面级 service\n首次加载可能偏慢，可通过分包与按需加载优化"),
]
for i, (h, level, body) in enumerate(risks):
    col = i % 2
    row = i // 2
    x = Inches(0.5 + col * 6.3)
    y = Inches(1.7 + row * 1.7)
    add_rounded(s, x, y, Inches(6.0), Inches(1.55), COLOR_WHITE)
    add_rect(s, x, y, Inches(0.15), Inches(1.55),
             COLOR_ORANGE if level == "高" else (COLOR_ACCENT if level == "中" else COLOR_PRIMARY))
    add_text(s, x + Inches(0.3), y + Inches(0.08), Inches(3.5), Inches(0.4),
             h, font_size=15, bold=True, color=COLOR_DARK, anchor=MSO_ANCHOR.MIDDLE)
    # 等级徽标
    add_rounded(s, x + Inches(4.8), y + Inches(0.15), Inches(1.0), Inches(0.35),
                COLOR_ORANGE if level == "高" else (COLOR_ACCENT if level == "中" else COLOR_PRIMARY))
    add_text(s, x + Inches(4.8), y + Inches(0.15), Inches(1.0), Inches(0.35),
             f"风险·{level}", font_size=10, bold=True, color=COLOR_WHITE,
             align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    add_text(s, x + Inches(0.3), y + Inches(0.55), Inches(5.5), Inches(1.0),
             body, font_size=11, color=COLOR_TEXT)

add_footer(s, 12, TOTAL)


# ---------- Slide 13: 团队协作 & 工具链 ----------
s = prs.slides.add_slide(blank)
set_slide_bg(s, COLOR_BG)
add_title_bar(s, "12  协作 & 工程实践", "约定、文档、自动化")

# 左侧：规范
add_rounded(s, Inches(0.5), Inches(1.65), Inches(6.1), Inches(5.0), COLOR_WHITE)
add_text(s, Inches(0.8), Inches(1.75), Inches(5.5), Inches(0.4),
         "📐  代码 & 命名规范", font_size=16, bold=True, color=COLOR_PRIMARY)
rules = [
    "云函数：小写单数名词 (user/coach/order)",
    "入口：exports.main = async (event, context)",
    "Action 文件：actions/<actionName>.js",
    "Service：暴露 XxxService 对象",
    "业务常量：大写枚举 + _MAP(label/color)",
    "金额：永远「分」存储，展示 ÷ 100",
    "接口：读用 get() 显式 showError:false",
    "      写用 post() 走 loading",
    "降级：云函数失败 → mock-data → toast",
]
for i, r in enumerate(rules):
    y = 2.25 + i * 0.42
    add_text(s, Inches(0.85), Inches(y), Inches(0.2), Inches(0.3),
             "›", font_size=12, bold=True, color=COLOR_PRIMARY)
    add_text(s, Inches(1.05), Inches(y), Inches(5.4), Inches(0.4),
             r, font_size=11.5, color=COLOR_TEXT)

# 右侧：文档
add_rounded(s, Inches(6.8), Inches(1.65), Inches(6.03), Inches(5.0), COLOR_WHITE)
add_text(s, Inches(7.1), Inches(1.75), Inches(5.5), Inches(0.4),
         "📚  项目文档 & 协作", font_size=16, bold=True, color=COLOR_PRIMARY)
docs = [
    ("CLAUDE.md",       "项目知识库 / 架构锚点（反推维护）"),
    ("vibe-01/02/03.md","阶段性 vibe 记录 / 设计决策"),
    ("vibe-all.md",     "合并版本（完整对话流）"),
    ("phase1/2/3-plan.md","三期功能规划"),
    ("CODE_REVIEW_REPORT.md","代码评审报告"),
    ("project.config.json","小程序工程配置"),
    (".cloudbase/",     "云开发调试配置（debug.json）"),
    ("docs/ 目录",      "所有阶段规划集中存放"),
]
for i, (k, v) in enumerate(docs):
    y = 2.25 + i * 0.5
    add_text(s, Inches(7.1), Inches(y), Inches(2.0), Inches(0.4),
             k, font_size=12, bold=True, color=COLOR_DARK, anchor=MSO_ANCHOR.MIDDLE)
    add_text(s, Inches(9.1), Inches(y), Inches(3.7), Inches(0.4),
             v, font_size=11, color=COLOR_TEXT, anchor=MSO_ANCHOR.MIDDLE)

add_footer(s, 13, TOTAL)


# ---------- Slide 14: 结尾 / Thank You ----------
s = prs.slides.add_slide(blank)
set_slide_bg(s, COLOR_DARK)
add_rect(s, Inches(0), Inches(0), Inches(0.35), Inches(7.5), COLOR_PRIMARY)
add_rect(s, Inches(10.5), Inches(0), Inches(2.83), Inches(7.5), RGBColor(0x16, 0x1F, 0x2A))

ring = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(8.6), Inches(2.0), Inches(4.2), Inches(4.2))
ring.fill.background()
ring.line.color.rgb = COLOR_PRIMARY
ring.line.width = Pt(4)
for r, op in [(1.6, Pt(2)), (1.1, Pt(1.5))]:
    arc = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(8.6 + (4.2 - r)/2),
                             Inches(2.0 + (4.2 - r)/2), Inches(r), Inches(r))
    arc.fill.background()
    arc.line.color.rgb = COLOR_PRIMARY
    arc.line.width = op

add_text(s, Inches(0.8), Inches(2.2), Inches(10), Inches(1.0),
         "Thank You", font_size=64, bold=True, color=COLOR_PRIMARY)
add_text(s, Inches(0.8), Inches(3.3), Inches(10), Inches(0.6),
         "欢迎一起把 TennisVibe 打磨成更好的网球生态",
         font_size=22, color=COLOR_WHITE)

# 关键信息
items = [
    "项目代号：tennis-eco",
    "AppID：wxd78e98cafe1dff67",
    "基础库：3.3.4+",
    "入口：miniprogramRoot = miniprogram/",
    "云函数根：cloudfunctionRoot = cloudfunctions/",
]
for i, it in enumerate(items):
    y = 4.4 + i * 0.4
    add_text(s, Inches(0.8), Inches(y), Inches(0.2), Inches(0.3),
             "·", font_size=14, bold=True, color=COLOR_PRIMARY)
    add_text(s, Inches(1.0), Inches(y), Inches(8), Inches(0.4),
             it, font_size=14, color=COLOR_WHITE)

add_text(s, Inches(0.8), Inches(6.85), Inches(10), Inches(0.3),
         "TennisVibe · Project Briefing · 2026", font_size=10, color=COLOR_MUTED)


# ================= 保存 =================
out = "TennisVibe_项目介绍.pptx"
prs.save(out)
print(f"✅ 已生成：{out}  ｜  共 {len(prs.slides)} 页")
