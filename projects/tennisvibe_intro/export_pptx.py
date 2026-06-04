# -*- coding: utf-8 -*-
"""
Fallback: SVG -> PNG -> PPTX (16:9, native PowerPoint 2016+)
Used because Trae sandbox blocks git clone of the upstream ppt-master repo,
so the official `svg_to_pptx.py` script is unavailable. This script performs
the same end result: one slide per SVG, full-bleed, editable image.

Input : projects/tennisvibe_intro/svg_output/page_*.svg
Output: projects/tennisvibe_intro/exports/TennisVibe_项目介绍.pptx
"""
import glob
import os
from pathlib import Path
import io
import resvg_py
from PIL import Image
from pptx import Presentation
from pptx.util import Inches, Emu

PROJECT_DIR = Path(r"D:\workspace\vb\projects\tennisvibe_intro")
SVG_DIR     = PROJECT_DIR / "svg_output"
PNG_DIR     = PROJECT_DIR / "png_cache"
EXPORT_DIR  = PROJECT_DIR / "exports"
EXPORT_PATH = EXPORT_DIR / "TennisVibe_项目介绍.pptx"

# 16:9 widescreen 13.333" x 7.5" (matches SVG viewBox 1280x720)
SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)

def svg_to_png(svg_path: Path, png_path: Path, target_w=1920, target_h=1080):
    """
    SVG -> PNG via resvg-py (pure Rust, no system cairo needed).
    Target 1920x1080 (2x of 1280x720 viewBox for crispness).
    """
    with open(svg_path, "rb") as f:
        svg_bytes = f.read()
    png_bytes = resvg_py.svg_to_bytes(
        svg_string=svg_bytes.decode("utf-8"),
        width=target_w,
        height=target_h,
        background="#FAFAF7",
    )
    # resvg returns PNG bytes; write directly
    with open(png_path, "wb") as f:
        f.write(png_bytes)

def build_pptx():
    PNG_DIR.mkdir(parents=True, exist_ok=True)
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)

    svgs = sorted(SVG_DIR.glob("page_*.svg"))
    print(f"[1/3] Found {len(svgs)} SVG pages")

    # 1) Convert SVG -> PNG
    pngs = []
    for svg in svgs:
        png = PNG_DIR / (svg.stem + ".png")
        svg_to_png(svg, png)
        pngs.append(png)
        print(f"   ✓ {svg.name} -> {png.name}")
    print(f"[2/3] Converted {len(pngs)} PNGs to {PNG_DIR}")

    # 2) Build PPTX (16:9 widescreen)
    prs = Presentation()
    prs.slide_width  = SLIDE_W
    prs.slide_height = SLIDE_H
    blank_layout = prs.slide_layouts[6]  # Blank

    for png in pngs:
        slide = prs.slides.add_slide(blank_layout)
        # Full-bleed image (0,0) -> (slide_w, slide_h)
        slide.shapes.add_picture(
            str(png), Emu(0), Emu(0),
            width=SLIDE_W, height=SLIDE_H
        )

    prs.save(EXPORT_PATH)
    print(f"[3/3] PPTX written: {EXPORT_PATH}")
    print(f"     Size: {os.path.getsize(EXPORT_PATH)/1024:.1f} KB")

if __name__ == "__main__":
    build_pptx()
