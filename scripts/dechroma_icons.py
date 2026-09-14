import glob
import os

import numpy as np
from PIL import Image, ImageFilter

RAW_DIR = "/app/public/icons/raw"
OUT_DIR = "/app/public/icons"

# hue-based keys: magenta ~ (300deg), lime-green ~ (120deg), cyan ~ (180deg)
KEY_HUES = [300 / 360.0, 120 / 360.0, 180 / 360.0]
HUE_TOLERANCE = 0.06
MIN_SAT = 0.35


def rgb_to_hsv_np(arr):
    return np.array(Image.fromarray(arr, "RGB").convert("HSV"), dtype=np.float32) / 255.0


def process(path):
    name = os.path.splitext(os.path.basename(path))[0]
    img = Image.open(path).convert("RGB")
    arr = np.array(img)
    hsv = rgb_to_hsv_np(arr)
    hue, sat, val = hsv[..., 0], hsv[..., 1], hsv[..., 2]

    key_mask = np.zeros(hue.shape, dtype=bool)
    for k in KEY_HUES:
        diff = np.abs(hue - k)
        diff = np.minimum(diff, 1 - diff)
        key_mask |= (diff < HUE_TOLERANCE) & (sat > MIN_SAT)

    alpha = np.where(key_mask, 0, 255).astype(np.uint8)
    alpha_img = Image.fromarray(alpha, "L")
    # erode a couple px to eat the thin chroma-spill fringe ring, then feather
    alpha_img = alpha_img.filter(ImageFilter.MinFilter(5))
    alpha_img = alpha_img.filter(ImageFilter.GaussianBlur(2))

    rgba = img.convert("RGBA")
    rgba.putalpha(alpha_img)

    # crop tightly to the non-transparent content with small padding
    bbox = alpha_img.getbbox()
    if bbox:
        l, t, r, b = bbox
        pad = 6
        l = max(0, l - pad)
        t = max(0, t - pad)
        r = min(rgba.width, r + pad)
        b = min(rgba.height, b + pad)
        side = max(r - l, b - t)
        cx, cy = (l + r) // 2, (t + b) // 2
        half = side // 2 + pad
        l2, t2 = max(0, cx - half), max(0, cy - half)
        r2, b2 = min(rgba.width, cx + half), min(rgba.height, cy + half)
        rgba = rgba.crop((l2, t2, r2, b2))

    out_path = os.path.join(OUT_DIR, f"{name}.png")
    rgba.save(out_path, "PNG")
    print(f"saved {out_path} size={rgba.size}")


if __name__ == "__main__":
    for path in sorted(glob.glob(os.path.join(RAW_DIR, "*.jpg"))):
        process(path)
