#!/usr/bin/env python3
"""
角色檢查表：把每個影格放大並畫上像素網格。

為什麼要這個：
    像素美術的問題九成是「比例」和「對比」，機械驗算（寬度、色碼數、
    影格數）一個都擋不住。頭寬是不是比肩窄、眼睛是不是在臉的 1/3 處、
    走路影格是不是真的腳在動——這些必須用眼睛看，而且要**放大**看。
    在 3 倍縮放的場景裡看不出來的問題，8 倍就一眼看得出。

    另外走路影格要並排放：靜態看影格 0 和 1 幾乎一樣，
    只有並排才看得出腳有沒有動。
"""

import json
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(__file__)
PUBLIC = os.path.normpath(os.path.join(HERE, "..", "..", "public"))
META = json.load(open(os.path.join(PUBLIC, "shop-sprites.json"), encoding="utf-8"))
SHEET = Image.open(os.path.join(PUBLIC, META["sheet"])).convert("RGBA")

FONT = None
for p in ("/System/Library/Fonts/Hiragino Sans GB.ttc",
          "/System/Library/Fonts/STHeiti Medium.ttc"):
    if os.path.exists(p):
        FONT = ImageFont.truetype(p, 11)
        break


def spr(n):
    s = META["sprites"][n]
    return SHEET.crop((s["x"], s["y"], s["x"] + s["w"], s["y"] + s["h"]))


def sheet_of(names, path, K=8, cols=6, grid=True, title=""):
    CW, CH = 16 * K, 24 * K
    rows = (len(names) + cols - 1) // cols
    label_h = 16
    top = 20 if title else 0
    img = Image.new("RGBA", (CW * cols, CH * rows + label_h * rows + top), (245, 239, 227, 255))
    d = ImageDraw.Draw(img)
    if title and FONT:
        d.text((4, 3), title, font=FONT, fill=(43, 33, 24, 255))
    for i, n in enumerate(names):
        r, c = divmod(i, cols)
        x, y = c * CW, top + r * (CH + label_h)
        if grid:
            for gx in range(17):
                d.line([(x + gx * K, y), (x + gx * K, y + CH)], fill=(228, 219, 205, 255))
            for gy in range(1, 24):
                d.line([(x, y + gy * K), (x + CW, y + gy * K)], fill=(228, 219, 205, 255))
            # 每 4px 一條粗線，方便量比例
            for gx in range(0, 17, 4):
                d.line([(x + gx * K, y), (x + gx * K, y + CH)], fill=(206, 194, 174, 255))
            for gy in range(0, 24, 4):
                d.line([(x, y + gy * K), (x + CW, y + gy * K)], fill=(206, 194, 174, 255))
        s = spr(n)
        big = s.resize((s.width * K, s.height * K), Image.NEAREST)
        img.paste(big, (x, y), big)
        if FONT:
            d.text((x + 2, y + CH + 2), n, font=FONT, fill=(43, 33, 24, 255))
    img.save(path)
    return path


if __name__ == "__main__":
    K, COLS = 8, 6
    # ① 各種角色並排
    a = sheet_of(
        ["staff_0_0_down", "staff_1_0_down", "staff_2_0_down", "staff_3_0_down",
         "cust_0_0_left", "cust_1_0_left", "cust_2_0_left", "cust_3_0_left",
         "cust_4_0_left", "cust_5_0_left", "idle_0_down", "boss_0_down"],
        os.path.join(HERE, "chars-a.png"), K, 6,
        title="各種角色　頭寬應該比肩窄")
    # ② 走路影格並排（這是「看得出在走」的關鍵）
    b = sheet_of(
        ["staff_0_0_down", "staff_0_1_down", "staff_0_2_down",
         "staff_1_0_down", "staff_1_1_down", "staff_1_2_down",
         "cust_0_0_left", "cust_0_1_left", "cust_0_2_left",
         "boss_0_down", "boss_0_up", "boss_0_left"],
        os.path.join(HERE, "chars-b.png"), K, 6,
        title="走路影格　腳的位置必須不一樣")
    # ③ 場景裡的實際大小（1 倍與 3 倍）
    img = Image.new("RGBA", (16 * 9 * 3 + 16 * 2, 20 * 3 + 40), (226, 214, 192, 255))
    d = ImageDraw.Draw(img)
    for k, lbl in ((1, "1x"), (3, "3x 遊戲實際大小")):
        s = spr("staff_0_1_down")
        s = s.resize((s.width * k, s.height * k), Image.NEAREST)
        img.paste(s, (10, 20 if k == 1 else 30), s)
    s = spr("cust_0_0_left")
    s = s.resize((s.width * 3, s.height * 3), Image.NEAREST)
    img.paste(s, (60, 30), s)
    s = spr("idle_0_down")
    s = s.resize((s.width * 3, s.height * 3), Image.NEAREST)
    img.paste(s, (110, 30), s)
    c = os.path.join(HERE, "chars-c.png")
    img.save(c)
    for p in (a, b, c):
        print(p)
