#!/usr/bin/env python3
"""Download store logos from Clearbit Logo API and save to www/logos/."""

import json
import re
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

STORES_JSON = Path(__file__).parent.parent / "data" / "czech_stores.json"
LOGOS_DIR = Path(__file__).parent.parent / "custom_components" / "loyalty_cards" / "www" / "logos"
LOGOS_DIR.mkdir(parents=True, exist_ok=True)

def name_to_slug(name: str) -> str:
    slug = name.lower()
    slug = re.sub(r"[&']", "", slug)
    slug = re.sub(r"[^a-z0-9]+", "_", slug)
    return slug.strip("_")

def download(url: str, dest: Path, timeout: int = 10) -> bool:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if resp.status == 200:
                data = resp.read()
                if len(data) > 500:  # reject tiny/empty responses
                    dest.write_bytes(data)
                    return True
    except Exception as e:
        print(f"  ERR: {e}")
    return False

stores = json.loads(STORES_JSON.read_text())

ok, fail = [], []
for store in stores:
    name = store["name"]
    domain = store.get("logo_hint", "")
    slug = name_to_slug(name)
    dest = LOGOS_DIR / f"{slug}.png"

    if dest.exists() and dest.stat().st_size > 500:
        print(f"  SKIP (exists): {name}")
        ok.append(name)
        continue

    urls = [
        f"https://logo.clearbit.com/{domain}?size=256",
        f"https://logo.clearbit.com/{domain}",
    ]

    success = False
    for url in urls:
        print(f"  GET  {name:30s}  {url}")
        if download(url, dest):
            print(f"  OK   {name} → {dest.name} ({dest.stat().st_size} B)")
            ok.append(name)
            success = True
            break
        time.sleep(0.3)

    if not success:
        print(f"  FAIL {name}")
        fail.append(name)

    time.sleep(0.5)

print(f"\n=== Done: {len(ok)} OK, {len(fail)} FAIL ===")
if fail:
    print("Failed:", fail)
