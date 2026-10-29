"""Embed the original SVG outlines so icons also render in file:// previews."""

import argparse
from pathlib import Path
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets/icons.svg"
ICON = re.compile(r'<svg\b(?=[^>]*\bclass="icon")[^>]*>[\s\S]*?</svg>')


def embed_icons(html):
    root = ET.parse(SOURCE).getroot()
    for element in root.iter():
        element.tag = element.tag.rsplit("}", 1)[-1]
    symbols = {symbol.get("id"): symbol for symbol in root.findall("symbol")}

    def replace(match):
        markup = match.group()
        name = re.search(r'data-icon="([\w-]+)"', markup)
        if not name:
            name = re.search(r'<use\s+href="assets/icons\.svg#([\w-]+)"', markup)
        assert name, "An icon has no source identifier."
        name = name.group(1)
        assert name in symbols, f"Missing icon source: {name}"
        symbol = symbols[name]
        paths = "".join(ET.tostring(child, encoding="unicode") for child in symbol)
        return (f'<svg class="icon" aria-hidden="true" focusable="false" '
                f'data-icon="{name}" viewBox="{symbol.get("viewBox")}">{paths}</svg>')

    assert ICON.search(html), "No homepage icons found."
    return ICON.sub(replace, html)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    path = ROOT / "index.html"
    html = path.read_text(encoding="utf-8")
    updated = embed_icons(html)
    if args.check:
        assert html == updated, "Inline icons are stale; run python3 scripts/sync-icons.py."
        print("PASS: every homepage icon embeds its original SVG outline.")
    else:
        path.write_text(updated, encoding="utf-8")
        print("Updated inline homepage icons.")
