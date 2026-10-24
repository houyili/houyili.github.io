"""Embed the homepage CSS without loading unused framework styles."""

import argparse
from pathlib import Path
import re
from urllib.parse import urljoin, urlsplit

ROOT = Path(__file__).resolve().parents[1]
SOURCE = "assets/homepage.css"
START = "        <!-- Generated styles: run python3 scripts/sync-styles.py after editing source CSS. -->"
END = "        <!-- End generated styles. -->"


def embedded_styles():
    css = (ROOT / SOURCE).read_text(encoding="utf-8-sig")
    assert "</style" not in css.lower(), "CSS cannot contain an HTML closing style tag."

    def rebase(match):
        value = match.group(2)
        if urlsplit(value).scheme or value.startswith(("/", "#")):
            return match.group(0)
        return 'url("/' + urljoin(SOURCE, value) + '")'

    css = re.sub(r"url\(\s*(['\"]?)([^\s)]+?)\1\s*\)", rebase, css)
    return START + '\n        <style id="homepage-styles">\n/* Source: ' + SOURCE + " */\n" + css.rstrip() + "\n        </style>\n" + END


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    path = ROOT / "index.html"
    html = path.read_text(encoding="utf-8")
    block = embedded_styles()
    pattern = re.escape(START) + r"[\s\S]*?" + re.escape(END)
    existing = re.search(pattern, html)
    assert existing, "The generated stylesheet markers are missing."
    if args.check:
        assert existing.group() == block, "Inline styles are stale; run python3 scripts/sync-styles.py."
        print("PASS: embedded styles match the source CSS, with root-relative font URLs.")
    else:
        html = html[:existing.start()] + block + html[existing.end():]
        path.write_text(html, encoding="utf-8")
        print("Updated embedded homepage styles.")
