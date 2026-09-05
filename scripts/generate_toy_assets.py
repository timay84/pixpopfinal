"""Generate the first transparent 3D toy sprites for PixPop."""

from PIL import Image, ImageDraw, ImageFilter

SCALE = 4
SIZE = (512, 640)


def layer(size=SIZE):
    return Image.new("RGBA", (size[0] * SCALE, size[1] * SCALE), (0, 0, 0, 0))


def scaled_polygon(points):
    return [(int(x * SCALE), int(y * SCALE)) for x, y in points]


def gradient_fill(mask, top, bottom):
    image = Image.new("RGBA", mask.size)
    pixels = image.load()
    height = mask.height
    for y in range(height):
        t = y / max(1, height - 1)
        color = tuple(int(top[i] * (1 - t) + bottom[i] * t) for i in range(4))
        for x in range(mask.width):
            pixels[x, y] = color
    image.putalpha(mask)
    return image


def add_shadow(canvas, mask, offset=(12, 20), blur=18):
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    shadow_mask = Image.new("L", canvas.size, 0)
    shadow_mask.paste(mask, offset)
    shadow_mask = shadow_mask.filter(ImageFilter.GaussianBlur(blur * SCALE))
    shadow.paste((6, 8, 30, 135), mask=shadow_mask)
    canvas.alpha_composite(shadow)


def make_radish_knife(path):
    canvas = layer()
    mask = Image.new("L", canvas.size, 0)
    draw = ImageDraw.Draw(mask)
    blade = scaled_polygon([(235, 55), (300, 72), (349, 152), (315, 348), (264, 410), (208, 350), (176, 153)])
    draw.polygon(blade, fill=255)
    add_shadow(canvas, mask)
    canvas.alpha_composite(gradient_fill(mask, (255, 165, 97, 255), (190, 41, 79, 255)))

    detail = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(detail)
    d.line(scaled_polygon([(242, 65), (276, 103), (292, 300), (263, 376)]), fill=(255, 235, 174, 210), width=8 * SCALE)
    d.line(scaled_polygon([(206, 145), (319, 145)]), fill=(133, 25, 70, 170), width=4 * SCALE)
    d.ellipse((220 * SCALE, 290 * SCALE, 292 * SCALE, 360 * SCALE), fill=(255, 211, 109, 255), outline=(126, 30, 65, 255), width=6 * SCALE)
    canvas.alpha_composite(detail)

    handle = Image.new("L", canvas.size, 0)
    hd = ImageDraw.Draw(handle)
    hd.rounded_rectangle((198 * SCALE, 340 * SCALE, 315 * SCALE, 570 * SCALE), radius=42 * SCALE, fill=255)
    add_shadow(canvas, handle, offset=(8, 13), blur=13)
    canvas.alpha_composite(gradient_fill(handle, (255, 116, 79, 255), (137, 34, 96, 255)))
    hd = ImageDraw.Draw(canvas)
    hd.rounded_rectangle((214 * SCALE, 367 * SCALE, 299 * SCALE, 526 * SCALE), radius=28 * SCALE, outline=(255, 197, 126, 170), width=5 * SCALE)
    hd.ellipse((235 * SCALE, 396 * SCALE, 278 * SCALE, 439 * SCALE), fill=(38, 24, 71, 220))
    hd.ellipse((246 * SCALE, 401 * SCALE, 258 * SCALE, 414 * SCALE), fill=(255, 255, 255, 210))
    canvas.resize(SIZE, Image.Resampling.LANCZOS).save(path, "PNG", optimize=True)


def make_squeeze_toy(path):
    canvas = layer()
    mask = Image.new("L", canvas.size, 0)
    draw = ImageDraw.Draw(mask)
    body = scaled_polygon([(169, 118), (216, 67), (303, 60), (365, 106), (391, 205), (374, 397), (330, 520), (234, 541), (160, 477), (126, 337), (132, 197)])
    draw.polygon(body, fill=255)
    add_shadow(canvas, mask)
    canvas.alpha_composite(gradient_fill(mask, (125, 246, 218, 255), (87, 90, 211, 255)))
    detail = ImageDraw.Draw(canvas)
    detail.ellipse((174 * SCALE, 189 * SCALE, 226 * SCALE, 266 * SCALE), fill=(22, 31, 74, 255))
    detail.ellipse((290 * SCALE, 189 * SCALE, 342 * SCALE, 266 * SCALE), fill=(22, 31, 74, 255))
    detail.ellipse((187 * SCALE, 198 * SCALE, 202 * SCALE, 218 * SCALE), fill=(255, 255, 255, 220))
    detail.ellipse((303 * SCALE, 198 * SCALE, 318 * SCALE, 218 * SCALE), fill=(255, 255, 255, 220))
    detail.arc((220 * SCALE, 280 * SCALE, 307 * SCALE, 367 * SCALE), 15, 165, fill=(36, 36, 104, 230), width=7 * SCALE)
    detail.ellipse((148 * SCALE, 320 * SCALE, 200 * SCALE, 370 * SCALE), fill=(255, 125, 203, 115))
    detail.ellipse((324 * SCALE, 320 * SCALE, 376 * SCALE, 370 * SCALE), fill=(255, 125, 203, 115))
    detail.line(scaled_polygon([(170, 137), (213, 103), (260, 88)]), fill=(255, 255, 255, 150), width=12 * SCALE)
    detail.ellipse((215 * SCALE, 408 * SCALE, 305 * SCALE, 471 * SCALE), fill=(255, 255, 255, 32))
    canvas.resize(SIZE, Image.Resampling.LANCZOS).save(path, "PNG", optimize=True)


if __name__ == "__main__":
    make_radish_knife("assets/radish-knife.png")
    make_squeeze_toy("assets/squeeze-toy.png")
    print("Generated assets/radish-knife.png and assets/squeeze-toy.png")
