#!/usr/bin/env python3
# catcall – call a cat to the terminal

import io
import math
import platform
import shutil
import sys
from typing import Tuple

try:
    import requests
    from PIL import Image
except ImportError:
    print("Please install dependencies: pip install pillow requests", file=sys.stderr)
    sys.exit(1)

# --- justparchment8 palette ---
PALETTE_HEX = [
    "#292418", "#524839", "#73654a", "#8b7d62",
    "#a48d6a", "#bda583", "#cdba94", "#e6ceac"
]
PALETTE = [tuple(int(h[i:i+2], 16) for i in (1,3,5)) for h in PALETTE_HEX]

RESET = "\x1b[0m"

def enable_windows_ansi():
    if platform.system().lower().startswith("win"):
        try:
            import ctypes
            kernel32 = ctypes.windll.kernel32
            h = kernel32.GetStdHandle(-11)
            mode = ctypes.c_uint32()
            kernel32.GetConsoleMode(h, ctypes.byref(mode))
            kernel32.SetConsoleMode(h, mode.value | 0x0004)
        except Exception:
            pass

def ansi_fg(r,g,b): return f"\x1b[38;2;{r};{g};{b}m"
def ansi_bg(r,g,b): return f"\x1b[48;2;{r};{g};{b}m"

def srgb_to_linear(c):
    c /= 255
    return c/12.92 if c <= 0.04045 else ((c+0.055)/1.055)**2.4

def color_distance(a,b):
    la, lb = [srgb_to_linear(x) for x in a], [srgb_to_linear(x) for x in b]
    dr, dg, db = la[0]-lb[0], la[1]-lb[1], la[2]-lb[2]
    return math.sqrt(0.3*dr*dr + 0.59*dg*dg + 0.11*db*db)

def nearest_palette(rgb: Tuple[int,int,int]) -> Tuple[int,int,int]:
    return min(PALETTE, key=lambda p: color_distance(rgb,p))

def fetch_cat(width=160, height=160, tags=None):
    url = "https://cataas.com/cat"
    if tags:
        url += "/" + "/".join(tags)
    # Request at 2× to give LANCZOS more source detail before quantising.
    params = {"width": str(width * 2), "height": str(height * 2)}
    headers = {"Accept": "image/jpeg,image/png;q=0.9"}
    r = requests.get(url, params=params, headers=headers, timeout=30)
    r.raise_for_status()
    img = Image.open(io.BytesIO(r.content))
    if getattr(img, "is_animated", False):
        img.seek(0)
    return img.convert("RGB").resize((width, height), Image.LANCZOS)

def quantize(img):
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            px[x,y] = nearest_palette(px[x,y])
    return img

def print_highres_ascii(img):
    """Half-block high-res: each terminal row prints 2 image rows."""
    enable_windows_ansi()
    w,h = img.size
    px = img.load()
    for y in range(0, h - 1, 2):
        line=[]
        for x in range(w):
            top = px[x,y]
            bot = px[x,y+1]
            line.append(f"{ansi_fg(*top)}{ansi_bg(*bot)}▀")
        line.append(RESET)
        print("".join(line))
    print(RESET, end="")

def compute_fit_dims(cols, rows, margin_cols=0, margin_rows=0, force_square=True):
    """
    Fit image to terminal using half-block rendering.
    - Max terminal columns used: cols - margin_cols
    - Max terminal rows used: rows - margin_rows
    - Half-block: 1 terminal row = 2 image rows → image_height_px <= (rows - margin_rows) * 2
    - Term cells are ~2:1 tall, but half-block makes effective pixel aspect ~1:1 → square is fine by default.
    """
    usable_cols = max(1, cols - margin_cols)
    usable_rows = max(1, rows - margin_rows)

    max_img_w = usable_cols
    max_img_h = usable_rows * 2

    if force_square:
        side = min(max_img_w, max_img_h)
        return side, side
    else:
        return max_img_w, max_img_h

def main():
    import argparse
    p = argparse.ArgumentParser(description="Show a high-res ASCII cat using the #justparchment8 palette (auto-fits to terminal).")
    p.add_argument("tags", nargs="*", help="Optional tags (cute, orange, etc).")
    p.add_argument("-w","--width", type=int, default=None, help="Output width in characters (overrides auto-fit).")
    p.add_argument("-H","--height-px", type=int, default=None, help="Image height in pixels (overrides auto-fit)")
    p.add_argument("--no-fit", action="store_true", help="Disable auto-fit and use width/height as-is.")
    p.add_argument("--margin-cols", type=int, default=2, help="Column margin when auto-fitting (default: 2).")
    p.add_argument("--margin-rows", type=int, default=1, help="Row margin when auto-fitting (default: 1).")
    p.add_argument("--no-square", action="store_true", help="When auto-fitting, use max rectangle instead of square.")
    args = p.parse_args()

    if args.no_fit and args.width and args.height_px:
        img_w, img_h = args.width, args.height_px
    else:
        cols, rows = shutil.get_terminal_size((100, 40))
        if args.width is not None or args.height_px is not None:
            max_w, max_h = compute_fit_dims(cols, rows, args.margin_cols, args.margin_rows, not args.no_square)
            img_w = min(args.width if args.width is not None else max_w, max_w)
            img_h = min(args.height_px if args.height_px is not None else (img_w if (not args.no_square) else max_h), max_h)
            if args.height_px is None and not args.no_square:
                img_h = img_w
        else:
            img_w, img_h = compute_fit_dims(cols, rows, args.margin_cols, args.margin_rows, force_square=not args.no_square)

    img = fetch_cat(img_w, img_h, args.tags)
    if img.size != (img_w, img_h):
        img = img.resize((img_w, img_h), Image.LANCZOS)

    img = quantize(img)
    print_highres_ascii(img)

if __name__ == "__main__":
    main()

