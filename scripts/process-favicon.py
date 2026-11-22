#!/usr/bin/env python3
"""
Process the founder-provided favicon/avatar mark (Prompt 05B).

Input:  /home/z/my-project/upload/pasted_image_1795253036788.png  (1278x1230 RGBA)
Output:
  - src/app/icon.png        (512x512 square — Next.js app-router favicon icon)
  - src/app/favicon.ico     (multi-size 16/32/48/64 — Next.js app-router .ico)
  - public/images/paragonel-mark.png  (square mark copy, for avatar/brand use)

The source is the real Paragonel favicon/avatar icon supplied by the founder.
We center-crop to a square (preserving the mark), then emit the sizes Next.js
auto-detects for `src/app/icon.png` + `src/app/favicon.ico`.
"""
import os
from PIL import Image

SRC = "/home/z/my-project/upload/pasted_image_1795253036788.png"
ICON_PNG = "/home/z/my-project/paragonel-technologies/src/app/icon.png"
ICO = "/home/z/my-project/paragonel-technologies/src/app/favicon.ico"
MARK = "/home/z/my-project/paragonel-technologies/public/images/paragonel-mark.png"

im = Image.open(SRC).convert("RGBA")
w, h = im.size
print(f"source: {w}x{h} {im.mode}")

# Center-crop to square (the mark is nearly square; preserve proportions).
side = min(w, h)
left = (w - side) // 2
top = (h - side) // 2
square = im.crop((left, top, left + side, top + side))
print(f"square crop: {square.size[0]}x{square.size[1]}")

# icon.png — 512x512 (Next.js favicons should be <= 512).
icon512 = square.resize((512, 512), Image.LANCZOS)
icon512.save(ICON_PNG, "PNG")
print(f"wrote {ICON_PNG} ({os.path.getsize(ICON_PNG)} bytes)")

# paragonel-mark.png — 256x256 copy for avatar/brand use.
mark256 = square.resize((256, 256), Image.LANCZOS)
mark256.save(MARK, "PNG")
print(f"wrote {MARK} ({os.path.getsize(MARK)} bytes)")

# favicon.ico — multi-size.
ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
icon512.save(ICO, format="ICO", sizes=ico_sizes)
print(f"wrote {ICO} ({os.path.getsize(ICO)} bytes)")
print("done.")
