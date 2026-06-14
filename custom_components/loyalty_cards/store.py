from __future__ import annotations

import uuid
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import (
    STORAGE_KEY,
    STORAGE_VERSION,
    DEFAULT_GLOBAL_PROXIMITY_M,
    DEFAULT_NOTIFICATION_DWELL_MINUTES,
)


def _new_id() -> str:
    return str(uuid.uuid4())


class LoyaltyCardStore:
    def __init__(self, hass: HomeAssistant) -> None:
        self._store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self._data: dict[str, Any] = {}

    @property
    def data(self) -> dict[str, Any]:
        return self._data

    async def async_load(self) -> None:
        stored = await self._store.async_load()
        if stored is None:
            self._data = self._default_data()
        else:
            self._data = stored
            self._migrate(stored)

    def _default_data(self) -> dict[str, Any]:
        return {
            "version": STORAGE_VERSION,
            "stores": [],
            "settings": {
                "device_trackers": [],
                "global_proximity_m": DEFAULT_GLOBAL_PROXIMITY_M,
                "notifications_enabled": True,
                "notification_dwell_minutes": DEFAULT_NOTIFICATION_DWELL_MINUTES,
            },
        }

    def _migrate(self, data: dict[str, Any]) -> None:
        if "settings" not in data:
            data["settings"] = self._default_data()["settings"]
        if "stores" not in data:
            data["stores"] = []
        for store in data.get("stores", []):
            store.setdefault("store_key", None)

    async def async_save(self) -> None:
        await self._store.async_save(self._data)

    # ------------------------------------------------------------------ stores

    def get_stores(self) -> list[dict]:
        return self._data.get("stores", [])

    def get_store(self, store_id: str) -> dict | None:
        return next((s for s in self.get_stores() if s["id"] == store_id), None)

    async def async_add_store(
        self,
        name: str,
        category: str = "other",
        tile_color: str = "#1976d2",
        store_key: str | None = None,
    ) -> dict:
        store = {
            "id": _new_id(),
            "name": name,
            "category": category,
            "store_key": store_key,
            "logo_path": None,
            "tile_color": tile_color,
            "locations": [],
            "cards": [],
        }
        self._data["stores"].append(store)
        await self.async_save()
        return store

    async def async_update_store(self, store_id: str, **kwargs) -> dict | None:
        store = self.get_store(store_id)
        if store is None:
            return None
        allowed = {"name", "category", "tile_color", "logo_path", "store_key"}
        for k, v in kwargs.items():
            if k in allowed:
                store[k] = v
        await self.async_save()
        return store

    async def async_delete_store(self, store_id: str) -> bool:
        stores = self.get_stores()
        before = len(stores)
        self._data["stores"] = [s for s in stores if s["id"] != store_id]
        if len(self._data["stores"]) < before:
            await self.async_save()
            return True
        return False

    # ------------------------------------------------------------------- cards

    def _find_card(self, card_id: str) -> tuple[dict | None, dict | None]:
        for store in self.get_stores():
            for card in store.get("cards", []):
                if card["id"] == card_id:
                    return store, card
        return None, None

    async def async_add_card(
        self,
        store_id: str,
        name: str,
        barcode: str,
        barcode_type: str = "EAN_13",
        notes: str = "",
    ) -> dict | None:
        store = self.get_store(store_id)
        if store is None:
            return None
        card = {
            "id": _new_id(),
            "name": name,
            "barcode": barcode,
            "barcode_type": barcode_type,
            "notes": notes,
        }
        store.setdefault("cards", []).append(card)
        await self.async_save()
        return card

    async def async_update_card(self, card_id: str, **kwargs) -> dict | None:
        _, card = self._find_card(card_id)
        if card is None:
            return None
        allowed = {"name", "barcode", "barcode_type", "notes"}
        for k, v in kwargs.items():
            if k in allowed:
                card[k] = v
        await self.async_save()
        return card

    async def async_delete_card(self, card_id: str) -> bool:
        for store in self.get_stores():
            before = len(store.get("cards", []))
            store["cards"] = [c for c in store.get("cards", []) if c["id"] != card_id]
            if len(store["cards"]) < before:
                await self.async_save()
                return True
        return False

    # --------------------------------------------------------------- locations

    async def async_add_location(
        self,
        store_id: str,
        lat: float,
        lon: float,
        radius_m: int = 300,
        label: str = "",
    ) -> dict | None:
        store = self.get_store(store_id)
        if store is None:
            return None
        location = {"lat": lat, "lon": lon, "radius_m": radius_m, "label": label}
        store.setdefault("locations", []).append(location)
        await self.async_save()
        return location

    async def async_delete_location(self, store_id: str, location_index: int) -> bool:
        store = self.get_store(store_id)
        if store is None:
            return False
        locs = store.get("locations", [])
        if location_index < 0 or location_index >= len(locs):
            return False
        locs.pop(location_index)
        await self.async_save()
        return True

    # --------------------------------------------------------------- settings

    def get_settings(self) -> dict:
        return self._data.get("settings", {})

    async def async_update_settings(self, **kwargs) -> dict:
        settings = self._data.setdefault("settings", {})
        allowed = {
            "device_trackers",
            "global_proximity_m",
            "notifications_enabled",
            "notification_dwell_minutes",
        }
        for k, v in kwargs.items():
            if k in allowed:
                settings[k] = v
        await self.async_save()
        return settings
