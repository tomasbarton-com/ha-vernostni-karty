from __future__ import annotations

import asyncio
import base64
import logging
import os
import re
from pathlib import Path

from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)

ALLOWED_MIME = {"image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"}
MAX_LOGO_BYTES = 2 * 1024 * 1024  # 2 MB


def _logo_dir(hass: HomeAssistant) -> Path:
    return Path(hass.config.path("www/loyalty-cards/logos"))


def logo_url(store_id: str) -> str:
    return f"/local/loyalty-cards/logos/{store_id}.png"


def _ext_from_mime(mime: str) -> str:
    return {
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/gif": ".gif",
        "image/webp": ".webp",
        "image/svg+xml": ".svg",
    }.get(mime, ".png")


async def async_download_logo(hass: HomeAssistant, store_id: str, url: str) -> str | None:
    try:
        import aiohttp
    except ImportError:
        _LOGGER.error("aiohttp not available")
        return None

    logo_dir = _logo_dir(hass)
    logo_dir.mkdir(parents=True, exist_ok=True)

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                if resp.status != 200:
                    _LOGGER.warning("Logo download failed: HTTP %s", resp.status)
                    return None
                content_type = resp.content_type or "image/png"
                if content_type not in ALLOWED_MIME:
                    _LOGGER.warning("Unsupported logo MIME type: %s", content_type)
                    return None
                data = await resp.read()
                if len(data) > MAX_LOGO_BYTES:
                    _LOGGER.warning("Logo file too large: %d bytes", len(data))
                    return None
                ext = _ext_from_mime(content_type)
                dest = logo_dir / f"{store_id}{ext}"
                dest.write_bytes(data)
                _LOGGER.debug("Logo saved to %s", dest)
                return f"/local/loyalty-cards/logos/{store_id}{ext}"
    except Exception:
        _LOGGER.exception("Error downloading logo for store %s", store_id)
        return None


async def async_save_logo_base64(
    hass: HomeAssistant, store_id: str, data_url: str
) -> str | None:
    logo_dir = _logo_dir(hass)
    logo_dir.mkdir(parents=True, exist_ok=True)

    match = re.match(r"data:(image/[^;]+);base64,(.+)", data_url, re.DOTALL)
    if not match:
        _LOGGER.warning("Invalid data URL for logo upload")
        return None

    mime = match.group(1)
    if mime not in ALLOWED_MIME:
        _LOGGER.warning("Unsupported MIME type for logo: %s", mime)
        return None

    try:
        raw = base64.b64decode(match.group(2))
    except Exception:
        _LOGGER.warning("Failed to decode base64 logo data")
        return None

    if len(raw) > MAX_LOGO_BYTES:
        _LOGGER.warning("Logo too large after decode: %d bytes", len(raw))
        return None

    ext = _ext_from_mime(mime)
    dest = logo_dir / f"{store_id}{ext}"

    def _write() -> None:
        dest.write_bytes(raw)

    await asyncio.get_event_loop().run_in_executor(None, _write)
    _LOGGER.debug("Logo saved from upload to %s", dest)
    return f"/local/loyalty-cards/logos/{store_id}{ext}"


async def async_delete_logo(hass: HomeAssistant, store_id: str) -> bool:
    logo_dir = _logo_dir(hass)
    deleted = False
    for ext in (".png", ".jpg", ".gif", ".webp", ".svg"):
        path = logo_dir / f"{store_id}{ext}"
        if path.exists():
            path.unlink()
            deleted = True
    return deleted
