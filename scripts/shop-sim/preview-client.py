#!/usr/bin/env python3
"""
用「客戶端那份資料」重畫一次，確認畫面真的長出來。

為什麼 preview-scene.py 不夠
---------------------------
preview-scene.py 是我手寫的鋪法，而瀏覽器跑的是 scene.ts 裡的
drawShop()。兩份實作如果漂移，預覽就會騙人——我會看到一張好看的圖，
學生開瀏覽器卻是另一個樣子。

所以這一支是「照著 scene.ts 的座標與 sprite 名稱重畫」，
而且是從 shop-sprites.json 讀座標（不是自己寫死）。
sprite 名稱清單直接從 scene.ts 的原始碼抽出來，
少一個名字或少一個影格，這裡就會畫成空白。

輸出 preview-client.png：這應該和學生在瀏覽器裡看到的畫面一致。
"""

import json
import os
import re
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(__file__)
PUBLIC = os.path.normpath(os.path.join(HERE, "..", "..", "public"))
SCENE_TS = os.path.join(HERE, "scene.ts")
SCALE = 3

with open(os.path.join(PUBLIC, "shop-sprites.json")) as f:
    META = json.load(f)
SHEET = Image.open(os.path.join(PUBLIC, META["sheet"])).convert("RGBA")
SRC = open(SCENE_TS, encoding="utf-8").read()

TILE = META["tile"]


def const(name, cast=int):
    """從 scene.ts 讀出 MAP 的常數，而不是在這裡重複寫一份。"""
    m = re.search(rf"\b{name}:\s*([^,\n]+),", SRC)
    if not m:
        raise KeyError(f"scene.ts 找不到 {name}")
    expr = m.group(1).strip()
    if not re.fullmatch(r"[\d\s*+\-()]+", expr):
        raise ValueError(f"{name} 的算式超出預期格式：{expr!r}")
    return cast(eval(expr, {"__builtins__": {}}, {}))     # noqa: S307 - 格式已驗證


MAP = {
    "COLS": const("COLS"),
    "ROWS": const("ROWS"),
    "WALL_H": const("WALL_H"),
    "CAB_X": const("CAB_X"),
    "CAB_Y": const("CAB_Y"),
    "MENU_X": const("MENU_X"),
    "MENU_Y": const("MENU_Y"),
    "ICE_X": const("ICE_X"),
    "ICE_Y": const("ICE_Y"),
    "COUNTER_X": const("COUNTER_X"),
    "COUNTER_Y": const("COUNTER_Y"),
    "BAY0": const("BAY0"),
    "BOX_Y": const("BOX_Y"),
    "BOX_X0": const("BOX_X0"),
    "BINS": const("BINS"),
    "BOX_STEP": const("BOX_STEP"),
    "STAFF_FEET": const("STAFF_FEET"),
    "STAFF_Y": const("STAFF_Y"),
    "IDLE_X0": const("IDLE_X0"),
    "IDLE_N": const("IDLE_N"),
    "QUEUE_Y": const("QUEUE_Y"),
    "QUEUE_X0": const("QUEUE_X0"),
    "QUEUE_N": const("QUEUE_N"),
    "STORE_Y": const("STORE_Y"),
    "DOOR_X": const("DOOR_X"),
    "DOOR_Y": const("DOOR_Y"),
    "BAYS": const("BAYS"),
}

W, H = MAP["COLS"] * TILE, MAP["ROWS"] * TILE
missing = []


def spr(img, name, x, y):
    s = META["sprites"].get(name)
    if s is None:
        missing.append(name)
        return
    sub = SHEET.crop((s["x"], s["y"], s["x"] + s["w"], s["y"] + s["h"]))
    img.paste(sub, (x, y), sub)


def load_font(size):
    """
    找一個真的有中文字型的字型檔。

    為什麼不能用 PIL 預設字型：它沒有 CJK，每個中文字都畫成空心方框，
    而且量不出寬度。結果是「氣泡大小」這種純粹的字型問題，
    在預覽裡會表現成「氣泡有半個店那麼寬」——那是假的，
    但會讓人以為 drawShop 算錯了。用真的字型才量得準。
    """
    for path in (
        "/System/Library/Fonts/Hiragino Sans GB.ttc",
        "/System/Library/Fonts/STHeiti Medium.ttc",
        "/System/Library/Fonts/Supplemental/Songti.ttc",
    ):
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return None


FONT = load_font(11)
if FONT is None:
    print("★ 找不到中文字型：氣泡大小的預覽不可信（遊戲本身不受影響）")


