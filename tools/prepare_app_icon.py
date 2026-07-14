from pathlib import Path

from PIL import Image


PROJECT_DIR = Path(__file__).resolve().parents[1]
WORKSPACE_DIR = PROJECT_DIR.parent
SOURCE_ICON = WORKSPACE_DIR / "Z-Tally_icon_light_240.png"


def save_resized(source: Image.Image, path: Path, size: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    resized = source.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(path, "PNG", optimize=True)


def main() -> None:
    with Image.open(SOURCE_ICON) as image:
        source = image.convert("RGBA")
        save_resized(source, PROJECT_DIR / "release" / "icon-240.png", 240)
        save_resized(source, PROJECT_DIR / "assets" / "gt.r" / "icon.png", 248)
        save_resized(source, PROJECT_DIR / "assets" / "gt.s" / "icon.png", 248)

    print(f"Source: {SOURCE_ICON}")
    print(f"Wrote {PROJECT_DIR / 'release' / 'icon-240.png'}")
    print("Updated gt.r and gt.s app icons")


if __name__ == "__main__":
    main()
