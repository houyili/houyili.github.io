"""Embed the unchanged source styles to avoid four render-blocking requests."""

import argparse
from pathlib import Path
import re
from urllib.parse import urljoin, urlsplit

ROOT = Path(__file__).resolve().parents[1]
SOURCES = (
    "assets/vendor/al-folio-base.css",
    "assets/vendor/al-folio.css",
    "assets/font-awesome.min.css",
    "assets/style-2.css",
)
START = "        <!-- Generated styles: run python3 scripts/sync-styles.py after editing source CSS. -->"
END = "        <!-- End generated styles. -->"


def embedded_styles():
    chunks = []
    for source in SOURCES:
        # A byte-order mark is only ignored at a stylesheet's start. Strip it before joining.
        css = (ROOT / source).read_text(encoding="utf-8-sig")
        assert "</style" not in css.lower(), "CSS cannot contain an HTML closing style tag."

        def rebase(match):
            value = match.group(2)
            if urlsplit(value).scheme or value.startswith(("/", "#")):
                return match.group(0)
            return 'url("' + urljoin(source, value) + '")'

        css = re.sub(r"url\(\s*(['\"]?)([^\s)]+?)\1\s*\)", rebase, css)
        chunks.append("/* Source: " + source + " */\n" + css.rstrip())
    return START + '\n        <style id="homepage-styles">\n' + "\n".join(chunks) + "\n        </style>\n" + END


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    path = ROOT / "index.html"
    html = path.read_text(encoding="utf-8")
    block = embedded_styles()
    pattern = re.escape(START) + r"[\s\S]*?" + re.escape(END)
    existing = re.search(pattern, html)
    if args.check:
        assert existing and existing.group() == block, "Inline styles are stale; run python3 scripts/sync-styles.py."
        print("PASS: embedded styles match all four CSS sources, with font URLs rebased.")
    else:
        if existing:
            html = html[:existing.start()] + block + html[existing.end():]
        else:
            for source in SOURCES:
                html, count = re.subn(r'        <link href="' + re.escape(source) + r'(?:\?[^"]*)?" rel="stylesheet">\n', "", html)
                assert count == 1, "Expected one stylesheet link for " + source
            html = html.replace('        <script type="application/ld+json">', block + '\n        <script type="application/ld+json">', 1)
        path.write_text(html, encoding="utf-8")
        print("Updated embedded homepage styles.")
