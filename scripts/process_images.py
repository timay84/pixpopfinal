#!/usr/bin/env python3
"""
Desktop Pet image processing pipeline.
Commands: clean, convert, batch, trayicon
"""

import argparse
import os
import sys
from PIL import Image
from PIL import ImageDraw, ImageFilter

WATERMARK_BOXES = {
    (1440, 1440): (1188, 1245, 1419, 1416),
    (2048, 2048): (1796, 1931, 2019, 2015),
}

BG_THRESHOLD = 240


def remove_watermark(img):
    """Set watermark region to transparent. Modifies in place."""
    size = img.size
    if size in WATERMARK_BOXES:
        x1, y1, x2, y2 = WATERMARK_BOXES[size]
    else:
        x1, y1, x2, y2 = _detect_watermark(img)
    if x1 == x2 or y1 == y2:
        return img
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    pixels = img.load()
    for x in range(x1, x2):
        for y in range(y1, y2):
            pixels[x, y] = (0, 0, 0, 0)
    return img


def _detect_watermark(img):
    """Auto-detect watermark in BR 250x200 zone by finding near-white opaque pixels."""
    w, h = img.size
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    pixels = img.load()
    x1, y1, x2, y2 = w, h, 0, 0
    found = False
    for x in range(max(0, w - 250), w):
        for y in range(max(0, h - 200), h):
            p = pixels[x, y]
            if p[3] > 150:
                r, g, b = p[0], p[1], p[2]
                if 210 < r < 255 and 210 < g < 255 and 205 < b < 255:
                    x1 = min(x1, x)
                    y1 = min(y1, y)
                    x2 = max(x2, x)
                    y2 = max(y2, y)
                    found = True
    if not found:
        return (0, 0, 0, 0)
    return (x1 - 2, y1 - 2, x2 + 3, y2 + 3)


def remove_background(img, threshold=BG_THRESHOLD):
    """Convert RGB to RGBA, setting near-white pixels to transparent. Modifies in place."""
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    pixels = img.load()
    w, h = img.size
    for x in range(w):
        for y in range(h):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            if r > threshold and g > threshold and b > threshold:
                pixels[x, y] = (r, g, b, 0)
    return img


def generate_tray_icon(base_path, output_path, size=64):
    """Generate a square tray icon from the base sprite."""
    img = Image.open(base_path)
    img = img.resize((size, size), Image.LANCZOS)
    img.save(output_path, 'PNG')


def cutout_ghost(source_path, output_path):
    """Cut the front ghost from ghostfinal.png using a smooth silhouette mask."""
    source = Image.open(source_path).convert('RGBA')
    w, h = source.size
    # Normalized control points follow the front ghost silhouette in ghostfinal.png.
    points = [
        (0.50, 0.01), (0.34, 0.05), (0.23, 0.17), (0.18, 0.34),
        (0.14, 0.55), (0.06, 0.78), (0.08, 0.86), (0.20, 0.94),
        (0.31, 0.95), (0.37, 0.88), (0.45, 0.94), (0.54, 0.96),
        (0.63, 0.93), (0.69, 0.87), (0.77, 0.95), (0.88, 0.92),
        (0.96, 0.82), (0.91, 0.61), (0.87, 0.38), (0.79, 0.16),
        (0.66, 0.05),
    ]
    mask = Image.new('L', (w * 4, h * 4), 0)
    draw = ImageDraw.Draw(mask)
    polygon = [(int(x * w * 4), int(y * h * 4)) for x, y in points]
    draw.polygon(polygon, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(max(2, w // 500)))
    mask = mask.resize((w, h), Image.Resampling.LANCZOS)
    source.putalpha(mask)
    bbox = mask.getbbox()
    if bbox:
        pad = max(4, w // 120)
        bbox = (max(0, bbox[0] - pad), max(0, bbox[1] - pad), min(w, bbox[2] + pad), min(h, bbox[3] + pad))
        source = source.crop(bbox)
    source.save(output_path, 'PNG', optimize=True)


def cmd_clean(args):
    for filepath in args.files:
        img = Image.open(filepath)
        img = remove_watermark(img)
        if args.in_place:
            img.save(filepath, 'PNG')
            print(f'Cleaned: {filepath}')
        elif args.output_dir:
            os.makedirs(args.output_dir, exist_ok=True)
            out = os.path.join(args.output_dir, os.path.basename(filepath))
            img.save(out, 'PNG')
            print(f'Cleaned: {filepath} -> {out}')
        else:
            print('Specify --in-place or --output-dir', file=sys.stderr)
            sys.exit(1)


def cmd_convert(args):
    img = Image.open(args.source)
    img = remove_background(img, args.bg_threshold)
    img = remove_watermark(img)
    img.save(args.output, 'PNG')
    print(f'Converted: {args.source} -> {args.output}')


def cmd_batch(args):
    source_dir = args.source_dir
    output_dir = args.output_dir
    os.makedirs(output_dir, exist_ok=True)
    mapping = {
        'sit-source.png': 'base.png',
        'lick1-source.png': 'tongue.png',
        'lick2-source.png': 'tongue2.png',
    }
    for src_name, out_name in mapping.items():
        src_path = os.path.join(source_dir, src_name)
        out_path = os.path.join(output_dir, out_name)
        if not os.path.exists(src_path):
            print(f'Source not found, skipping: {src_path}')
            continue
        img = Image.open(src_path)
        img = remove_background(img, args.bg_threshold)
        img = remove_watermark(img)
        img.save(out_path, 'PNG')
        print(f'{src_name} -> {out_name} ({img.size})')


def cmd_trayicon(args):
    generate_tray_icon(args.base, args.output, args.size)
    print(f'Tray icon ({args.size}x{args.size}): {args.output}')


def main():
    parser = argparse.ArgumentParser(description='Desktop Pet image processing pipeline')
    sub = parser.add_subparsers(dest='command')

    p_clean = sub.add_parser('clean', help='Remove watermarks from runtime sprites')
    p_clean.add_argument('files', nargs='+')
    p_clean.add_argument('--in-place', action='store_true')
    p_clean.add_argument('--output-dir')

    p_convert = sub.add_parser('convert', help='Convert source RGB to runtime RGBA')
    p_convert.add_argument('source')
    p_convert.add_argument('output')
    p_convert.add_argument('--bg-threshold', type=int, default=BG_THRESHOLD)

    p_batch = sub.add_parser('batch', help='Batch process all source images')
    p_batch.add_argument('--source-dir', required=True)
    p_batch.add_argument('--output-dir', required=True)
    p_batch.add_argument('--bg-threshold', type=int, default=BG_THRESHOLD)

    p_tray = sub.add_parser('trayicon', help='Generate tray icon from base sprite')
    p_tray.add_argument('--base', required=True)
    p_tray.add_argument('--output', required=True)
    p_tray.add_argument('--size', type=int, default=64)

    p_cutout = sub.add_parser('cutout-ghost', help='Cut the ghost silhouette from a checkerboard source')
    p_cutout.add_argument('--source', required=True)
    p_cutout.add_argument('--output', required=True)

    args = parser.parse_args()
    if args.command == 'clean':
        cmd_clean(args)
    elif args.command == 'convert':
        cmd_convert(args)
    elif args.command == 'batch':
        cmd_batch(args)
    elif args.command == 'trayicon':
        cmd_trayicon(args)
    elif args.command == 'cutout-ghost':
        cutout_ghost(args.source, args.output)
        print(f'Ghost cutout: {args.source} -> {args.output}')
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
