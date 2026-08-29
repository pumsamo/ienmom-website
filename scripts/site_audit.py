from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://ienmom-website.vercel.app"
EXCLUDED = {Path("story/admin.html")}


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.links: list[tuple[str, str, str]] = []
        self.images: list[tuple[str, str | None]] = []
        self.media: list[str] = []
        self.ids: set[str] = set()
        self.title = ""
        self.in_title = False
        self.meta: dict[str, str] = {}
        self.headings: list[int] = []
        self.json_ld: list[str] = []
        self.in_json_ld = False
        self.json_buffer: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = dict(attrs)
        if data.get("id"):
            self.ids.add(data["id"] or "")
        if tag == "a" and data.get("href"):
            self.links.append((data["href"] or "", data.get("rel") or "", data.get("target") or ""))
        elif tag == "img":
            self.images.append((data.get("src") or "", data.get("alt")))
        elif tag in {"video", "source"}:
            for key in ("src", "poster", "data-desktop-src", "data-mobile-src", "data-desktop-poster", "data-mobile-poster"):
                if data.get(key):
                    self.media.append(data[key] or "")
        elif tag == "title":
            self.in_title = True
        elif tag == "meta":
            key = data.get("name") or data.get("property")
            if key:
                self.meta[key.lower()] = data.get("content") or ""
        elif tag == "link" and (data.get("rel") or "").lower() == "canonical":
            self.meta["canonical"] = data.get("href") or ""
        elif tag in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            self.headings.append(int(tag[1]))
        elif tag == "script" and (data.get("type") or "").lower() == "application/ld+json":
            self.in_json_ld = True
            self.json_buffer = []

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self.in_title = False
        elif tag == "script" and self.in_json_ld:
            self.json_ld.append("".join(self.json_buffer).strip())
            self.in_json_ld = False
            self.json_buffer = []

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title += data
        if self.in_json_ld:
            self.json_buffer.append(data)


def page_path_from_url(current: Path, href: str) -> tuple[Path | None, str]:
    parsed = urlparse(href)
    if parsed.scheme in {"mailto", "tel", "sms", "javascript", "data"}:
        return None, ""
    if parsed.scheme in {"http", "https"}:
        if parsed.netloc != urlparse(ORIGIN).netloc:
            return None, ""
        raw_path = unquote(parsed.path.lstrip("/"))
    elif href.startswith("//"):
        return None, ""
    else:
        raw_path = unquote(parsed.path)

    if not raw_path:
        target = current
    elif parsed.scheme in {"http", "https"} or href.startswith("/"):
        target = Path(raw_path)
    else:
        target = current.parent / raw_path

    if str(target).endswith(("/", "\\")) or target.suffix == "":
        target = target / "index.html"
    return Path(*[part for part in target.parts if part not in {"."}]), parsed.fragment


