"""Unit tests for logo_manager."""
import pytest
import base64
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch, mock_open


def make_hass(tmp_path):
    hass = MagicMock()
    hass.config.path.side_effect = lambda *parts: str(Path(tmp_path, *parts))
    return hass


@pytest.mark.asyncio
async def test_save_logo_base64_png(tmp_path):
    from custom_components.loyalty_cards.logo_manager import async_save_logo_base64

    hass = make_hass(tmp_path)
    raw = b"\x89PNG\r\n" + b"\x00" * 20
    data_url = "data:image/png;base64," + base64.b64encode(raw).decode()

    result = await async_save_logo_base64(hass, "store-abc", data_url)
    assert result is not None
    assert "store-abc" in result
    assert (Path(tmp_path) / "www/loyalty-cards/logos/store-abc.png").exists()


@pytest.mark.asyncio
async def test_save_logo_base64_invalid(tmp_path):
    from custom_components.loyalty_cards.logo_manager import async_save_logo_base64

    hass = make_hass(tmp_path)
    result = await async_save_logo_base64(hass, "store-abc", "not-a-data-url")
    assert result is None


@pytest.mark.asyncio
async def test_save_logo_base64_unsupported_mime(tmp_path):
    from custom_components.loyalty_cards.logo_manager import async_save_logo_base64

    hass = make_hass(tmp_path)
    raw = b"GIF89a"
    data_url = "data:image/bmp;base64," + base64.b64encode(raw).decode()
    result = await async_save_logo_base64(hass, "store-abc", data_url)
    assert result is None


@pytest.mark.asyncio
async def test_delete_logo(tmp_path):
    from custom_components.loyalty_cards.logo_manager import async_delete_logo

    hass = make_hass(tmp_path)
    logo_dir = Path(tmp_path) / "www/loyalty-cards/logos"
    logo_dir.mkdir(parents=True)
    (logo_dir / "store-xyz.png").write_bytes(b"fake")

    result = await async_delete_logo(hass, "store-xyz")
    assert result is True
    assert not (logo_dir / "store-xyz.png").exists()


@pytest.mark.asyncio
async def test_delete_logo_nonexistent(tmp_path):
    from custom_components.loyalty_cards.logo_manager import async_delete_logo

    hass = make_hass(tmp_path)
    result = await async_delete_logo(hass, "nonexistent-store")
    assert result is False
