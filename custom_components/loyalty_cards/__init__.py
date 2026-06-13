from __future__ import annotations

import logging
import shutil
from pathlib import Path

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, ServiceCall, callback
import homeassistant.helpers.config_validation as cv

from .const import (
    DOMAIN,
    CONF_DEVICE_TRACKERS,
    CONF_GLOBAL_PROXIMITY_M,
    CONF_NOTIFICATIONS_ENABLED,
    CONF_NOTIFICATION_DWELL_MINUTES,
    EVENT_DATA_UPDATED,
    WS_TYPE_GET_DATA,
)
from .logo_manager import async_delete_logo, async_download_logo, async_save_logo_base64
from .store import LoyaltyCardStore

_LOGGER = logging.getLogger(__name__)

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    hass.data.setdefault(DOMAIN, {})
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    store = LoyaltyCardStore(hass)
    await store.async_load()

    opts = entry.options
    if opts:
        await store.async_update_settings(
            device_trackers=opts.get(CONF_DEVICE_TRACKERS, []),
            global_proximity_m=opts.get(CONF_GLOBAL_PROXIMITY_M, 300),
            notifications_enabled=opts.get(CONF_NOTIFICATIONS_ENABLED, True),
            notification_dwell_minutes=opts.get(CONF_NOTIFICATION_DWELL_MINUTES, 7),
        )

    hass.data[DOMAIN]["store"] = store

    await hass.async_add_executor_job(_deploy_logos, hass)

    _register_services(hass, store)
    _register_websocket(hass, store)
    entry.async_on_unload(entry.add_update_listener(_async_update_listener))
    return True


def _deploy_logos(hass: HomeAssistant) -> None:
    """Copy bundled logos to /config/www/loyalty-cards/logos/ (blocking)."""
    src_logos = Path(__file__).parent / "www" / "logos"
    if not src_logos.is_dir():
        return
    dst_logos = Path(hass.config.path("www", "loyalty-cards", "logos"))
    dst_logos.mkdir(parents=True, exist_ok=True)
    for f in src_logos.iterdir():
        if f.is_file():
            dst = dst_logos / f.name
            if not dst.exists() or f.stat().st_mtime > dst.stat().st_mtime:
                shutil.copy2(str(f), str(dst))


async def _async_update_listener(hass: HomeAssistant, entry: ConfigEntry) -> None:
    opts = entry.options
    store: LoyaltyCardStore = hass.data[DOMAIN]["store"]
    await store.async_update_settings(
        device_trackers=opts.get(CONF_DEVICE_TRACKERS, []),
        global_proximity_m=opts.get(CONF_GLOBAL_PROXIMITY_M, 300),
        notifications_enabled=opts.get(CONF_NOTIFICATIONS_ENABLED, True),
        notification_dwell_minutes=opts.get(CONF_NOTIFICATION_DWELL_MINUTES, 7),
    )
    hass.bus.fire(EVENT_DATA_UPDATED)


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    hass.data[DOMAIN].pop("store", None)
    return True


def _fire_updated(hass: HomeAssistant) -> None:
    hass.bus.async_fire(EVENT_DATA_UPDATED)


def _register_services(hass: HomeAssistant, store: LoyaltyCardStore) -> None:

    async def handle_add_store(call: ServiceCall) -> None:
        await store.async_add_store(
            name=call.data["name"],
            category=call.data.get("category", "other"),
            tile_color=call.data.get("tile_color", "#1976d2"),
        )
        _fire_updated(hass)

    async def handle_update_store(call: ServiceCall) -> None:
        await store.async_update_store(call.data["store_id"], **{
            k: call.data[k] for k in ("name", "category", "tile_color") if k in call.data
        })
        _fire_updated(hass)

    async def handle_delete_store(call: ServiceCall) -> None:
        store_id = call.data["store_id"]
        await async_delete_logo(hass, store_id)
        await store.async_delete_store(store_id)
        _fire_updated(hass)

    async def handle_add_card(call: ServiceCall) -> None:
        await store.async_add_card(
            store_id=call.data["store_id"],
            name=call.data["name"],
            barcode=call.data["barcode"],
            barcode_type=call.data.get("barcode_type", "EAN_13"),
            notes=call.data.get("notes", ""),
        )
        _fire_updated(hass)

    async def handle_update_card(call: ServiceCall) -> None:
        await store.async_update_card(call.data["card_id"], **{
            k: call.data[k] for k in ("name", "barcode", "barcode_type", "notes") if k in call.data
        })
        _fire_updated(hass)

    async def handle_delete_card(call: ServiceCall) -> None:
        await store.async_delete_card(call.data["card_id"])
        _fire_updated(hass)

    async def handle_add_location(call: ServiceCall) -> None:
        await store.async_add_location(
            store_id=call.data["store_id"],
            lat=call.data["lat"],
            lon=call.data["lon"],
            radius_m=call.data.get("radius_m", 300),
            label=call.data.get("label", ""),
        )
        _fire_updated(hass)

    async def handle_delete_location(call: ServiceCall) -> None:
        await store.async_delete_location(
            call.data["store_id"], call.data["location_index"]
        )
        _fire_updated(hass)

    async def handle_download_logo(call: ServiceCall) -> None:
        store_id = call.data["store_id"]
        path = await async_download_logo(hass, store_id, call.data["url"])
        if path:
            await store.async_update_store(store_id, logo_path=path)
            _fire_updated(hass)

    async def handle_upload_logo(call: ServiceCall) -> None:
        store_id = call.data["store_id"]
        path = await async_save_logo_base64(hass, store_id, call.data["data_url"])
        if path:
            await store.async_update_store(store_id, logo_path=path)
            _fire_updated(hass)

    async def handle_delete_logo(call: ServiceCall) -> None:
        store_id = call.data["store_id"]
        await async_delete_logo(hass, store_id)
        await store.async_update_store(store_id, logo_path=None)
        _fire_updated(hass)

    async def handle_update_settings(call: ServiceCall) -> None:
        await store.async_update_settings(**{
            k: call.data[k]
            for k in (
                "device_trackers",
                "global_proximity_m",
                "notifications_enabled",
                "notification_dwell_minutes",
            )
            if k in call.data
        })
        _fire_updated(hass)

    hass.services.async_register(DOMAIN, "add_store", handle_add_store)
    hass.services.async_register(DOMAIN, "update_store", handle_update_store)
    hass.services.async_register(DOMAIN, "delete_store", handle_delete_store)
    hass.services.async_register(DOMAIN, "add_card", handle_add_card)
    hass.services.async_register(DOMAIN, "update_card", handle_update_card)
    hass.services.async_register(DOMAIN, "delete_card", handle_delete_card)
    hass.services.async_register(DOMAIN, "add_location", handle_add_location)
    hass.services.async_register(DOMAIN, "delete_location", handle_delete_location)
    hass.services.async_register(DOMAIN, "download_logo", handle_download_logo)
    hass.services.async_register(DOMAIN, "upload_logo", handle_upload_logo)
    hass.services.async_register(DOMAIN, "delete_logo", handle_delete_logo)
    hass.services.async_register(DOMAIN, "update_settings", handle_update_settings)


def _register_websocket(hass: HomeAssistant, store: LoyaltyCardStore) -> None:

    @websocket_api.websocket_command({
        vol.Required("type"): WS_TYPE_GET_DATA,
    })
    @callback
    def ws_get_data(
        hass: HomeAssistant,
        connection: websocket_api.ActiveConnection,
        msg: dict,
    ) -> None:
        connection.send_result(msg["id"], store.data)

    websocket_api.async_register_command(hass, ws_get_data)