def main() -> int:
    html_files = sorted(
        path.relative_to(ROOT)
        for path in ROOT.rglob("*.html")
        if path.relative_to(ROOT) not in EXCLUDED
    )
    parsed_pages: dict[Path, PageParser] = {}
    errors: list[str] = []
    warnings: list[str] = []
    titles: dict[str, Path] = {}

    for rel in html_files:
        parser = PageParser()
        parser.feed((ROOT / rel).read_text(encoding="utf-8"))
        parsed_pages[rel] = parser
        title = parser.title.strip()
        if not title or len(title) > 60:
            warnings.append(f"META title: {rel} ({len(title)}자)")
        elif title in titles:
            warnings.append(f"META title 중복: {rel} / {titles[title]}")
        titles[title] = rel
        if not parser.meta.get("description"):
            warnings.append(f"META description 누락: {rel}")
        canonical = parser.meta.get("canonical", "")
        if not canonical.startswith(ORIGIN):
            warnings.append(f"META canonical 누락·불일치: {rel}")
        for key in ("og:title", "og:description", "og:url"):
            if not parser.meta.get(key):
                warnings.append(f"META {key} 누락: {rel}")
        if parser.meta.get("og:image") and not parser.meta["og:image"].startswith("https://"):
            warnings.append(f"META og:image 절대 URL 아님: {rel}")
        if not parser.meta.get("viewport"):
            errors.append(f"MOBILE viewport 누락: {rel}")
        if len(parser.headings) == 0 or parser.headings.count(1) != 1:
            warnings.append(f"HEADING h1 개수: {rel} ({parser.headings.count(1)}개)")
        for before, after in zip(parser.headings, parser.headings[1:]):
            if after > before + 1:
                warnings.append(f"HEADING 단계 건너뜀: {rel} (h{before}→h{after})")
                break
        for raw in parser.json_ld:
            try:
                json.loads(raw)
            except json.JSONDecodeError as exc:
                errors.append(f"JSON-LD 오류: {rel} ({exc})")

    for rel, parser in parsed_pages.items():
        for href, rel_attr, target_attr in parser.links:
            target, fragment = page_path_from_url(rel, href)
            parsed = urlparse(href)
            if parsed.scheme in {"http", "https"} and parsed.netloc != urlparse(ORIGIN).netloc:
                if target_attr == "_blank" and "noopener" not in rel_attr:
                    warnings.append(f"EXTERNAL rel 확인: {rel} → {href}")
                continue
            if target is None:
                continue
            resolved = (ROOT / target).resolve()
            try:
                resolved.relative_to(ROOT.resolve())
            except ValueError:
                errors.append(f"LINK 저장소 밖: {rel} → {href}")
                continue
            if not resolved.exists():
                errors.append(f"LINK 깨짐: {rel} → {href} ({target})")
                continue
            target_rel = resolved.relative_to(ROOT.resolve())
            if fragment and target_rel in parsed_pages and fragment not in parsed_pages[target_rel].ids:
                errors.append(f"FRAGMENT 깨짐: {rel} → {href}")
        for src, alt in parser.images:
            if alt is None:
                errors.append(f"IMAGE alt 누락: {rel} → {src}")
            parsed = urlparse(src)
            if parsed.scheme in {"http", "https", "data"}:
                continue
            target = (rel.parent / unquote(parsed.path)).resolve()
            if not (ROOT / target).exists() and not target.exists():
                errors.append(f"IMAGE 깨짐: {rel} → {src}")
        for src in parser.media:
            parsed = urlparse(src)
            if parsed.scheme in {"http", "https", "data"}:
                continue
            target = (ROOT / rel.parent / unquote(parsed.path)).resolve()
            if not target.exists():
                errors.append(f"MEDIA 깨짐: {rel} → {src}")

    for css in [ROOT / "styles.css", ROOT / "story/story.css", ROOT / "assets/cart.css"]:
        text = css.read_text(encoding="utf-8")
        for url in re.findall(r"url\([\"']?([^\"')]+)", text):
            if url.startswith(("data:", "http://", "https://")):
                continue
            target = (css.parent / unquote(url)).resolve()
            if not target.exists():
                errors.append(f"CSS IMAGE 깨짐: {css.relative_to(ROOT)} → {url}")

    posts = json.loads((ROOT / "story/posts.json").read_text(encoding="utf-8"))
    for post in posts:
        if post.get("url") and not (ROOT / "story" / post["url"]).exists():
            errors.append(f"POST url 깨짐: {post['id']} → {post['url']}")

    ET.parse(ROOT / "sitemap.xml")
    robots = (ROOT / "robots.txt").read_text(encoding="utf-8")
    if "Disallow: /story/admin.html" not in robots or f"Sitemap: {ORIGIN}/sitemap.xml" not in robots:
        errors.append("ROBOTS 설정 오류")

    print(f"PUBLIC_HTML={len(html_files)}")
    print(f"INTERNAL_LINK_ERRORS={sum(1 for item in errors if item.startswith(('LINK', 'FRAGMENT')))}")
    print(f"LOCAL_IMAGE_ERRORS={sum(1 for item in errors if 'IMAGE' in item)}")
    print(f"ERRORS={len(errors)}")
    for item in errors:
        print(f"ERROR {item}")
    print(f"WARNINGS={len(warnings)}")
    for item in warnings:
        print(f"WARN {item}")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
