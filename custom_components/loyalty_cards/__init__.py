from __future__ import annotations

import json
import logging
from pathlib import Path

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.components.frontend import add_extra_js_url
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EVENT_HOMEASSISTANT_STARTED
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
_VERSION = json.loads(
    (Path(__file__).parent / "manifest.json").read_text()
).get("version", "0")

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

# Primary URL — served directly from www/ via async_register_static_paths.
# No file-copying needed; HACS updates files in-place.
_STATIC_URL_BASE = "/loyalty_cards_www"
_CARD_URL = f"{_STATIC_URL_BASE}/loyalty-cards-card.js?v={_VERSION}"

# Legacy URLs from v0.2.0–v0.2.5 that we must clean up.
_LEGACY_URL_PREFIXES = (
    "/local/loyalty-cards/loyalty-cards-card.js",
    "/loyalty_cards_www/loyalty-cards-card.js",
)


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Register static file serving once per HA session (not per reload)."""
    hass.data.setdefault(DOMAIN, {})

    if not hass.data[DOMAIN].get("static_registered"):
        try:
            from homeassistant.components.http import StaticPathConfig  # HA ≥ 2023.9
            await hass.http.async_register_static_paths([
                StaticPathConfig(
                    url_path=_STATIC_URL_BASE,
                    path=str(Path(__file__).parent / "www"),
                    cache_headers=True,
                )
            ])
            hass.data[DOMAIN]["static_registered"] = True
            _LOGGER.debug("Registered static assets at %s", _STATIC_URL_BASE)
        except Exception as err:
            _LOGGER.warning(
                "async_register_static_paths not available (%s) — "
                "falling back to /config/www/ copy",
                err,
            )
            # Older HA: copy files to /config/www/ so /local/ serves them.
            await _copy_www_fallback(hass)

    return True


async def _copy_www_fallback(hass: HomeAssistant) -> None:
    """Copy JS + logos to /config/www/ for HA versions without static-path registration."""
    import shutil

    www_src = Path(__file__).parent / "www"
    www_dst = Path(hass.config.path("www", "loyalty-cards"))

    def _do_copy() -> None:
        www_dst.mkdir(parents=True, exist_ok=True)
        js_src = www_src / "loyalty-cards-card.js"
        if js_src.exists():
            shutil.copy2(str(js_src), str(www_dst / "loyalty-cards-card.js"))
        logos_src = www_src / "logos"
        if logos_src.is_dir():
            logos_dst = www_dst / "logos"
            logos_dst.mkdir(parents=True, exist_ok=True)
            for f in logos_src.iterdir():
                if f.is_file():
                    shutil.copy2(str(f), str(logos_dst / f.name))

    try:
        await hass.async_add_executor_job(_do_copy)
        _LOGGER.debug("Copied www assets to /config/www/loyalty-cards/")
    except Exception as err:
        _LOGGER.error("Failed to copy www assets: %s", err)


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

    # Keep add_extra_js_url as fallback for YAML-mode Lovelace.
    # Clean up stale entries first to prevent multiple versions loading at once.
    _cleanup_extra_module_urls(hass)
    add_extra_js_url(hass, _CARD_URL)

    # Register the resource properly in Lovelace storage (storage mode).
    # Must wait until HA is fully started so lovelace data is available.
    async def _register_lovelace(_event=None):
        await _async_register_lovelace_resource(hass, _CARD_URL)

    if hass.is_running:
        await _register_lovelace()
    else:
        hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, _register_lovelace)

    _register_services(hass, store)
    _register_websocket(hass, store)
    entry.async_on_unload(entry.add_update_listener(_async_update_listener))
    return True


def _cleanup_extra_module_urls(hass: HomeAssistant) -> None:
    """Remove all our old card URLs from HA's extra-module list to prevent duplicates."""
    url_list: list = hass.data.get("frontend_extra_module_url", [])
    stale = [u for u in url_list if any(u.startswith(p) for p in _LEGACY_URL_PREFIXES)]
    for u in stale:
        url_list.remove(u)


async def _async_register_lovelace_resource(hass: HomeAssistant, url: str) -> None:
    """Add or update our card in Lovelace resource storage; remove legacy entries."""
    try:
        lovelace = hass.data.get("lovelace")
        if not lovelace:
            _LOGGER.debug("Lovelace data not available; skipping resource registration")
            return
        resources = lovelace.get("resources")
        if resources is None:
            _LOGGER.debug("Lovelace in YAML mode; resource must be added manually")
            return

        if not getattr(resources, "loaded", True):
            await resources.async_load()

        url_base = url.split("?")[0]
        items = list(resources.async_items())
        found_current = False

        for item in items:
            item_url = item.get("url", "")
            item_base = item_url.split("?")[0]

            is_legacy = any(item_base.startswith(p) for p in _LEGACY_URL_PREFIXES) and item_base != url_base
            is_current = item_base == url_base

            if is_legacy:
                await resources.async_delete_item(item["id"])
                _LOGGER.info("Removed legacy Lovelace resource: %s", item_url)
            elif is_current:
                if item_url != url:
                    await resources.async_update_item(
                        item["id"], {"res_type": "module", "url": url}
                    )
                    _LOGGER.info("Updated Lovelace resource → %s", url)
                found_current = True

        if not found_current:
            await resources.async_create_item({"res_type": "module", "url": url})
            _LOGGER.info("Registered Lovelace resource: %s", url)

    except Exception as err:
        _LOGGER.warning("Lovelace resource registration failed: %s", err)


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