def draw(st, label):
    img = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    d = ImageDraw.Draw(img)

    # 1. 地板：單一純色（格線在小房間裡會被讀成條紋）
    d.rectangle([0, 0, W, H], fill=(226, 214, 192, 255))
    # 2. 後牆 + 側牆
    for c in range(MAP["COLS"]):
        spr(img, "wall", c * TILE, 0)
    for y in range(0, H, TILE):
        d.rectangle([0, y, 4, y + TILE - 1], fill=(214, 198, 172, 255))
        d.rectangle([W - 5, y, W - 1, y + TILE - 1], fill=(200, 183, 156, 255))
    d.rectangle([0, H - 2, W, H], fill=(20, 18, 16, 255))

    # 3. 後牆：吊櫃 + 菜單燈箱 + 製冰機
    spr(img, "cabinets", MAP["CAB_X"], MAP["CAB_Y"])
    spr(img, "menu", MAP["MENU_X"], MAP["MENU_Y"])
    spr(img, "plant", 22 * TILE - 16, MAP["WALL_H"] - 30)
    spr(img, "ice", MAP["ICE_X"], MAP["ICE_Y"])

    # 4. 吧檯（工位=茶桶）+ 配料盒
    spr(img, f"counter_{st['onStation']}", MAP["COUNTER_X"], MAP["COUNTER_Y"])
    full = round(MAP["BINS"] * st["shelf"] / max(1, st["shelfMax"]))
    for i in range(MAP["BINS"]):
        lv = "full" if i < full else ("half" if i == full else "empty")
        spr(img, f"bin{i}_{lv}", MAP["BOX_X0"] + i * MAP["BOX_STEP"], MAP["BOX_Y"])

    # 5. 閒置員工（先畫 → 被檯面蓋住下半身）
    for i in range(st["idle"]):
        x = MAP["IDLE_X0"] + i * TILE
        spr(img, "shadow", x, MAP["STAFF_FEET"] - 4)
        spr(img, f"idle_{i % 4}_down", x, MAP["STAFF_Y"])

    # 6. 有工位的員工
    for i in range(st["onStation"]):
        x = MAP["BAY0"] + i * TILE
        spr(img, "shadow", x, MAP["STAFF_FEET"] - 4)
        spr(img, f"staff_{i % 4}_{i % 3}_down", x, MAP["STAFF_Y"])

    # 7. 店面：玻璃 + 門 + 人行道
    spr(img, "store", 0, MAP["STORE_Y"])

    # 8. 客人在檯前等
    for i in range(min(st["queue"], MAP["QUEUE_N"])):
        x = MAP["QUEUE_X0"] + i * TILE
        spr(img, "shadow", x, MAP["QUEUE_Y"])
        spr(img, f"cust_{i % 6}_{0 if i else 1}_left", x, MAP["QUEUE_Y"] - 18)

    # 9. 買不到走掉的人
    for i in range(st["turned"]):
        x = MAP["DOOR_X"] - 8 - i * 18
        s_ = META["sprites"][f"left_{i % 3}"]
        body = SHEET.crop((s_["x"], s_["y"], s_["x"] + s_["w"], s_["y"] + s_["h"])).copy()
        body.putalpha(body.split()[3].point(lambda v: int(v * 0.75)))
        img.paste(body, (x, MAP["QUEUE_Y"] - 4), body)

    # 10. 老闆
    bx, by = st["boss"]
    spr(img, "shadow", bx, by + 16)
    spr(img, "boss_0_down", bx, by - 2)

    # 11. 狀態提示（和 drawShop 的氣泡同樣規則）
    if st.get("note"):
        txt = st["note"]
        max_w, pad, line_h = 150, 6, 13
        if FONT is None:
            lines = [txt]; w = min(max_w, len(txt) * 11 + pad * 2)
        else:
            lines, cur = [], ""
            for ch in txt:
                if d.textlength(cur + ch, font=FONT) > max_w - pad * 2:
                    lines.append(cur); cur = ch
                else:
                    cur += ch
            if cur: lines.append(cur)
            w = min(max_w, max(d.textlength(l, font=FONT) for l in lines) + pad * 2)
        h = len(lines) * line_h + 6
        bx0 = max(2, min(W - w - 2, bx + 22))
        by0 = max(2, min(H - h - 2, by - h - 2))
        tone = {"bad": (232, 122, 96, 245), "warn": (255, 232, 176, 245),
                "info": (247, 242, 228, 245)}[st.get("noteTone", "info")]
        d.rectangle([bx0, by0, bx0 + w, by0 + h], fill=tone, outline=(43, 33, 24, 255))
        ty = max(by0 + 2, min(by0 + h - 6, by + 6))
        d.polygon([(bx0, ty), (bx0 - 5, ty + 3), (bx0, ty + 6)], fill=tone)
        if FONT is not None:
            for i, l in enumerate(lines):
                d.text((bx0 + pad, by0 + 4 + i * line_h), l, font=FONT, fill=(43, 33, 24, 255))

    out = img.resize((W * SCALE, H * SCALE), Image.NEAREST)
    if label:
        dd = ImageDraw.Draw(out)
        dd.text((6, 6), label, fill=(43, 33, 24, 255))
    path = os.path.join(HERE, f"preview-client{label and '-' + label}.png")
    out.save(path)
    return path


if __name__ == "__main__":
    print("MAP（從 scene.ts 讀出）:", MAP)
    outs = [
        draw({"shelf": 40000, "shelfMax": 40000, "onStation": 4, "idle": 0,
              "queue": 4, "turned": 0, "boss": (7 * 16, 6 * 16 + 6),
              "note": None}, "healthy"),
        draw({"shelf": 12000, "shelfMax": 40000, "onStation": 3, "idle": 1,
              "queue": 4, "turned": 2, "boss": (10 * 16, 6 * 16 + 2),
              "note": "1 個人沒有工位", "noteTone": "warn"}, "problem"),
        draw({"shelf": 0, "shelfMax": 40000, "onStation": 4, "idle": 0,
              "queue": 1, "turned": 3, "boss": (5 * 16, 6 * 16 + 10),
              "note": "料桶空了，客人等不到珍珠", "noteTone": "bad"}, "soldout"),
    ]
    for p in outs:
        print(p)
    if missing:
        print("★ 缺少 sprite:", sorted(set(missing)))
        raise SystemExit(1)
    print("所有 sprite 名稱都找得到。")
