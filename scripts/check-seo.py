"""Check the homepage's crawlability contracts using only the Python standard library."""

import argparse
from datetime import date, datetime
from hashlib import sha256
from html.parser import HTMLParser
import json
from pathlib import Path
from urllib.parse import urljoin, urlsplit
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from urllib.robotparser import RobotFileParser
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
SITE = "https://houyili.github.io/"
FILES = ("index.html", "robots.txt", "sitemap.xml", "sitemap.txt", "404.html")


class Page(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.elements = []
        self.json_ld = []
        self.in_json_ld = False
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        self.elements.append((tag, attributes))
        if tag == "script" and attributes.get("type") == "application/ld+json":
            self.in_json_ld = True
            self.json_ld.append("")

    def handle_endtag(self, tag):
        if tag == "script":
            self.in_json_ld = False

    def handle_data(self, data):
        if self.in_json_ld:
            self.json_ld[-1] += data

    def find(self, tag, **attributes):
        return [attrs for name, attrs in self.elements
                if name == tag and all(attrs.get(k) == v for k, v in attributes.items())]


def check(files):
    page = Page(files["index.html"])
    assert page.find("html", lang="en"), "Declare the language of the visible page."
    assert len(page.find("h1")) == 1, "Keep one primary profile heading."
    assert len(page.find("title")) == 1, "Keep one page title."
    canonical = page.find("link", rel="canonical")
    assert len(canonical) == 1 and canonical[0].get("href") == SITE, "Canonical URL changed."
    assert page.find("meta", property="og:url", content=SITE), "Social and canonical URLs differ."
    descriptions = page.find("meta", name="description")
    assert len(descriptions) == 1 and descriptions[0].get("content"), "Missing description."
    assert page.find("meta", name="google-site-verification",
                     content="3ZaExKSXytVo38h3RYgw-Y2-qK_dUKWbhFQviwrTq_w"), "Google ownership verification changed."
    for attrs in page.find("meta"):
        if attrs.get("name", "").lower() in ("robots", "googlebot"):
            directives = attrs.get("content", "").lower()
            assert not any(word in directives for word in ("noindex", "nofollow", "none")), "Indexing is disabled."

    assert len(page.json_ld) == 1, "Keep one connected JSON-LD graph."
    graph = json.loads(page.json_ld[0])["@graph"]
    nodes = {node["@id"]: node for node in graph}
    profile = nodes[SITE + "#profile"]
    person = nodes[SITE + "#person"]
    assert profile["@type"] == "ProfilePage" and profile["url"] == SITE
    assert profile["mainEntity"]["@id"] == person["@id"]
    assert person["@type"] == "Person" and person["name"] == "Houyi Li"
    assert person["url"] == SITE and person["mainEntityOfPage"]["@id"] == profile["@id"]
    assert nodes[SITE + "#website"]["url"] == SITE
    assert len(profile["hasPart"]) == len(page.find("article", **{"class": "publication"})), "Visible papers and schema are out of sync."
    assert "https://orcid.org/0009-0003-6107-5954" in person["sameAs"]
    assert "https://dblp.org/pid/175/5459" in person["sameAs"]
    assert not any("arxiv.org" in url or "huggingface.co" in url for url in person["sameAs"]), "Research projects are not personal identities."
    for url in person["sameAs"]:
        assert urlsplit(url).scheme == "https" and urlsplit(url).netloc

    sitemap = ET.fromstring(files["sitemap.xml"])
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    locations = [node.text for node in sitemap.findall("sm:url/sm:loc", ns)]
    assert locations == [SITE], "The sitemap must contain only this homepage's canonical URL."
    assert files["sitemap.txt"].splitlines() == locations, "Text and XML sitemaps differ."
    for node in sitemap.findall("sm:url/sm:lastmod", ns):
        modified = date.fromisoformat(node.text)
        assert modified <= datetime.now().astimezone().date(), "Do not publish a future lastmod."

    robots = RobotFileParser()
    robots.parse(files["robots.txt"].splitlines())
    assert set(robots.site_maps() or []) == {SITE + "sitemap.xml", SITE + "sitemap.txt"}
    ids = {attrs["id"] for _, attrs in page.elements if "id" in attrs}
    assets = set()
    for tag, attrs in page.elements:
        if tag == "img":
            assert "alt" in attrs, "Image alt text is missing."
        href = attrs.get("href", "")
        if href.startswith("#") and len(href) > 1:
            assert href[1:] in ids, f"Broken section link: {href}"
        target = attrs.get("src") or (href if tag in ("link", "a", "use") else "")
        if target and not urlsplit(target).scheme and not target.startswith(("#", "//")):
            assets.add(target)
    for target in [SITE, SITE + "sitemap.xml", SITE + "sitemap.txt", *[urljoin(SITE, asset) for asset in assets]]:
        assert robots.can_fetch("Googlebot", target), f"Googlebot is blocked: {target}"
    for asset in assets:
        asset_path = ROOT / urlsplit(asset).path.lstrip("/")
        assert asset_path.is_file(), f"Missing local asset: {asset}"
        if asset_path.suffix == ".svg" and urlsplit(asset).fragment:
            symbol_ids = {element.get("id") for element in ET.parse(asset_path).iter()}
            assert urlsplit(asset).fragment in symbol_ids, f"Missing SVG icon: {asset}"
    missing = Page(files["404.html"])
    assert missing.find("meta", name="robots", content="noindex, follow"), "Do not index the error page."
    assert missing.find("a", href="/") and missing.find("a", href="/#publications"), "The error page must lead back to the profile and research."
    print("PASS: canonical, Google verification, crawl access, identity graph, paper coverage, sitemaps and local assets.")


def live_check(local):
    live = {}
    for filename in FILES:
        url = SITE if filename == "index.html" else SITE + filename
        with urlopen(Request(url, headers={"User-Agent": "Homepage-SEO-Verification/1.0"}), timeout=20) as response:
            assert response.status == 200 and response.url == url, f"Unexpected status or redirect: {url}"
            assert "noindex" not in response.headers.get("X-Robots-Tag", "").lower(), f"Indexing blocked by HTTP header: {url}"
            live[filename] = response.read().decode("utf-8")
            assert sha256(live[filename].encode()).digest() == sha256(local[filename].encode()).digest(), f"Live revision mismatch: {filename}"
    check(live)
    try:
        urlopen(SITE + "__missing-page-check__", timeout=20)
    except HTTPError as error:
        assert error.code == 404, "Missing pages must return HTTP 404."
        assert error.read().decode("utf-8") == local["404.html"], "The custom recovery page is not deployed."
    else:
        raise AssertionError("A missing URL must not return HTTP 200 (soft 404).")
    print("PASS: live pages return HTTP 200 and match this revision. Google indexing/ranking must be checked separately in Search Console.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--live", action="store_true", help="Compare public deployed files with this revision")
    args = parser.parse_args()
    local = {name: (ROOT / name).read_text(encoding="utf-8") for name in FILES}
    check(local)
    if args.live:
        live_check(local)
