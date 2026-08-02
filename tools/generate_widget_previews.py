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


def left_centered(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], value: str, text_font, fill) -> None:
    left, top, _right, bottom = box
    bounds = draw.textbbox((0, 0), value, font=text_font)
    height = bounds[3] - bounds[1]
    draw.text(
        (left, top + (bottom - top - height) / 2 - bounds[1]),
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
    square = width == 390
    uniform = 0.8125 if square else 1
    image = Image.new("RGB", (width, height), "#000000")
    draw = ImageDraw.Draw(image)

    title_box = (0, 18, 390, 60) if square else (0, 20, 480, 68)
    centered(draw, title_box, "Z-Tally", font(30 if square else 36, True, locale), "#ffffff")

    for index in range(5):
        box = (65 + index * 56, 78, 101 + index * 56, 114) if square else (92 + index * 64, 84, 132 + index * 64, 124)
        fill = "#0986d4" if index == 0 else "#303030"
        draw.ellipse(box, fill=fill)
        centered(draw, box, str(index + 1), font(22 if square else 24, True, locale), "#ffffff")

    value_box = (32, 130, 358, 340) if square else (64, 140, 416, 360)
    draw.rounded_rectangle(value_box, radius=36 if square else 42, fill="#303030")
    centered(draw, value_box, "0", font(82 if square else 96, True, locale), "#ffffff")

    decrement_box = (93, 378, 153, 426) if square else (128, 400, 200, 448)
    draw.rounded_rectangle(decrement_box, radius=15 if square else 16, fill="#1d1d1d")
    centered(draw, decrement_box, "−1", font(21 if square else 22, True, locale), "#5d5d5d")

    open_box = (165, 378, 297, 426) if square else (212, 400, 352, 448)
    draw.rounded_rectangle(open_box, radius=15 if square else 16, fill="#0986d4")
    centered(
        draw,
        open_box,
        "打开应用" if locale == "zh-CN" else "Open app",
        font(20 if square else 22, True, locale),
        "#ffffff",
    )

    save_indexed(image, output, corner_radius)


def render_app_widget(width: int, height: int, output: Path, locale: str) -> None:
    square = width < 400
    image = Image.new("RGB", (width, height), "#303030")
    draw = ImageDraw.Draw(image)
    padding = 16
    action_height = 72
    plus_width = 72
    minus_width = 72
    column_gap = 10
    action_gap = 8
    plus_x = width - padding - plus_width
    minus_x = plus_x - action_gap - minus_width
    action_y = height - padding - action_height
    content_x = padding
    left_width = minus_x - column_gap - content_x
    value_inset = 14
    label_height = 35
    label_y = 24
    value_y = action_y + round((action_height - 48) / 2)

    label_box = (content_x, label_y, content_x + left_width, label_y + label_height)
    value_box = (content_x + value_inset, value_y, content_x + left_width, value_y + 48)
    plus_box = (plus_x, action_y, plus_x + plus_width, action_y + action_height)
    minus_box = (minus_x, action_y, minus_x + minus_width, action_y + action_height)
    draw.rounded_rectangle(plus_box, radius=18, fill="#0986d4")
    draw.rounded_rectangle(minus_box, radius=18, fill="#505050")
    label = "计数器 1" if locale == "zh-CN" else "Counter 1"
    left_centered(draw, label_box, label, font(28, locale=locale), "#b3b3b3")
    left_centered(draw, value_box, "0", font(48, True, locale), "#ffffff")
    centered(draw, plus_box, "+", font(40, True, locale), "#ffffff")
    centered(draw, minus_box, "−", font(36, True, locale), "#ffffff")
    save_indexed(image, output)


def render_home(width: int, height: int, output: Path, shape: str, locale: str) -> None:
    square = shape == "square"
    image = Image.new("RGB", (width, height), "#000000")
    draw = ImageDraw.Draw(image)

    if square:
        centered(draw, (0, 0, 390, 64), "Z-Tally", font(28, True, locale), "#ffffff")
        selector_x, selector_y, selector_step, selector_size = 59, 84, 58, 40
        value_box = (16, 134, 374, 292)
        value_radius = 36
        value_font = 76
        buttons = [
            ((34, 302, 134, 348), "−1", "#383838", "#808080", 28),
            ((145, 302, 245, 348), "Save", "#383838", "#808080", 24),
            ((256, 302, 356, 348), "Reset", "#ad3c23", "#ffffff", 24),
            ((68, 364, 272, 410), "History  0", "#383838", "#ffffff", 24),
        ]
        settings_xy = (300, 364)
        settings_path = PROJECT_DIR / "assets" / "square.w390-s" / "image" / "settings_normal.png"
    else:
        centered(draw, (0, 18, 480, 66), "Z-Tally", font(36, True, locale), "#ffffff")
        selector_x, selector_y, selector_step, selector_size = 92, 74, 64, 40
        value_box = (52, 124, 428, 322)
        value_radius = 44
        value_font = 82
        buttons = [
            ((72, 336, 168, 384), "−1", "#383838", "#808080", 28),
            ((192, 336, 288, 384), "Save", "#383838", "#808080", 24),
            ((312, 336, 408, 384), "Reset", "#ad3c23", "#ffffff", 24),
            ((140, 398, 296, 444), "History  0", "#383838", "#ffffff", 24),
        ]
        settings_xy = (308, 398)
        settings_path = PROJECT_DIR / "assets" / "round.r" / "image" / "settings_normal.png"

    for index in range(5):
        box = (
            selector_x + index * selector_step,
            selector_y,
            selector_x + index * selector_step + selector_size,
            selector_y + selector_size,
        )
        draw.ellipse(box, fill="#0986d4" if index == 0 else "#383838")
        centered(draw, box, str(index + 1), font(24, True, locale), "#ffffff")

    draw.rounded_rectangle(value_box, radius=value_radius, fill="#303030")
    centered(draw, value_box, "0", font(value_font, True, locale), "#ffffff")

    for box, label, background, foreground, text_size in buttons:
        draw.rounded_rectangle(box, radius=15 if square else 16, fill=background)
        centered(draw, box, label, font(text_size, True, locale), foreground)

    settings_icon = Image.open(settings_path).convert("RGBA")
    if settings_icon.size != (46, 46):
        settings_icon = settings_icon.resize((46, 46), Image.Resampling.LANCZOS)
    image.paste(settings_icon, settings_xy, settings_icon)
    save_indexed(image, output)


def main() -> None:
    targets = [
        (480, 480, "round", PROJECT_DIR / "assets" / "round.r", None),
        (390, 450, "square", PROJECT_DIR / "assets" / "square.w390-s", SQUARE_CORNER_RADIUS),
    ]
    for width, height, shape, asset_directory, corner_radius in targets:
        render(width, height, PICTURES_DIR / f"widget-preview-{shape}.png", "en-US", corner_radius)
        render(width, height, PICTURES_DIR / f"widget-preview-{shape}_en-US.png", "en-US", corner_radius)
        render(width, height, PICTURES_DIR / f"widget-preview-{shape}_zh-CN.png", "zh-CN", corner_radius)
        render(width, height, PICTURES_DIR / f"secondary-widget-preview-{shape}_en-US.png", "en-US", corner_radius)
        render(width, height, asset_directory / "widget-preview_en-US.png", "en-US", corner_radius)
        render(width, height, asset_directory / "widget-preview_zh-CN.png", "zh-CN", corner_radius)
        card_width = min(400, width - 32)
        card_height = 170
        render_app_widget(card_width, card_height, PICTURES_DIR / f"app-widget-preview-{shape}_en-US.png", "en-US")
        render_app_widget(card_width, card_height, PICTURES_DIR / f"app-widget-preview-{shape}_zh-CN.png", "zh-CN")
        render_home(width, height, PICTURES_DIR / f"home-preview-{shape}_en-US.png", shape, "en-US")


if __name__ == "__main__":
    main()
