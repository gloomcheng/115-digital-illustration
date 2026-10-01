#!/usr/bin/env python3
"""
飲料店經營模擬：像素美術資產產生器（俯視 3/4）。

上一版為什麼不像遊戲
--------------------
把東西直接畫在格子線上，看起來就是「彩色方塊」。像素遊戲之所以
看起來是「一個空間」，靠的不是格子線，是**同一個物件有幾個亮度**：

    頂面（最亮，接收天花板的光）
    正面（中間，垂直面向玩家）
    側面（最暗，轉角處）
    落地陰影（物件與地板的接觸處）

四個亮度層出來，地板才會變成地面、吧檯才會變成一個「塊」、
人才會站在東西「後面」而不是「印在」上面。少了這一層，
再細緻的畫也只是圖鑑。

所以這個檔案的核心是 `block()`：所有立體物件都用它畫，
亮度規則只有一份，不可能各自為政。

尺寸系統（整個遊戲共用，不要在別處另訂）
--------------------------------------
    地板格   16×16
    人物     16×20   （比地板高 4px，腳底對齊格底 = 站在格子上）
    杯子     8×10
    縮放     3 倍 → 地板 48px、人物 48×60，在 1366×768 的投影上看得清
"""

import json
import os
from PIL import Image, ImageDraw

HERE = os.path.dirname(__file__)
# 精靈圖放進 repo 的 public/：課程網站（Astro）和這個模擬伺服器
# 讀同一份檔，不會有兩套不一致的圖，也不用熱站外部圖片。
PUBLIC = os.path.normpath(os.path.join(HERE, "..", "..", "public"))
SHEET_PATH = os.path.join(PUBLIC, "shop-sprites.png")
JSON_PATH = os.path.join(PUBLIC, "shop-sprites.json")

TILE = 16
CHAR_W, CHAR_H = 16, 20
CUP_W, CUP_H = 8, 10
SCALE = 3

INK = (43, 33, 24, 255)
INK_SOFT = (43, 33, 24, 130)


def mix(c, t, amount):
    """把顏色 c 往白色 t 推 amount（0-1）。用來做頂面高光。"""
    return tuple(int(c[i] + (t[i] - c[i]) * amount) for i in range(3)) + (c[3] if len(c) > 3 else 255,)


def shade(c, f):
    """整體乘上亮度 f。做出三個面的明暗。"""
    return tuple(max(0, min(255, int(v * f))) for v in c[:3]) + (c[3] if len(c) > 3 else 255,)


# ── 調色盤 ────────────────────────────────────────────────
# 28 色。刻意不用漸層：像素風的色階要「跳」，不要「混」。
P = {
    "ink":       INK,
    # 人物
    "skin":      (242, 201, 160, 255),
    "skin_sh":   (214, 168, 128, 255),
    # 場景
    "floor":     (226, 214, 192, 255),
    "floor_alt": (222, 209, 187, 255),
    "wall":      (240, 228, 206, 255),
    "wall_face": (214, 198, 172, 255),
    "wall_dk":   (186, 168, 140, 255),
    # 木頭（吧檯檯面是淺色木，櫃身是深色木）
    "wood":      (196, 152, 100, 255),
    "wood_top":  (222, 186, 138, 255),
    "wood_dk":   (140, 102, 64, 255),
    # 不鏽鋼（手搖飲的吧檯後場幾乎全是鋼的）
    "steel":     (186, 192, 198, 255),
    "steel_top": (222, 226, 230, 255),
    "steel_dk":  (128, 136, 144, 255),
    # 配料（這是手搖飲真正的品項，取代「貨架上的成品杯」）
    "pearl":     (74, 58, 48, 255),     # 黑糖珍珠：最深
    "pearl_hi":  (112, 88, 70, 255),    # 珍珠的高光
    "tapioca":   (238, 232, 216, 255),  # 白玉粉圓
    "taro":      (158, 126, 158, 255),  # 芋圓
    "redbean":   (150, 78, 62, 255),    # 紅豆
    "coconut":   (240, 244, 238, 255),  # 椰果
    "pudding":   (238, 200, 118, 255),  # 布丁
    # 飲料／茶
    "cup":       (248, 244, 232, 255),
    "cup_dk":    (206, 198, 182, 255),
    "tea_brown": (150, 100, 56, 255),
    "tea_green": (122, 154, 74, 255),
    "tea_milk":  (188, 146, 96, 255),
    # 強調
    "lamp":      (255, 232, 176, 255),
    "lit":       (255, 250, 226, 255),  # 燈箱發光
    "cream":     (255, 240, 206, 255),
    "green":     (110, 160, 90, 255),
    "grey":      (146, 142, 136, 255),
    "grey_dk":   (112, 108, 102, 255),
    "red":       (201, 79, 79, 255),
}

# 料桶順序 = 實際手搖飲最常見的配料排列（左到右）。
# 這六樣是備料檯上真的會有的桶，不是飲料店的「貨架」。
TOPPINGS = [P["pearl"], P["tapioca"], P["taro"], P["redbean"], P["coconut"], P["pudding"]]
TEAS = [P["tea_brown"], P["tea_green"], P["tea_milk"]]
HAIRS = [(58, 44, 34, 255), (92, 62, 44, 255), (140, 98, 62, 255),
         (74, 60, 72, 255), (52, 54, 66, 255), (120, 84, 84, 255)]
SKINS = [P["skin"], (228, 184, 140, 255), (198, 152, 110, 255)]
# 顧客便服：刻意選冷色／暗色，和員工的淺色襯衫 + 紅圍裙拉開
CUST_SHIRTS = [(120, 132, 148, 255), (150, 118, 132, 255), (110, 126, 118, 255),
               (146, 132, 104, 255), (128, 118, 142, 255), (104, 118, 138, 255)]
# 員工工作襯衫：淺米白。淺色才能讓紅圍裙跳出來
STAFF_SHIRT = (232, 226, 212, 255)
SHIRTS = [P["steel_dk"], (94, 140, 90, 255), (200, 140, 70, 255),
          (150, 110, 170, 255), (70, 130, 140, 255), (188, 96, 96, 255)]


def blank(w, h):
    return Image.new("RGBA", (w, h), (0, 0, 0, 0))


# ── 核心：3/4 立體塊 ──────────────────────────────────────
#
# 一個「塊」= 頂面 + 正面 + 落地陰影。
# 這是整個遊戲唯一的建模方式，所以亮度規則不可能不一致。
#
#   h_top   頂面高度（俯視角度越低，頂面越薄）
#   h_front 正面高度（物件的「高度」）
#   skew    頂面左右各收縮的像素，模擬一點點透視

def block(w, front_h, base, h_top=5, skew=2, top_boost=0.30, side_f=0.62, ao=True):
    """
    畫一個 3/4 立體塊，回傳 RGBA 影像與它貼上時的 y 偏移。
    影像高度 = h_top + front_h；貼上時應該讓「正面底部」對齊地面。
    """
    h = h_top + front_h
    img = blank(w, h)
    d = ImageDraw.Draw(img)

    top = mix(base, (255, 255, 255, 255), top_boost)
    front = base
    side = shade(base, side_f)

    # 正面
    d.rectangle([0, h_top, w - 1, h - 1], fill=front)
    # 頂面（梯形）
    d.polygon([(skew, 0), (w - 1 - skew, 0), (w - 1, h_top), (0, h_top)], fill=top)
    # 描邊
    d.line([(skew, 0), (w - 1 - skew, 0)], fill=INK)
    d.line([(skew, 0), (0, h_top)], fill=INK)
    d.line([(w - 1 - skew, 0), (w - 1, h_top)], fill=INK)
    d.line([(0, h_top), (w - 1, h_top)], fill=mix(base, (255, 255, 255, 255), 0.45))
    d.line([(0, h_top), (0, h - 1)], fill=INK)
    d.line([(w - 1, h_top), (w - 1, h - 1)], fill=INK)
    d.line([(0, h - 1), (w - 1, h - 1)], fill=INK)
    # 兩側暗面
    d.polygon([(skew, 0), (0, h_top), (0, h - 1), (skew, h_top + front_h - h_top)], fill=side)
    d.polygon([(w - 1 - skew, 0), (w - 1, h_top), (w - 1, h - 1),
               (w - 1 - skew, h_top + front_h - h_top)], fill=side)

    if ao:
        # 落地陰影：物件與地板的接觸處要有一條暗，否則會浮起來
        d.line([(1, h - 1), (w - 2, h - 1)], fill=INK_SOFT)
    return img


