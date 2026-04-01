"""Fetch Open Graph / Twitter Card image URLs from public web pages (server-side)."""

from __future__ import annotations

import html as html_lib
import ipaddress
import re
import socket
import time
from urllib.parse import urljoin, urlparse

import httpx

USER_AGENT = (
    "Mozilla/5.0 (compatible; RunMate/1.0; +https://github.com/) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
MAX_HTML_BYTES = 600_000
FETCH_TIMEOUT = 15.0
CACHE_TTL_SEC = 3600

_cache: dict[str, tuple[float, str | None]] = {}

_OG_IMAGE_PATTERNS = (
    re.compile(
        r'<meta[^>]+property\s*=\s*["\']og:image["\'][^>]+content\s*=\s*["\']([^"\']+)["\']',
        re.I,
    ),
    re.compile(
        r'<meta[^>]+content\s*=\s*["\']([^"\']+)["\'][^>]+property\s*=\s*["\']og:image["\']',
        re.I,
    ),
    re.compile(
        r'<meta[^>]+property\s*=\s*["\']og:image:secure_url["\'][^>]+content\s*=\s*["\']([^"\']+)["\']',
        re.I,
    ),
    re.compile(
        r'<meta[^>]+name\s*=\s*["\']twitter:image["\'][^>]+content\s*=\s*["\']([^"\']+)["\']',
        re.I,
    ),
    re.compile(
        r'<meta[^>]+name\s*=\s*["\']twitter:image:src["\'][^>]+content\s*=\s*["\']([^"\']+)["\']',
        re.I,
    ),
    re.compile(
        r'<link[^>]+rel\s*=\s*["\']image_src["\'][^>]+href\s*=\s*["\']([^"\']+)["\']',
        re.I,
    ),
)


def _host_resolves_to_public(hostname: str) -> bool:
    try:
        infos = socket.getaddrinfo(hostname, None, type=socket.SOCK_STREAM)
    except OSError:
        return False
    found = False
    for info in infos:
        ip_str = info[4][0]
        try:
            ip = ipaddress.ip_address(ip_str)
        except ValueError:
            continue
        found = True
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
            return False
    return found


def assert_safe_http_url(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise ValueError("Only http(s) URLs are allowed")
    host = parsed.hostname
    if not host:
        raise ValueError("Invalid URL")
    if not _host_resolves_to_public(host):
        raise ValueError("URL host is not allowed")


def _extract_image_url(html: str, base_url: str) -> str | None:
    for pat in _OG_IMAGE_PATTERNS:
        m = pat.search(html)
        if m:
            raw = html_lib.unescape(m.group(1).strip())
            if not raw:
                continue
            absolute = urljoin(base_url, raw)
            return absolute
    return None


async def fetch_og_image(url: str) -> str | None:
    now = time.time()
    if url in _cache and now - _cache[url][0] < CACHE_TTL_SEC:
        return _cache[url][1]

    assert_safe_http_url(url)

    headers = {"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8"}
    async with httpx.AsyncClient(timeout=FETCH_TIMEOUT, follow_redirects=True, max_redirects=8) as client:
        resp = await client.get(url, headers=headers)
        resp.raise_for_status()
        final_url = str(resp.url)
        content = resp.content[:MAX_HTML_BYTES]
        text = content.decode(resp.encoding or "utf-8", errors="replace")

    image_url = _extract_image_url(text, final_url)
    _cache[url] = (now, image_url)
    return image_url
