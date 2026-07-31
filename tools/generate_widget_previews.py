from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


PROJECT_DIR = Path(__file__).parent.parent
PICTURES_DIR = PROJECT_DIR.parent / "Pictures"
FONT_DIR = Path("C:/Windows/Fonts")
INDEXED_COLORS = 255
TRANSPARENT_INDEX = 255
SQUARE_CORNER_RADIUS = 86


def font(size: int, bold: bool = False, locale: str = "en-US") -> ImageFont.FreeTypeFont:
    if locale == "zh-CN":
        name = "msyhbd.ttc" if bold else "msyh.ttc"
    else:
        name = "segoeuib.ttf" if bold else "segoeui.ttf"
    return ImageFont.truetype(str(FONT_DIR / name), size)


def centered(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], value: str, text_font, fill) -> None:
    left, top, right, bottom = box
    bounds = draw.textbbox((0, 0), value, font=text_font)
    width = bounds[2] - bounds[0]
    height = bounds[3] - bounds[1]
    draw.text(
        (left + (right - left - width) / 2, top + (bottom - top - height) / 2 - bounds[1]),
        value,
        font=text_font,
        fill=fill,
    )


def scaled_box(box: tuple[int, int, int, int], sx: float, sy: float) -> tuple[int, int, int, int]:
    x1, y1, x2, y2 = box
    return tuple(round(value * factor) for value, factor in zip(box, (sx, sy, sx, sy)))


def save_indexed(image: Image.Image, output: Path, corner_radius: int | None = None) -> None:
    indexed = image.quantize(
        colors=INDEXED_COLORS,
        method=Image.Quantize.MEDIANCUT,
        dither=Image.Dither.NONE,
    )

    if corner_radius is not None:
        mask = Image.new("L", image.size, 0)
        ImageDraw.Draw(mask).rounded_rectangle(
            (0, 0, image.width - 1, image.height - 1),
            radius=corner_radius,
            fill=255,
        )
        outside = Image.eval(mask, lambda value: 255 - value)
        indexed.paste(TRANSPARENT_INDEX, mask=outside)

        palette = indexed.getpalette() or []
        palette.extend([0] * (768 - len(palette)))
        indexed.putpalette(palette[:768])
        indexed.info["transparency"] = TRANSPARENT_INDEX

    output.parent.mkdir(parents=True, exist_ok=True)
    indexed.save(output, "PNG", optimize=True)
    print(f"Wrote {output}")


def render(
    width: int,
    height: int,
    output: Path,
    locale: str,
    corner_radius: int | None = None,
) -> None:
    sx = width / 480
    sy = height / 480
    uniform = min(sx, sy)
    image = Image.new("RGB", (width, height), "#000000")
    draw = ImageDraw.Draw(image)

    centered(draw, scaled_box((0, 20, 480, 68), sx, sy), "Z-Tally", font(round(36 * uniform), True, locale), "#ffffff")

    for index in range(5):
        box = scaled_box((92 + index * 64, 84, 132 + index * 64, 124), sx, sy)
        fill = "#0986d4" if index == 0 else "#303030"
        draw.ellipse(box, fill=fill)
        centered(draw, box, str(index + 1), font(round(24 * uniform), True, locale), "#ffffff")

    value_box = scaled_box((64, 140, 416, 360), sx, sy)
    draw.rounded_rectangle(value_box, radius=round(42 * uniform), fill="#303030")
    centered(draw, value_box, "0", font(round(96 * uniform), True, locale), "#ffffff")

    centered(
        draw,
        scaled_box((60, 374, 420, 416), sx, sy),
        "计数器 1  •  点击计数" if locale == "zh-CN" else "Counter 1  •  Tap to count",
        font(round(24 * uniform), locale=locale),
        "#808080",
    )

    open_box = scaled_box((170, 420, 310, 464), sx, sy)
    draw.rounded_rectangle(open_box, radius=round(15 * uniform), fill="#0986d4")
    centered(
        draw,
        open_box,
        "打开应用" if locale == "zh-CN" else "Open app",
        font(round(22 * uniform), True, locale),
        "#ffffff",
    )

    save_indexed(image, output, corner_radius)


def main() -> None:
    targets = [
        (480, 480, "round", PROJECT_DIR / "assets" / "round.r", None),
        (390, 450, "square", PROJECT_DIR / "assets" / "square.w390-s", SQUARE_CORNER_RADIUS),
    ]
    for width, height, shape, asset_directory, corner_radius in targets:
        render(width, height, PICTURES_DIR / f"widget-preview-{shape}.png", "en-US", corner_radius)
        render(width, height, PICTURES_DIR / f"widget-preview-{shape}_en-US.png", "en-US", corner_radius)
        render(width, height, PICTURES_DIR / f"widget-preview-{shape}_zh-CN.png", "zh-CN", corner_radius)
        render(width, height, asset_directory / "widget-preview_en-US.png", "en-US", corner_radius)
        render(width, height, asset_directory / "widget-preview_zh-CN.png", "zh-CN", corner_radius)


if __name__ == "__main__":
    main()