def draw_drop_shadow(base, w, h, height):
    """在 base 上疊一個橢圓落地陰影。height 是影子中心所在的 y。"""
    d = ImageDraw.Draw(base)
    d.ellipse([w // 2 - 7, height - 2, w // 2 + 7, height + 2],
              fill=(43, 33, 24, 60))
    return base


# ── 地板 ──────────────────────────────────────────────────

def floor_tile(kind):
    """
    地板：單一純色，不畫格線也不做棋盤格。

    這是試了三版之後的結論。在一間 18×13 的小房間裡，
    任何格線或棋盤格都會被眼睛讀成「地板有條紋」而不是「這是地板」。
    遊戲裡地板的空間感是靠家具的落地陰影、牆腳影子、地墊、
    以及明暗階（櫃檯比地板亮、暗）建立起來的，不是靠地板自己的花紋。

    所以這裡就是一片純色。`kind` 只留給未來真的要分區時用。
    """
    img = blank(TILE, TILE)
    base = {"plain": P["floor"], "alt": P["floor_alt"],
            "back": shade(P["floor"], 0.97), "wait": P["floor"]}[kind]
    img.paste(base, (0, 0, TILE, TILE))
    return img


def wall_piece():
    """
    後牆（16×46，接近 3 格高）。

    前兩版都太矮（16px、28px），畫面裡看起來像一條細線，
    店就沒有「裡面」的高度。牆高是房間感的關鍵，不是裝飾。
    """
    H = 46
    img = blank(TILE, H)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, TILE - 1, 36], fill=P["wall"])
    # 壁面板接縫：讓 24 格長的牆看得出是「很多塊板子」
    for y in (0, 12, 24):
        d.line([(0, y), (TILE - 1, y)], fill=P["wall_face"])
    d.line([(0, 0), (0, 36)], fill=mix(P["wall"], (255, 255, 255, 255), 0.14))
    d.line([(TILE - 1, 0), (TILE - 1, 36)], fill=P["wall_dk"])
    # 踢腳板
    d.rectangle([0, 36, TILE - 1, 39], fill=P["wood_dk"])
    d.line([(0, 36), (TILE - 1, 36)], fill=INK)
    d.line([(0, 39), (TILE - 1, 39)], fill=INK)
    # 落在地板上的影子
    d.rectangle([0, 40, TILE - 1, 42], fill=(43, 33, 24, 62))
    d.rectangle([0, 43, TILE - 1, 45], fill=(43, 33, 24, 26))
    return img


def side_wall():
    """左右側牆（6×46）。用來把店「圍起來」，不然地圖會散在虛空裡。"""
    W_ = 6
    img = blank(W_, 46)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W_ - 1, 39], fill=P["wall_face"])
    d.line([(0, 0), (W_ - 1, 0)], fill=mix(P["wall_face"], (255, 255, 255, 255), 0.2))
    d.rectangle([0, 39, W_ - 1, 42], fill=P["wood_dk"])
    d.line([(0, 39), (W_ - 1, 39)], fill=INK)
    d.rectangle([0, 43, W_ - 1, 45], fill=(43, 33, 24, 30))
    return img


def mat(w=32, h=12, color=(198, 140, 128, 255)):
    """
    地墊。用來標示區域（門口、排隊區），
    比把地板整塊換色好——換色會讓地板變成一條條橫紋。
    """
    img = blank(w, h)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w - 1, h - 1], fill=color)
    d.line([(0, 0), (w - 1, 0)], fill=shade(color, 0.8))
    d.line([(0, h - 1), (w - 1, h - 1)], fill=shade(color, 0.8))
    d.rectangle([2, 2, w - 3, h - 3], outline=mix(color, (255, 255, 255, 255), 0.25))
    return img


# ── 場景物件 ──────────────────────────────────────────────

COUNTER_W = 64          # 4 格寬，一次畫完
COUNTER_FRONT = 16
COUNTER_TOP = 7


