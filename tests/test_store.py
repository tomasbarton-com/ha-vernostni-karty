"""Unit tests for LoyaltyCardStore."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch


def make_hass():
    hass = MagicMock()
    hass.config.path.return_value = "/tmp/ha-test"
    return hass


@pytest.fixture
def store():
    from custom_components.loyalty_cards.store import LoyaltyCardStore
    hass = make_hass()
    s = LoyaltyCardStore(hass)
    s._data = {
        "version": 1,
        "stores": [],
        "settings": {
            "device_trackers": [],
            "global_proximity_m": 300,
            "notifications_enabled": True,
            "notification_dwell_minutes": 7,
        },
    }
    s._store = AsyncMock()
    s._store.async_save = AsyncMock()
    return s


@pytest.mark.asyncio
async def test_add_store(store):
    result = await store.async_add_store("Albert", "groceries", "#e53935")
    assert result["name"] == "Albert"
    assert result["category"] == "groceries"
    assert result["tile_color"] == "#e53935"
    assert len(store.get_stores()) == 1


@pytest.mark.asyncio
async def test_update_store(store):
    s = await store.async_add_store("Albert", "groceries")
    updated = await store.async_update_store(s["id"], name="Albert XL")
    assert updated["name"] == "Albert XL"


@pytest.mark.asyncio
async def test_delete_store(store):
    s = await store.async_add_store("Lidl", "groceries")
    result = await store.async_delete_store(s["id"])
    assert result is True
    assert len(store.get_stores()) == 0


@pytest.mark.asyncio
async def test_delete_nonexistent_store(store):
    result = await store.async_delete_store("nonexistent-id")
    assert result is False


@pytest.mark.asyncio
async def test_add_card(store):
    s = await store.async_add_store("dm", "drugstore")
    card = await store.async_add_card(s["id"], "Moje karta", "1234567890128", "EAN_13")
    assert card["barcode"] == "1234567890128"
    assert card["barcode_type"] == "EAN_13"
    assert len(store.get_store(s["id"])["cards"]) == 1


@pytest.mark.asyncio
async def test_add_card_invalid_store(store):
    result = await store.async_add_card("bad-id", "X", "123")
    assert result is None


@pytest.mark.asyncio
async def test_update_card(store):
    s = await store.async_add_store("dm", "drugstore")
    card = await store.async_add_card(s["id"], "Karta", "111", "CODE_128")
    updated = await store.async_update_card(card["id"], barcode="999")
    assert updated["barcode"] == "999"


@pytest.mark.asyncio
async def test_delete_card(store):
    s = await store.async_add_store("dm", "drugstore")
    card = await store.async_add_card(s["id"], "Karta", "111", "CODE_128")
    result = await store.async_delete_card(card["id"])
    assert result is True
    assert len(store.get_store(s["id"])["cards"]) == 0


@pytest.mark.asyncio
async def test_add_location(store):
    s = await store.async_add_store("Tesco", "groceries")
    loc = await store.async_add_location(s["id"], 50.0755, 14.4378, 300, "Praha 1")
    assert loc["lat"] == 50.0755
    assert loc["label"] == "Praha 1"
    assert len(store.get_store(s["id"])["locations"]) == 1


@pytest.mark.asyncio
async def test_delete_location(store):
    s = await store.async_add_store("Tesco", "groceries")
    await store.async_add_location(s["id"], 50.0, 14.0, 300, "A")
    await store.async_add_location(s["id"], 50.1, 14.1, 300, "B")
    result = await store.async_delete_location(s["id"], 0)
    assert result is True
    locs = store.get_store(s["id"])["locations"]
    assert len(locs) == 1
    assert locs[0]["label"] == "B"


@pytest.mark.asyncio
async def test_delete_location_out_of_range(store):
    s = await store.async_add_store("Tesco", "groceries")
    result = await store.async_delete_location(s["id"], 5)
    assert result is False


@pytest.mark.asyncio
async def test_update_settings(store):
    settings = await store.async_update_settings(global_proximity_m=500)
    assert settings["global_proximity_m"] == 500


@pytest.mark.asyncio
async def test_multiple_cards_per_store(store):
    s = await store.async_add_store("Albert", "groceries")
    await store.async_add_card(s["id"], "Karta 1", "111", "EAN_13")
    await store.async_add_card(s["id"], "Karta 2", "222", "QR_CODE")
    assert len(store.get_store(s["id"])["cards"]) == 2
