from pathlib import Path
from math import cos, pi, sin

from PIL import Image, ImageDraw


SCALE = 8
SIZE = 52
COLOR_SYS_BUTTON_BG = (56, 56, 56, 255)
COLOR_SYS_BUTTON_PRESSED = (40, 40, 40, 255)
COLOR_SYS_KEY = (9, 134, 212, 255)
COLOR_TEXT_BUTTON = (255, 255, 255, 255)


def scaled(value):
    return int(round(value * SCALE))


def make_button(background, output):
    canvas_size = SIZE * SCALE
    image = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.ellipse((0, 0, canvas_size - 1, canvas_size - 1), fill=background)

    center = canvas_size / 2
    points = []
    teeth = 8
    for tooth in range(teeth):
        base = tooth * 2 * pi / teeth - pi / 2
        for offset, radius in ((-0.25, 13), (-0.13, 17), (0.13, 17), (0.25, 13)):
            angle = base + offset * 2 * pi / teeth
            points.append((center + scaled(radius) * cos(angle), center + scaled(radius) * sin(angle)))

    draw.polygon(points, fill=COLOR_TEXT_BUTTON)
    hole_radius = scaled(5.5)
    draw.ellipse(
        (
            center - hole_radius,
            center - hole_radius,
            center + hole_radius,
            center + hole_radius,
        ),
        fill=background,
    )

    image = image.resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    output.parent.mkdir(parents=True, exist_ok=True)
    image.save(output, "PNG")


def make_switch_background(color, output):
    width = 84 * SCALE
    height = 48 * SCALE
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle(
        (0, 0, width - 1, height - 1),
        radius=height // 2,
        fill=color,
    )
    image = image.resize((84, 48), Image.Resampling.LANCZOS)
    output.parent.mkdir(parents=True, exist_ok=True)
    image.save(output, "PNG")


def make_switch_thumb(output):
    size = 34 * SCALE
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.ellipse((0, 0, size - 1, size - 1), fill=COLOR_TEXT_BUTTON)
    image = image.resize((34, 34), Image.Resampling.LANCZOS)
    output.parent.mkdir(parents=True, exist_ok=True)
    image.save(output, "PNG")


def make_radio(selected, output):
    size = 52 * SCALE
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    if selected:
        draw.ellipse((0, 0, size - 1, size - 1), fill=COLOR_SYS_KEY)
        inset = scaled(14)
        draw.ellipse(
            (inset, inset, size - inset - 1, size - inset - 1),
            fill=COLOR_TEXT_BUTTON,
        )
    else:
        stroke = scaled(4)
        draw.ellipse(
            (stroke // 2, stroke // 2, size - stroke // 2 - 1, size - stroke // 2 - 1),
            outline=COLOR_SYS_BUTTON_BG,
            width=stroke,
        )
    image = image.resize((52, 52), Image.Resampling.LANCZOS)
    output.parent.mkdir(parents=True, exist_ok=True)
    image.save(output, "PNG")


def make_touch_row(width, height, pressed, output):
    image = Image.new("RGBA", (width * SCALE, height * SCALE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    if pressed:
        draw.rounded_rectangle(
            (0, 0, width * SCALE - 1, height * SCALE - 1),
            radius=scaled(16),
            fill=COLOR_SYS_BUTTON_PRESSED[:3] + (190,),
        )
    else:
        # Keep a non-empty PNG while leaving the row visually transparent.
        draw.point((0, 0), fill=(0, 0, 0, 1))
    image = image.resize((width, height), Image.Resampling.LANCZOS)
    output.parent.mkdir(parents=True, exist_ok=True)
    image.save(output, "PNG")


root = Path(__file__).resolve().parents[1]
for asset_dir in (root / "assets" / "gt.r" / "image", root / "assets" / "gt.s" / "image"):
    make_button(COLOR_SYS_BUTTON_BG, asset_dir / "settings_normal.png")
    make_button(COLOR_SYS_BUTTON_PRESSED, asset_dir / "settings_pressed.png")
    make_switch_background(COLOR_SYS_KEY, asset_dir / "switch_on.png")
    make_switch_background(COLOR_SYS_BUTTON_BG, asset_dir / "switch_off.png")
    make_switch_thumb(asset_dir / "switch_thumb.png")
    make_radio(False, asset_dir / "radio_off.png")
    make_radio(True, asset_dir / "radio_on.png")
    make_touch_row(356, 68, False, asset_dir / "settings_row_normal.png")
    make_touch_row(356, 68, True, asset_dir / "settings_row_pressed.png")
    make_touch_row(404, 64, False, asset_dir / "option_row_normal.png")
    make_touch_row(404, 64, True, asset_dir / "option_row_pressed.png")