def finished_cup(tea_index):
    """
    做好的飲料（8×12）。只出現在**取餐架**上——那是唯一一個
    「做好的杯子會放在客人看得到的地方」的位置，而且是在後場那側。

    這正是為什麼原來的設計（客區前面一排杯子等著被買）是錯的：
    飲品是在吧檯後面做好、放到取餐架、然後才交到客人手上，
    客人從來不會自己從架上拿一杯。
    """
    w, h = 8, 12
    img = blank(w, h)
    d = ImageDraw.Draw(img)
    tea = TEAS[tea_index % len(TEAS)]
    # 杯身（上寬下窄）
    d.polygon([(1, 3), (w - 2, 3), (w - 3, h - 1), (2, h - 1)], fill=P["cup"])
    d.polygon([(2, 4), (w - 3, 4), (w - 4, h - 2), (3, h - 2)], fill=tea)
    d.line([(1, 3), (w - 2, 3)], fill=INK)
    d.line([(1, 3), (2, h - 1)], fill=INK)
    d.line([(w - 2, 3), (w - 3, h - 1)], fill=INK)
    d.line([(2, h - 1), (w - 3, h - 1)], fill=INK)
    # 杯蓋 + 吸管
    d.rectangle([1, 1, w - 2, 3], fill=P["cup_dk"])
    d.line([(1, 1), (w - 2, 1)], fill=INK)
    d.line([(w // 2, 0), (w // 2 + 1, 2)], fill=P["red"])
    return img
def menu_lightbox():
    """
    菜單燈箱（56×18）。掛在後牆、吧檯正上方。

    真實手搖飲的菜單是「燈箱」——背光發光，所以是整面店裡最亮的東西，
    也是客人一進門最先看到的。這不只是裝飾：
    燈箱亮 = 店在營業；燈箱暗 = 沒開。做成發光體有實際意義。
    """
    w, h = 56, 18
    img = blank(w, h)
    d = ImageDraw.Draw(img)
    # 燈箱框
    d.rectangle([0, 0, w - 1, h - 1], fill=P["steel_dk"])
    d.line([(0, 0), (w - 1, 0)], fill=INK)
    d.line([(0, h - 1), (w - 1, h - 1)], fill=INK)
    d.line([(0, 0), (0, h - 1)], fill=INK)
    d.line([(w - 1, 0), (w - 1, h - 1)], fill=INK)
    # 發光面
    d.rectangle([2, 2, w - 3, h - 3], fill=P["lit"])
    d.line([(2, 2), (w - 3, 2)], fill=(255, 255, 255, 255))
    # 菜單列：左邊色塊 = 品項，右邊橫線 = 價格
    for i in range(3):
        y = 4 + i * 4
        d.rectangle([4, y, 7, y + 2], fill=TEAS[i % len(TEAS)])
        d.line([(10, y + 1), (24, y + 1)], fill=(190, 182, 168, 255))
        d.line([(32, y + 1), (w - 5, y + 1)], fill=(206, 200, 188, 255))
    # 溢出的光暈
    d.rectangle([0, 0, w - 1, h - 1], outline=(255, 246, 214, 120))
    return img


def ice_machine():
    """製冰機（16×20）。放在後場角落，發出機器的聲音和冷氣。"""
    w, h = 16, 20
    img = blank(w, h)
    d = ImageDraw.Draw(img)
    d.rectangle([2, 3, w - 3, h - 2], fill=P["steel"])
    d.line([(2, 3), (w - 3, 3)], fill=P["steel_dk"])
    d.line([(2, 3), (2, h - 2)], fill=INK)
    d.line([(w - 3, 3), (w - 3, h - 2)], fill=INK)
    d.line([(2, h - 2), (w - 3, h - 2)], fill=INK)
    # 落冰口
    d.rectangle([5, 6, w - 6, 12], fill=(198, 226, 240, 255))
    d.line([(5, 6), (w - 6, 6)], fill=INK)
    d.line([(5, 6), (5, 12)], fill=INK)
    d.line([(w - 6, 6), (w - 6, 12)], fill=INK)
    # 冰塊
    for x, y in ((6, 10), (8, 9), (10, 10)):
        d.rectangle([x, y, x + 1, y + 1], fill=(232, 246, 252, 255))
    # 頂蓋
    d.rectangle([1, 1, w - 2, 3], fill=P["steel_dk"])
    return img


def topping_box(index, fill):
    """
    配料盒（16×14），**站在出餐吧檯上**，緊接在茶桶工位的右邊。

    為什麼在檯上而不在別處：真實的出杯流程是
    「加茶 → 加配料 → 封膜」，所以配料盒就在茶桶旁邊。
    員工橫著走就拿得到，不用繞到別的檯子——這正是
    飲料店吧檯設計原則「員工只橫向移動」的意思。

    盒子的存量 = 填充高度。三階（滿／半／空）在 3 倍放大下讀得出來，
    而且不需要任何文字。
    """
    w, h = 16, 14
    img = blank(w, h)
    d = ImageDraw.Draw(img)
    tea = TOPPINGS[index % len(TOPPINGS)]
    # 盒體（上寬下窄的不鏽鋼方盒）
    d.polygon([(1, 2), (w - 2, 2), (w - 3, h - 1), (2, h - 1)], fill=P["steel"])
    d.line([(1, 2), (w - 2, 2)], fill=INK)
    d.line([(1, 2), (2, h - 1)], fill=INK)
    d.line([(w - 2, 2), (w - 3, h - 1)], fill=INK)
    d.line([(2, h - 1), (w - 3, h - 1)], fill=INK)
    # 盒口內壁
    d.polygon([(3, 3), (w - 4, 3), (w - 5, 6), (4, 6)], fill=P["steel_dk"])
    d.line([(3, 3), (w - 4, 3)], fill=INK)

    if fill > 0:
        hgt = 3 + int(fill * (h - 3 - 6))
        y0 = h - 1 - hgt
        d.polygon([(3, y0), (w - 4, y0), (w - 4, h - 2), (3, h - 2)], fill=tea)
        d.line([(3, y0), (w - 4, y0)], fill=mix(tea, (255, 255, 255, 255), 0.45))
        if index % len(TOPPINGS) == 0:        # 黑糖珍珠：兩點高光
            d.point((5, y0 + 2), fill=P["pearl_hi"])
            d.point((8, y0 + 3), fill=P["pearl_hi"])
    else:
        # 空盒：盒底一個深色叉，一眼看得出是空的
        d.line([(5, h - 5), (9, h - 5)], fill=P["steel_dk"])
        d.line([(5, h - 6), (9, h - 4)], fill=P["steel_dk"])
        d.line([(9, h - 6), (5, h - 4)], fill=P["steel_dk"])
    return img


def storefront(w, h):
    """
    店面（整條寬度）。畫在畫面最下方。

    為什麼需要這個：飲料店是外帶店，客人站在吧檯前等、拿了就走。
    如果畫面下方留一整塊空地板，人眼會讀成「可以坐的空間」——
    那是餐廳的讀法，不是飲料店的。**邊界必須畫出來。**

    分三層：玻璃（看得見店裡）→ 門框 → 人行道。
    玻璃上一道道反光是為了讓它讀得出是「玻璃」而不是一條灰帶。
    """
    img = blank(w, h)
    d = ImageDraw.Draw(img)
    glass_h = 15                      # 玻璃高度
    sill = 3                         # 門檻／窗台
    walk = h - glass_h - sill         # 人行道

    # ── 玻璃 ──
    d.rectangle([0, 0, w, glass_h], fill=(198, 222, 236, 130))
    d.line([(0, 0), (w, 0)], fill=INK)
    # 斜向反光：讓這層讀得出是玻璃
    for i in range(-glass_h, w, 9):
        d.line([(i + glass_h, 0), (i, glass_h)], fill=(238, 248, 253, 95), width=2)
    # ── 門檻 ──
    d.rectangle([0, glass_h, w, glass_h + sill], fill=P["steel_dk"])
    d.line([(0, glass_h), (w, glass_h)], fill=INK)
    d.line([(0, glass_h + sill), (w, glass_h + sill)], fill=INK)
    # ── 門（右側一扇推門，門框要看得見）──
    dx = w - 32
    d.rectangle([dx, 0, dx + 2, glass_h + sill], fill=P["steel_dk"])
    d.rectangle([dx + 22, 0, dx + 24, glass_h + sill], fill=P["steel_dk"])
    d.rectangle([dx + 19, 6, dx + 21, 12], fill=P["steel"])     # 門把
    # ── 人行道 ──
    d.rectangle([0, glass_h + sill, w, h], fill=(200, 194, 182, 255))
    d.line([(0, glass_h + sill + 3), (w, glass_h + sill + 3)], fill=(178, 172, 160, 255))
    d.line([(0, h - 1), (w, h - 1)], fill=(146, 140, 128, 255))
    # 門口的地磚：標出「出入口」
    d.rectangle([dx - 4, glass_h + sill, dx + 26, h], fill=(188, 182, 170, 255))
    # 人行道的水平接縫。**路面只有一條線的話會讀成一塊灰色空白**，
    # 有了前後兩條接縫才看得出是一格一格鋪出來的地磚，
    # 也才有「這是店外面」的縱深。
    top = glass_h + sill
    d.line([(0, top + 5), (w, top + 5)], fill=(184, 178, 166, 255))
    # 垂直接縫：每隔 28px 一條，錯開排列（磚塊要對縫）
    for i in range(0, w, 28):
        d.line([(i, top + 4), (i, top + 5)], fill=(184, 178, 166, 255))
        d.line([(i + 14, top + 6), (i + 14, h - 1)], fill=(184, 178, 166, 255))
    # 路緣石：人行道最下面一條略深，標出街道的邊界
    d.rectangle([0, h - 3, w, h - 1], fill=(172, 166, 154, 255))
    d.line([(0, h - 3), (w, h - 3)], fill=(150, 144, 132, 255))
    return img


def pendant_lamp():
    """
    吊燈（10×16）。從天花板吊下來的燈泡。

    為什麼要：吧檯上方原本是一整片空白天花板。Gather Town 那類的店裡
    吊燈是靈魂——它同時做兩件事：把視線拉到檯面（玩家真正操作的地方），
    以及讓上半部不空。倒吊的錐形燈罩 + 一顆暖色燈泡，遠看就是「店」。

    燈罩是上窄下寬的梯形，不是方塊：方塊會讀成一個吊著的箱子。
    燈泡用比燈罩亮的黃色，並在下方留 1px 暈開的高光，
    這樣在米色牆上才看得出「有光」。
    """
    w, h = 10, 16
    img = blank(w, h)
    d = ImageDraw.Draw(img)
    # 電線
    d.line([(w // 2, 0), (w // 2, 4)], fill=INK)
    # 燈罩：梯形（上窄下寬）
    d.polygon([(3, 4), (6, 4), (8, 10), (1, 10)], fill=P["steel_dk"])
    d.line([(3, 4), (6, 4)], fill=INK)
    d.line([(1, 10), (8, 10)], fill=INK)
    d.line([(3, 4), (1, 10)], fill=INK)
    d.line([(6, 4), (8, 10)], fill=INK)
    # 燈罩內側受光：靠下緣一條較亮的邊
    d.line([(2, 9), (7, 9)], fill=P["steel"])
    # 燈泡
    d.ellipse([3, 10, 6, 13], fill=(255, 224, 150, 255))
    d.point((4, 11), fill=(255, 244, 214, 255))
    # 光暈：1px 的淡黃，畫在燈泡下方
    d.line([(2, 14), (7, 14)], fill=(255, 238, 190, 120))
    return img


def wall_clock():
    """
    牆上的時鐘（11×11）。

    為什麼要：後牆右側（x168–224）本來是空的。一面 14 格寬的牆，
    左邊有吊櫃、中間有菜單燈箱，右邊卻什麼都沒有，視線會在那裡斷掉。
    時鐘是最不囉嗦的填法：真實飲料店都有，而且它是「時間」的符號——
    這個遊戲的核心就是十二年的光陰。

    分針指向 12，時針指向 4，指針用墨色且畫在圓盤中央偏上。
    """
    w, h = 11, 11
    img = blank(w, h)
    d = ImageDraw.Draw(img)
    d.ellipse([0, 0, w - 1, h - 1], fill=INK)
    d.ellipse([1, 1, w - 2, h - 2], fill=(246, 242, 232, 255))
    # 12 / 3 / 6 / 9 四點
    for x, y in ((5, 2), (8, 5), (5, 8), (2, 5)):
        d.point((x, y), fill=(120, 112, 100, 255))
    # 分針往上（12），時針往右下（4）
    d.line([(5, 5), (5, 2)], fill=INK)
    d.line([(5, 5), (7, 7)], fill=INK)
    d.point((5, 5), fill=P["red"])
    return img


def wall_cabinets():
    """
    吊櫃與層架（牆上，64×18）。真實飲料店後場的牆上會吊一排櫃子，
    放不常用的杯款、備用封膜、吸管——把檯面清空。
    這也讓後牆不是一片空白。
    """
    w, h = 64, 18
    img = blank(w, h)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w - 1, h - 1], fill=P["wood_dk"])
    d.line([(0, 0), (w - 1, 0)], fill=INK)
    d.line([(0, h - 1), (w - 1, h - 1)], fill=INK)
    d.line([(0, 0), (0, h - 1)], fill=INK)
    d.line([(w - 1, 0), (w - 1, h - 1)], fill=INK)
    # 兩扇櫃門
    d.line([(w // 2, 1), (w // 2, h - 2)], fill=INK)
    d.rectangle([6, h - 6, 9, h - 4], fill=P["steel"])      # 把手
    d.rectangle([w // 2 + 6, h - 6, w // 2 + 9, h - 4], fill=P["steel"])
    return img


# ── 吧檯：一條線，設備照出杯流程排 ──────────────────────
#
# 真實手搖飲的吧檯不是房間裡的一件家具，是**一條橫貫店面的工作線**。
# 所有設備都排在檯面上，順序是出杯流程
# （點單 → 取杯 → 加冰 → 加茶 → 加配料 → 封膜 → 出杯），
# 這樣員工只需要橫向移動、不用前後繞。
#
# 之前錯在：多加了一張備料檯、把料桶搬到左邊獨立的地方、留了一整塊地板。
# 那看起來是「有座位的店」，不是飲料店。
#
# 尺寸換算（人物 20px ≈ 165cm，所以 1px ≈ 8.25cm）：
#   前吧檯面客側 100–110cm → 13px  ← 作用是遮擋後場雜亂
#   檯面工作深度  65–75cm   →  8px
#   員工通道     ≥120cm    → 15px

COUNTER_BAYS = 4
COUNTER_FRONT = 13
COUNTER_TOP = 8
# 寬度 = 杯架封膜(24) + 製冰(16) + 4 個工位(64) + 封膜(16) + 出杯(24) + 收銀(16) + 餘量
COUNTER_W = 200


def counter_full(active):
    """
    整條吧檯（200×21）。`active` 是前幾個工位（茶桶）有人在用。

    從左到右就是出杯流程，所以學生看著這條檯面就能理解
    「為什麼要先加冰再加茶」——動線本身是畫出來的：

      收銀 │ 杯架封口膜 │ 製冰機 │ 茶桶 ×4（=工位）│ 封膜機 │ 出杯台

    **工位就是茶桶。** 這是這一版最重要的對應：設計文件裡的
    「供給上限 = min(人, 工位) + 0.4 × 超額」，在畫面上就是
    「幾個茶桶有人照顧、幾個空著」。多請的人沒有茶桶可用，
    只能站在通道裡閒著。
    """
    w, front, h_top = COUNTER_W, COUNTER_FRONT, COUNTER_TOP
    img = blank(w, h_top + front)
    d = ImageDraw.Draw(img)

    # ── 前吧檯（面客側）：深色木、高、遮住後場 ──
    d.rectangle([0, h_top, w - 1, h_top + front - 1], fill=P["wood_dk"])
    d.line([(0, h_top), (0, h_top + front - 1)], fill=INK)
    d.line([(w - 1, h_top), (w - 1, h_top + front - 1)], fill=INK)
    d.line([(0, h_top + front - 1), (w - 1, h_top + front - 1)], fill=INK)
    d.rectangle([1, h_top + front - 4, w - 2, h_top + front - 1],
                fill=shade(P["wood_dk"], 0.7))
    d.line([(1, h_top), (w - 2, h_top)],
           fill=mix(P["wood"], (255, 255, 255, 255), 0.58))

    # ── 檯面（整條連續）──
    d.polygon([(2, 0), (w - 3, 0), (w - 1, h_top), (0, h_top)],
              fill=mix(P["wood"], (255, 255, 255, 255), 0.32))
    d.line([(2, 0), (w - 3, 0)], fill=INK)
    d.line([(2, 0), (0, h_top)], fill=INK)
    d.line([(w - 3, 0), (w - 1, h_top)], fill=INK)

    def zone(x0, x1, tone):
        d.rectangle([x0 + 1, 1, x1 - 1, h_top - 1], fill=tone)
        d.line([(x0 + 1, 1), (x1 - 1, 1)], fill=shade(tone, 0.75))

    # ① 收銀／點單（左端，靠近門）
    zone(1, 15, shade(P["wood"], 0.55))
    d.rectangle([4, 2, 11, h_top - 2], fill=P["steel_dk"])   # 收銀機
    d.rectangle([5, 3, 10, 6], fill=(130, 176, 204, 255))
    d.line([(4, 2), (11, 2)], fill=INK)
    d.line([(15, 0), (15, h_top)], fill=INK)

    # ② 杯架 / 封口膜
    zone(15, 39, shade(P["wood"], 0.60))
    for i in range(3):                                       # 一疊空杯
        cx = 18 + i * 7
        d.rectangle([cx, 2, cx + 5, h_top - 2], fill=P["cup"])
        d.line([(cx, 2), (cx + 5, 2)], fill=INK)
        d.line([(cx, 2), (cx, h_top - 2)], fill=INK)
        d.line([(cx + 5, 2), (cx + 5, h_top - 2)], fill=INK)
    d.line([(39, 0), (39, h_top)], fill=INK)

    # ③ 製冰機 / 冰槽
    zone(39, 55, shade(P["steel"], 0.9))
    d.rectangle([41, 2, 53, h_top - 1], fill=P["steel_dk"])
    d.line([(41, 2), (53, 2)], fill=INK)
    for x, y in ((43, 4), (46, 5), (49, 4), (45, 3)):         # 冰塊
        d.rectangle([x, y, x + 1, y + 1], fill=(232, 246, 252, 255))
    d.line([(55, 0), (55, h_top)], fill=INK)

    # ④ 茶桶 ×4 ＝ 工位
    bay0 = 55
    for i in range(COUNTER_BAYS):
        x = bay0 + i * TILE
        on = i < active
        d.line([(x, 0), (x, h_top)], fill=INK)
        if on:
            d.rectangle([x + 2, 1, x + 13, h_top - 1], fill=P["steel_dk"])
            d.line([(x + 2, 1), (x + 13, 1)], fill=INK)
            d.rectangle([x + 3, 2, x + 12, h_top - 2], fill=P["tea_brown"])
            d.line([(x + 3, 2), (x + 12, 2)],
                   fill=mix(P["tea_brown"], (255, 255, 255, 255), 0.5))
            d.rectangle([x + 4, h_top + 1, x + 11, h_top + 2], fill=P["green"])
        else:
            d.line([(x + 4, 2), (x + 11, h_top - 3)], fill=shade(P["wood"], 0.45))
            d.line([(x + 11, 2), (x + 4, h_top - 3)], fill=shade(P["wood"], 0.45))
    bx = bay0 + COUNTER_BAYS * TILE
    d.line([(bx, 0), (bx, h_top)], fill=INK)

    # ⑤ 封膜機
    zone(bx, bx + 16, shade(P["steel"], 0.86))
    d.rectangle([bx + 3, 2, bx + 13, h_top - 2], fill=P["steel"])
    d.line([(bx + 3, 2), (bx + 13, 2)], fill=INK)
    d.line([(bx + 3, 2), (bx + 3, h_top - 2)], fill=INK)
    d.line([(bx + 13, 2), (bx + 13, h_top - 2)], fill=INK)
    d.line([(bx + 4, 3), (bx + 12, 3)], fill=P["lamp"])
    d.line([(bx + 16, 0), (bx + 16, h_top)], fill=INK)

    # ⑥ 出杯平台（右端，外帶在這裡拿）
    zone(bx + 16, w - 1, shade(P["wood"], 0.5))
    for i in range(3):                                       # 已封好的幾杯
        cup = finished_cup(i).resize((6, 9), Image.NEAREST)
        img.paste(cup, (bx + 20 + i * 9, 1), cup)
    return img

def register():
    """收銀機。放在吧檯左端。"""
    w, front, h_top = 10, 9, 4
    img = block(w, front, P["steel_dk"], h_top=h_top, skew=1, top_boost=0.35)
    d = ImageDraw.Draw(img)
    # 螢幕
    d.rectangle([2, 2, 7, 6], fill=(120, 170, 200, 255))
    d.line([(2, 2), (7, 2)], fill=INK)
    d.rectangle([1, 7, 8, 8], fill=shade(P["steel_dk"], 0.7))
    return img



def staff_marker():
    """
    工位在地板上的位置標記（16×6）。
    給「有工位但人還沒站上去」用的——剛擴建完、工位空著。
    有了它，學生擴建的瞬間就看見多了幾個位置，而不是只看到多一條線。
    """
    img = blank(TILE, 6)
    d = ImageDraw.Draw(img)
    d.rectangle([1, 1, TILE - 2, 4], fill=(122, 154, 74, 120))
    d.line([(1, 1), (TILE - 2, 1)], fill=(90, 130, 60, 200))
    return img



def lamp():
    """吊燈。掛在櫃檯上方，畫面右上角。純裝飾但很關鍵：
    沒有它，場景就是平的；有它就有「裡面」和「外面」的差別。"""
    w, h = 12, 10
    img = blank(w, h)
    d = ImageDraw.Draw(img)
    d.line([(5, 0), (5, 3)], fill=INK)
    d.polygon([(2, 3), (9, 3), (7, 7), (4, 7)], fill=P["lamp"])
    d.line([(2, 3), (9, 3)], fill=INK)
    d.line([(2, 3), (4, 7)], fill=INK)
    d.line([(9, 3), (7, 7)], fill=INK)
    d.line([(4, 7), (7, 7)], fill=INK)
    # 光暈
    d.ellipse([3, 6, 8, 10], fill=(255, 232, 176, 70))
    return img


def door_unit():
    """門。冷色 + 透明，畫面上一眼知道「這裡通外面」。"""
    w, h = TILE, 34
    img = blank(w, h)
    d = ImageDraw.Draw(img)
    d.rectangle([1, 6, w - 2, h - 3], fill=(214, 232, 244, 220))
    d.line([(1, 6), (w - 2, 6)], fill=P["steel_dk"])
    d.line([(1, 6), (1, h - 3)], fill=P["steel_dk"])
    d.line([(w - 2, 6), (w - 2, h - 3)], fill=P["steel_dk"])
    d.line([(7, 7), (7, h - 3)], fill=P["steel_dk"])
    d.rectangle([0, h - 3, w - 1, h - 1], fill=shade(P["steel_dk"], 0.8))
    return img
def plant():
    """盆栽。角落裝飾。"""
    w, h = 14, 18
    img = blank(w, h)
    d = ImageDraw.Draw(img)
    d.polygon([(3, 10), (10, 10), (9, 17), (4, 17)], fill=P["wood"])
    d.line([(3, 10), (10, 10)], fill=INK)
    d.line([(3, 10), (4, 17)], fill=INK)
    d.line([(10, 10), (9, 17)], fill=INK)
    d.ellipse([2, 2, 11, 12], fill=(96, 148, 84, 255))
    d.ellipse([4, 4, 9, 9], fill=(124, 176, 104, 255))
    return img


# ── 人物幾何 ───────────────────────────────────────────────
#
# 用繪圖指令畫，不用字元點陣。16×20 的角色要靠弧線才像人；
# 手數格子畫不出弧線，只能在格子裡塞滿，結果就是「方塊頭身」。
#
# 縱向分配（20px，9 / 6 / 3 / 2）：
#
#   y 0–8    頭（含描邊，9px，45%）
#   y 9–15   身 + 手臂（含描邊，6px，30%）
#   y 15–18  腿（3px）
#   y 18–20  鞋（2px）
#
# 橫向（16px 畫布，角色佔 13px，左右各留 1–2px 走位空間）：
#
#   頭填色  x 4–12 =  9px      頭描邊 x 3–13  = 11px
#   肩填色  x 3–13 = 11px      肩描邊 x 2–14  = 13px
#   腰填色  x 4–11 =  8px
#   腿      x 5–6、x 9–10（2px 兩條，中間 2px 縫）
#   鞋      x 4–7、x 8–11（比腿寬 1px）
#
# 四個判準。每一條都是前面某一版踩過的坑，寫在對應的位置：
#
#   1. 肩填色 11px > 頭填色 9px。頭和肩一樣寬 = 正方形身體。
#      前面兩版都是頭 8 / 肩 8 或頭 9 / 肩 9，所以怎麼改臉都還是方的。
#
#   2. 頭填色只有 7px 高（y1–y7），五官要排得下：
#        y1–y2  頭髮
#        y3     瀏海 + 額頭
#        y4     **眼睛**（2×1 橫眼，中間留 1px 縫）
#        y5     空白 ← **眼睛和嘴之間必須有一列空白**
#        y6     嘴（1px）
#        y7     下巴
#      眼睛和嘴**相鄰**時會並成一條黑橫帶，看起來像戴口罩。
#      這一列空白是「不像機器人」的關鍵，不能省。
#
#   3. 頭髮最多蓋到 y2（加上不對稱瀏海到 y3）。蓋到 y4 臉就只剩眼睛和下巴。
#      之前畫到 y5，整顆頭變成一團頭髮 = 安全帽。
#
#   4. 嘴是膚色暗一階，不是墨色。墨色在 1px 會變成下巴上的黑點，
#      看起來像鬍子或鼻孔。

CHAR_HEAD_W = 9.0         # 頭填色寬（x 4–12）
CHAR_SHOULDER_W = 11.0    # 肩填色寬（x 3–13），必須 > 頭寬
CHAR_WAIST_W = 8.0        # 腰填色寬（x 4–11）
CHAR_HEAD_TOP = 0.0       # 頭描邊頂列

FACE_EYE_Y = 4            # 眼睛
FACE_MOUTH_Y = 6          # 嘴（眼睛下方 2px，中間留 y5 空白）


def _hair_style(d, cx, hy, hw, hair, hair_hi, variant):
    """
    頭髮。同一個形狀畫 6 次角色會像雙胞胎，所以依 variant 分四種：
    短髮 / 中長 / 馬尾 / 捲髮。

    hy 是「頭填色」的頂列。**最多蓋到 hy+1**（瀏海到 hy+2），
    臉要留 hy+3..hy+6 共 4px 放五官。
    """
    style = variant % 4
    x0, x1 = cx - hw / 2, cx + hw / 2
    # 弦形：橢圓的上半。框高 3 → 上半落在 hy+0..hy+1.5 → 蓋到 y+1
    d.chord([x0, hy, x1, hy + 3], 180, 360, fill=hair)
    if style == 0:                     # 短髮：兩側下到耳朵
        d.rectangle([x0, hy + 1, x0, hy + 2], fill=hair)
        d.rectangle([x1, hy + 1, x1, hy + 2], fill=hair)
    elif style == 1:                   # 中長：兩側下到臉頰
        d.rectangle([x0, hy + 1, x0, hy + 3], fill=hair)
        d.rectangle([x1, hy + 1, x1, hy + 3], fill=hair)
    elif style == 2:                   # 馬尾：右側多一束垂到頸邊
        d.rectangle([x0, hy + 1, x0, hy + 2], fill=hair)
        d.rectangle([x1, hy + 1, x1 + 1, hy + 4], fill=hair)
        d.point((int(x1), int(hy + 4)), fill=hair_hi)
    else:                              # 捲髮：兩側外擴
        d.rectangle([x0 - 1, hy + 1, x0, hy + 3], fill=hair)
        d.rectangle([x1, hy + 1, x1 + 1, hy + 3], fill=hair)
    # 瀏海：不對稱的斜分界（整條水平線 = 碗型公仔頭）
    d.polygon([(cx - 3, hy + 1), (cx, hy + 1),
               (cx + 2, hy + 2), (cx - 3, hy + 2)], fill=hair)
    # 頭頂高光
    d.point((int(cx - 1), int(hy)), fill=hair_hi)
    d.point((int(cx), int(hy)), fill=hair_hi)


def person(frame=0, variant=0, kind="staff", facing="down"):
    """
    人物 16×20。用繪圖指令組出來，不是字元點陣。
    frame 0/1/2 = 走路影格；facing down/left/right/up
    """
    if facing == "right":
        return person(frame, variant, kind, "left").transpose(Image.FLIP_LEFT_RIGHT)
    if facing == "up":
        return person_back(frame, variant, kind)

    img = blank(CHAR_W, CHAR_H)
    d = ImageDraw.Draw(img)

    idle = kind == "staff_idle"
    skin = SKINS[variant % len(SKINS)]
    hair = HAIRS[variant % len(HAIRS)]
    hair_hi = mix(hair, (255, 255, 255, 255), 0.24)
    # **員工穿同一件淺色工作襯衫（只有膚色和頭髮不同），
    # 顧客穿各種便服。** 讓員工襯衫也跟著 variant 換色會出問題：
    # 綠襯衫配紅圍裙在場景裡互相打架，看不出哪一塊是圍裙，
    # 「誰是員工」這個教學訊號就消失了。
    if kind == "customer":
        shirt = CUST_SHIRTS[variant % len(CUST_SHIRTS)]
    elif idle:
        shirt = STAFF_SHIRT
    else:
        shirt = STAFF_SHIRT
    body = P["grey"] if idle else shirt
    body_sh = shade(body, 0.80)          # 暗面：手臂
    legc = P["grey_dk"] if idle else shade(shirt, 0.58)
    shoe = mix(P["ink"], P["grey_dk"], 0.45)
    apron = P["grey_dk"] if idle else P["red"]
    apron_sh = shade(apron, 0.74)
    line = INK
    cx = 8

    # 走路：整個人浮 1px，且上前那隻腳抬起 1px。
    # 只動腿不浮動，在 3 倍縮放下看不出來在走。
    bob = 0 if frame == 0 else -1
    lift = 0 if frame == 0 else (1 if frame == 1 else -1)

    hw, sw, ww = CHAR_HEAD_W, CHAR_SHOULDER_W, CHAR_WAIST_W
    hy = int(CHAR_HEAD_TOP) + bob          # 頭描邊頂列 = y0
    fy = hy + 1                            # 頭填色頂列 = y1

    # ── 腿 + 鞋（先畫，身體的剪影會蓋住腿的上端）──
    # 鞋比腿寬 1px。鞋畫到和剪影同寬 = 小丑鞋。
    for lx, up in ((cx - 3, 0), (cx + 1, lift)):
        ly = 15 + bob - (1 if up > 0 else 0)
        sy = 18 + bob - (1 if up > 0 else 0)
        # 腿的剪影只畫外側，**內側留空**。
        # 之前左右兩條腿的剪影在中間相接（x7 和 x8），加上長褲本身
        # 就是深色 → y15–19 整片變成一塊黑，看不出有兩條腿。
        d.rectangle([lx - 1, ly - 1, lx + 1, 17 + bob], fill=line)
        d.rectangle([lx, ly, lx + 1, 17 + bob], fill=legc)
        # 鞋：比腿寬 1px，且左右兩隻錯開 1px（站立時腳跟併攏、腳尖外張）
        d.rectangle([lx - 2, sy, lx + 2, 19 + bob], fill=line)
        d.rectangle([lx - 1, sy, lx + 2, 19 + bob], fill=shoe)

    # ── 身體 ──
    # 有肩線的多邊形。圓角矩形做出來是「藥丸」形，沒有肩線，
    # 看起來像沒有手臂的人。
    bx0, bx1 = cx - sw / 2, cx + sw / 2          # 肩 x3–13
    wx0, wx1 = cx - ww / 2, cx + ww / 2          # 腰 x4–11
    by0, by1 = 9 + bob, 15 + bob

    def torso(inset, fill):
        d.polygon([(bx0 + inset, by0 + inset), (bx1 - inset, by0 + inset),
                   (wx1 - inset, by1 - inset), (wx0 + inset, by1 - inset)],
                  fill=fill)

    torso(0, line)      # 剪影：整層先鋪深色，描邊才均勻 1px
    torso(1, body)      # 填色
    # 手臂：暗一階 + 1px 深色分隔線。只用線不變色 → 手臂像身體的邊；
    # 只變色沒線 → 和軀幹融成一團。兩者都要。
    d.polygon([(bx0 + 1, by0 + 1), (bx0 + 3, by0 + 1),
               (wx0 + 2, by1 - 1), (wx0 + 1, by1 - 1)], fill=body_sh)
    d.polygon([(bx1 - 1, by0 + 1), (bx1 - 3, by0 + 1),
               (wx1 - 2, by1 - 1), (wx1 - 1, by1 - 1)], fill=body_sh)
    d.line([(bx0 + 3, by0 + 2), (wx0 + 2, by1 - 1)], fill=line)
    d.line([(bx1 - 3, by0 + 2), (wx1 - 2, by1 - 1)], fill=line)
    # 手：膚色，在手臂末端
    d.rectangle([bx0 + 1, by1 - 3, bx0 + 2, by1 - 2], fill=skin)
    d.rectangle([bx1 - 2, by1 - 3, bx1 - 1, by1 - 2], fill=skin)
    # 領口：1px 較亮，避免脖子直接撞上肩膀
    d.point((cx - 1, by0 + 1), fill=mix(body, (255, 255, 255, 255), 0.32))
    d.point((cx, by0 + 1), fill=mix(body, (255, 255, 255, 255), 0.32))

    if kind == "staff":
        # 圍裙。**這是「誰是員工」的唯一視覺線索**，所以要蓋滿整個前身，
        # 不能只畫胸前一條窄帶——場景裡人物只有 20px 高，
        # 窄帶會被手臂和陰影吃掉，看不出誰穿著圍裙。
        d.polygon([(cx - 2, by0 + 2), (cx + 1, by0 + 2),
                   (cx + 3, by1 - 1), (cx - 4, by1 - 1)], fill=apron_sh)
        d.polygon([(cx - 2, by0 + 3), (cx + 1, by0 + 3),
                   (cx + 2, by1 - 2), (cx - 3, by1 - 2)], fill=apron)
        # 腰帶：整條圍裙唯一的亮色，把圍裙和褲子分開
        d.line([(cx - 4, by1 - 2), (cx + 3, by1 - 2)],
               fill=mix(apron, (255, 255, 255, 255), 0.34))
        # 口袋：一道暗線，讓圍裙不是一整塊色
        d.line([(cx - 1, by1 - 3), (cx + 1, by1 - 3)], fill=apron_sh)
    if idle:
        # 叉腰：手肘往內收到腰上，輪廓變窄 = 「沒事做」的姿勢
        d.rectangle([wx0 + 1, by1 - 3, wx0 + 2, by1 - 2], fill=skin)
        d.rectangle([wx1 - 2, by1 - 3, wx1 - 1, by1 - 2], fill=skin)

    # ── 脖子（1px）──
    # 沒有脖子，頭會直接坐在肩膀上，看起來像沒有身體的人頭。
    d.rectangle([cx - 1, hy + 8, cx, hy + 8], fill=shade(skin, 0.78))

    # ── 頭（最後畫）──
    d.ellipse([cx - hw / 2 - 1, hy, cx + hw / 2 + 1, hy + 8], fill=line)
    d.ellipse([cx - hw / 2, fy, cx + hw / 2, hy + 7], fill=skin)
    _hair_style(d, cx, fy, hw, hair, hair_hi, variant)
    ey = fy + FACE_EYE_Y - 1                        # 相對於頭填色的頂列
    ey = fy + 3                                      # y4
    if idle:
        # 低頭：眼睛變橫線。「沒事做」最直接的畫法。
        d.line([(cx - 2, ey), (cx - 1, ey)], fill=line)
        d.line([(cx + 1, ey), (cx + 2, ey)], fill=line)
    else:
        # 1×2 直眼。**不要用 2×1 橫眼**：在 9px 寬的臉上，
        # 兩條 2px 的橫黑會並成一整條 → 變成墨鏡。
        # 直排的兩點之間有臉色夾著，才像眼睛。
        d.rectangle([cx - 2, ey, cx - 2, ey + 1], fill=line)
        d.rectangle([cx + 1, ey, cx + 1, ey + 1], fill=line)
    # 嘴：1px，膚色暗一階（不是墨色），眼睛下方留一列空白
    d.point((cx, fy + 5), fill=shade(skin, 0.58))
    return img


def person_back(frame=0, variant=0, kind="staff"):
    """背面：整個頭都是頭髮，看不到五官。玩家往北走時會看到。"""
    img = blank(CHAR_W, CHAR_H)
    d = ImageDraw.Draw(img)
    hair = HAIRS[variant % len(HAIRS)]
    hair_hi = mix(hair, (255, 255, 255, 255), 0.24)
    shirt = STAFF_SHIRT if kind != "customer" else CUST_SHIRTS[variant % len(CUST_SHIRTS)]
    body = P["grey"] if kind == "staff_idle" else shirt
    body_sh = shade(body, 0.80)
    line = INK
    cx = 8
    bob = 0 if frame == 0 else -1
    lift = 0 if frame == 0 else (1 if frame == 1 else -1)
    hw, sw, ww = CHAR_HEAD_W, CHAR_SHOULDER_W, CHAR_WAIST_W
    hy = int(CHAR_HEAD_TOP) + bob

    for lx, up in ((cx - 3, 0), (cx + 1, lift)):
        ly = 15 + bob - (1 if up > 0 else 0)
        sy = 18 + bob - (1 if up > 0 else 0)
        d.rectangle([lx - 1, ly - 1, lx + 1, 17 + bob], fill=line)
        d.rectangle([lx, ly, lx + 1, 17 + bob], fill=shade(shirt, 0.58))
        d.rectangle([lx - 2, sy, lx + 2, 19 + bob], fill=line)
        d.rectangle([lx - 1, sy, lx + 2, 19 + bob],
                    fill=mix(P["ink"], P["grey_dk"], 0.45))

    bx0, bx1 = cx - sw / 2, cx + sw / 2
    wx0, wx1 = cx - ww / 2, cx + ww / 2
    by0, by1 = 9 + bob, 15 + bob

    def torso(inset, fill):
        d.polygon([(bx0 + inset, by0 + inset), (bx1 - inset, by0 + inset),
                   (wx1 - inset, by1 - inset), (wx0 + inset, by1 - inset)],
                  fill=fill)

    torso(0, line)
    torso(1, body)
    d.polygon([(bx0 + 1, by0 + 1), (bx0 + 3, by0 + 1),
               (wx0 + 2, by1 - 1), (wx0 + 1, by1 - 1)], fill=body_sh)
    d.polygon([(bx1 - 1, by0 + 1), (bx1 - 3, by0 + 1),
               (wx1 - 2, by1 - 1), (wx1 - 1, by1 - 1)], fill=body_sh)
    d.line([(bx0 + 3, by0 + 2), (wx0 + 2, by1 - 1)], fill=line)
    d.line([(bx1 - 3, by0 + 2), (wx1 - 2, by1 - 1)], fill=line)

    # 背面的頭：整顆是頭髮，下緣是橢圓弧（後腦勺），不是方塊
    d.ellipse([cx - hw / 2 - 1, hy, cx + hw / 2 + 1, hy + 8], fill=line)
    d.ellipse([cx - hw / 2, hy + 1, cx + hw / 2, hy + 7], fill=hair)
    d.point((cx - 1, hy + 2), fill=hair_hi)
    d.point((cx, hy + 2), fill=hair_hi)
    return img


def person_turned(variant=0, kind="staff"):
    """客人拿到飲料、轉身離開的樣子。手上要拿杯子。"""
    img = person(0, variant, kind, "left")
    c = finished_cup(variant % len(TEAS))
    img.paste(c, (10, 9), c)
    return img


def person_left_sad(variant=0):
    """沒買到、轉身走掉的客人：低頭 + 手上空蕩蕩。"""
    img = person_turned(variant, "customer")
    d = ImageDraw.Draw(img)
    # 頭上畫三點（空手而歸的符號）
    for i in range(3):
        d.point((2 + i * 2, 1), fill=(150, 146, 142, 255))
    return img


# ── 組裝 ──────────────────────────────────────────────────

registry = {}


def put(img, name):
    registry[name] = img
    return img


def boss(frame=0, facing="down"):
    """
    老闆（玩家角色）。學生用方向鍵走動的就是他。

    為什麼要一個可走動的老闆，而不���是點面板：
      教學文件的核心是「每個好選擇都有代價」。走動本身就是代價——
      從吧檯走到貨架要走 5 步，走到辦公室要走 8 步。
      讓「做決定」有移動成本，學生就不會覺得三個格是免費的。
      這是 SimCity 與 Gather Town 都有的設計：距離就是一種成本。

    視覺上和員工區分：老闆穿深色西裝、沒有圍裙、頭髮有點亂。
    """
    img = person(frame, 0, "customer", facing)   # 借人物的骨架
    d = ImageDraw.Draw(img)
    # 西裝外套
    d.rectangle([4, 9, 11, 14], fill=(58, 62, 78, 255))
    d.line([(4, 9), (11, 9)], fill=INK)
    d.line([(4, 9), (4, 14)], fill=INK)
    d.line([(11, 9), (11, 14)], fill=INK)
    # 襯衫領口
    d.line([(7, 9), (8, 12)], fill=(230, 228, 222, 255))
    d.line([(8, 9), (7, 12)], fill=(230, 228, 222, 255))
    # 領帶
    d.point((8, 11), fill=P["red"])
    d.point((8, 12), fill=P["red"])
    d.point((8, 13), fill=P["red"])
    # 頭髮亂一點（員工是整齊的瀏海）
    d.point((2, 3), fill=INK)
    d.point((13, 3), fill=INK)
    d.point((3, 1), fill=INK)
    d.point((12, 1), fill=INK)
    return img


def shadow():
    """
    落地陰影（16×6）。每個人物腳下都要疊一張。
    沒有陰影的人物會看起來像貼紙浮在牆面上——這是最常見的
    「 amateur pixel art 感」來源，寧可多畫一張也不能省。
    """
    img = blank(TILE, 6)
    d = ImageDraw.Draw(img)
    d.ellipse([2, 0, TILE - 3, 5], fill=(43, 33, 24, 62))
    d.ellipse([4, 1, TILE - 5, 4], fill=(43, 33, 24, 55))
    return img


def build():
    # 地板與牆
    for k in ("plain", "alt", "back", "wait"):
        put(floor_tile(k), f"floor_{k}")
    put(wall_piece(), "wall")
    put(side_wall(), "wall_side")
    put(shadow(), "shadow")
    put(wall_cabinets(), "cabinets")
    put(mat(), "mat_wide")
    put(mat(16, 12, (150, 130, 170, 255)), "mat_narrow")
    put(staff_marker(), "bay")

    # 配料盒：4 種口味 × 3 階存量（滿／半／空）。
    # 三階就夠讀——再多階學生在 3 倍放大下分辨不出來。
    for i in range(len(TOPPINGS)):
        for lvl, fill in (("full", 1.0), ("half", 0.45), ("empty", 0.0)):
            put(topping_box(i, fill), f"bin{i}_{lvl}")
    for i in range(len(TEAS)):
        put(finished_cup(i), f"cup{i}")
    # 吧檯依「有幾個茶桶有人在用」產生不同版本
    for a in range(COUNTER_BAYS + 1):
        put(counter_full(a), f"counter_{a}")
    # 店面：整條寬度，所以要另外產生
    put(storefront(14 * TILE, 26), "store")
    put(menu_lightbox(), "menu")
    put(plant(), "plant")
    put(ice_machine(), "ice")
    put(pendant_lamp(), "lamp")
    put(wall_clock(), "clock")

    # 員工 4 種外觀 × 3 影格 × 2 方向
    for v in range(4):
        for f in range(3):
            put(person(f, v, "staff", "down"), f"staff_{v}_{f}_down")
            put(person(f, v, "staff", "left"), f"staff_{v}_{f}_left")
        put(person(0, v, "staff_idle", "down"), f"idle_{v}_down")
    # 客人 6 種外觀 × 3 影格 × 2 方向
    for v in range(6):
        for f in range(3):
            put(person(f, v, "customer", "down"), f"cust_{v}_{f}_down")
            put(person(f, v, "customer", "left"), f"cust_{v}_{f}_left")
    # 拿到飲料 / 沒買到
    for v in range(6):
        put(person_turned(v, "customer"), f"served_{v}")
    for v in range(3):
        put(person_left_sad(v), f"left_{v}")
    # 老闆（玩家）
    for f in range(3):
        put(boss(f, "down"), f"boss_{f}_down")
        put(boss(f, "left"), f"boss_{f}_left")
    for facing in ("up", "right"):
        for f in range(3):
            img = boss(f, "left")
            if facing == "up":
                d = ImageDraw.Draw(img)
                d.rectangle([4, 2, 11, 5], fill=HAIRS[0])   # 背面：只有頭髮
                d.line([(6, 4), (7, 4)], fill=P["ink"])
                d.line([(9, 4), (10, 4)], fill=P["ink"])
            put(img, f"boss_{f}_{facing}")

    # 打包：橫向排列，1px 間距
    items = list(registry.items())
    pad = 1
    x = pad
    max_h = max(img.height for _, img in items)
    placements = []
    for name, img in items:
        placements.append({"name": name, "x": x, "y": 0,
                           "w": img.width, "h": img.height})
        x += img.width + pad
    sheet = Image.new("RGBA", (x + pad, max_h + pad * 2), (0, 0, 0, 0))
    for (name, img), pl in zip(items, placements):
        sheet.paste(img, (pl["x"], pl["y"] + pad), img)

    os.makedirs(PUBLIC, exist_ok=True)
    sheet.save(SHEET_PATH)

    meta = {
        "sheet": "shop-sprites.png",
        "scale": SCALE,
        "tile": TILE,
        "charW": CHAR_W,
        "charH": CHAR_H,
        "sprites": {pl["name"]: {k: pl[k] for k in ("x", "y", "w", "h")}
                    for pl in placements},
    }
    # 結尾要有換行。public/ 下的 JSON 會進版控，而 biome 會檢查
    # public/ 的格式——少一個換行字元就是 lint 錯誤。
    # 這裡補上，就不用每次產生完再去手動修一個產生的檔案。
    with open(JSON_PATH, "w") as f:
        json.dump(meta, f, indent=2)
        f.write("\n")

    print(f"精靈圖  {sheet.width}×{sheet.height}　{len(registry)} 個影格　→ {SHEET_PATH}")
    print(f"中繼資料                                          → {JSON_PATH}")


if __name__ == "__main__":
    build()
