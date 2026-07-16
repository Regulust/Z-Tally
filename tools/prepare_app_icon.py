from pathlib import Path

from PIL import Image


PROJECT_DIR = Path(__file__).parent.parent
SOURCE_ICON = PROJECT_DIR / "release" / "icon-source.png"
SAFE_MARGIN = 2


def save_resized(source: Image.Image, path: Path, size: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    content_size = size - SAFE_MARGIN * 2
    resized = source.resize((content_size, content_size), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.alpha_composite(resized, (SAFE_MARGIN, SAFE_MARGIN))
    canvas.save(path, "PNG", optimize=True)


def main() -> None:
    with Image.open(SOURCE_ICON) as image:
        source = image.convert("RGBA")
        save_resized(source, PROJECT_DIR / "release" / "icon-240.png", 240)
        save_resized(source, PROJECT_DIR / "assets" / "round.r" / "icon.png", 248)
        save_resized(source, PROJECT_DIR / "assets" / "square.w390-s" / "icon.png", 248)

    print(f"Source: {SOURCE_ICON}")
    print(f"Wrote {PROJECT_DIR / 'release' / 'icon-240.png'}")
    print("Updated round.r and square.w390-s app icons")


if __name__ == "__main__":
    main()
