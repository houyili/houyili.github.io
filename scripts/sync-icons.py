"""Extract only the homepage's existing Font Awesome outlines into an SVG sprite."""

from pathlib import Path
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
html_path = ROOT / "index.html"
html = html_path.read_text()
names = sorted(set(re.findall(r'fa fa-([\w-]+)', html)) |
               set(re.findall(r'assets/icons\.svg#([\w-]+)', html)))
css = (ROOT / "assets/font-awesome.min.css").read_text()
font = ET.parse(ROOT / "assets/fonts/fontawesome-webfont.svg")
glyphs = {g.get("unicode"): g for g in font.iter() if g.tag.endswith("glyph")}
symbols = []
for name in names:
    code = re.search(r'\.fa-' + re.escape(name) + r':before\{content:"\\([a-f0-9]+)', css).group(1)
    glyph = glyphs[chr(int(code, 16))]
    width = glyph.get("horiz-adv-x", "1536")
    symbols.append(f'<symbol id="{name}" viewBox="0 0 {width} 1792"><path transform="translate(0 1536) scale(1 -1)" d="{glyph.get("d")}"/></symbol>')
    replacement = f'<svg class="icon" aria-hidden="true" focusable="false"><use href="assets/icons.svg#{name}"></use></svg>'
    html = html.replace(f'<i class="fa fa-{name}" aria-hidden="true"></i>', replacement)

sprite = ('<svg xmlns="http://www.w3.org/2000/svg">\n'
          '<!-- Font Awesome 4.7 outlines by Dave Gandy, rendered from the bundled font. '
          'Original font: SIL OFL 1.1, https://fontawesome.com/v4/license/ -->\n' +
          '\n'.join(symbols) + '\n</svg>\n')
(ROOT / "assets/icons.svg").write_text(sprite)
html_path.write_text(html)
print(f"Generated {len(names)} icons; no icon font download is needed.")
