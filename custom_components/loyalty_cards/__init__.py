from __future__ import annotations

import json
import logging
import shutil
import uuid
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

# JS is copied to /config/www/loyalty-cards/ on every setup so /local/ serves it.
# Version in URL ensures browser re-fetches after integration updates.
_CARD_URL = f"/local/loyalty-cards/loyalty-cards-card.js?v={_VERSION}"
_CARD_URL_PREFIX = "/local/loyalty-cards/loyalty-cards-card.js"

# Storage key used by HA's Lovelace component for UI-managed resources.
_LOVELACE_RESOURCES_KEY = "lovelace_resources"


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

    # Copy JS and logos to /config/www/loyalty-cards/ so HA serves them at /local/.
    # This runs on every setup/reload, ensuring files are always current.
    await hass.async_add_executor_job(_deploy_www, hass)

    # Register the card URL for the current session.
    # Clean up accumulated stale entries first to prevent double-loading.
    _cleanup_extra_module_urls(hass)
    add_extra_js_url(hass, _CARD_URL)

    # Register in Lovelace resource storage so the card loads before
    # the dashboard renders (fixes "Custom element doesn't exist").
    # Run after HA is fully started so lovelace data is available.
    async def _register(_event=None):
        await _async_register_lovelace_resource(hass, _CARD_URL)

    if hass.is_running:
        await _register()
    else:
        hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, _register)

    _register_services(hass, store)
    _register_websocket(hass, store)
    entry.async_on_unload(entry.add_update_listener(_async_update_listener))
    return True


def _deploy_www(hass: HomeAssistant) -> None:
    """Copy JS and bundled logos to /config/www/loyalty-cards/ (blocking)."""
    src_www = Path(__file__).parent / "www"
    dst_www = Path(hass.config.path("www", "loyalty-cards"))
    dst_www.mkdir(parents=True, exist_ok=True)

    js = src_www / "loyalty-cards-card.js"
    if js.exists():
        shutil.copy2(str(js), str(dst_www / "loyalty-cards-card.js"))

    src_logos = src_www / "logos"
    if src_logos.is_dir():
        dst_logos = dst_www / "logos"
        dst_logos.mkdir(exist_ok=True)
        for f in src_logos.iterdir():
            if f.is_file():
                dst = dst_logos / f.name
                # Copy only when source is newer (avoids 50 × disk writes on every reload)
                if not dst.exists() or f.stat().st_mtime > dst.stat().st_mtime:
                    shutil.copy2(str(f), str(dst))


def _cleanup_extra_module_urls(hass: HomeAssistant) -> None:
    """Remove all our stale card URLs to prevent duplicate module loading."""
    url_list: list = hass.data.get("frontend_extra_module_url", [])
    stale = [u for u in url_list if u.startswith(_CARD_URL_PREFIX)
             or u.startswith("/loyalty_cards_www/loyalty-cards-card.js")]
    for u in stale:
        url_list.remove(u)


async def _async_register_lovelace_resource(hass: HomeAssistant, url: str) -> None:
    """Ensure our card is in Lovelace resources for reliable pre-render loading.

    Uses the in-memory ResourceStorageCollection when available (storage UI mode)
    and also writes directly to the storage file so the entry survives HA restarts.
    Falls back gracefully for YAML-mode Lovelace (add_extra_js_url covers that case).
    """
    registered = False

    # ── Method A: in-memory collection (current session) ──────────────────────
    try:
        lovelace = hass.data.get("lovelace")
        resources = (lovelace or {}).get("resources")
        if resources is not None:
            if not getattr(resources, "loaded", True):
                await resources.async_load()

            items = list(resources.async_items())
            found = False
            for item in items:
                item_url = item.get("url", "")
                if item_url.startswith(_CARD_URL_PREFIX) or item_url.startswith(
                    "/loyalty_cards_www/loyalty-cards-card.js"
                ):
                    if item_url == url:
                        found = True
                    else:
                        await resources.async_delete_item(item["id"])

            if not found:
                await resources.async_create_item({"res_type": "module", "url": url})
                _LOGGER.info("Lovelace resource registered (in-memory): %s", url)
            registered = True
    except Exception as err:
        _LOGGER.debug("In-memory Lovelace registration failed: %s", err)

    # ── Method B: direct storage write (persists across restarts) ─────────────
    # Even when Method A succeeds, the storage file may not be updated until the
    # collection saves on its own schedule.  Writing here guarantees the entry
    # survives the next HA restart so the card loads before the dashboard renders.
    try:
        from homeassistant.helpers.storage import Store

        store = Store(hass, version=1, key=_LOVELACE_RESOURCES_KEY)
        data = await store.async_load()

        if data is None:
            # File doesn't exist yet; only create it when in-memory failed too,
            # otherwise the collection will create/manage it on its own.
            if not registered:
                data = {"items": []}
            else:
                _LOGGER.debug(
                    "Lovelace storage file absent; in-memory registration is sufficient"
                )
                return

        items: list[dict] = data.get("items", [])

        clean = [
            item for item in items
            if not (
                item.get("url", "").startswith(_CARD_URL_PREFIX)
                or item.get("url", "").startswith("/loyalty_cards_www/loyalty-cards-card.js")
            )
        ]
        already_correct = any(i.get("url") == url for i in items)
        removed_old = len(clean) < len(items)

        if not already_correct or removed_old:
            clean.append({"id": str(uuid.uuid4()), "res_type": "module", "url": url})
            data["items"] = clean
            await store.async_save(data)
            _LOGGER.info("Lovelace resource saved to storage: %s", url)

    except Exception as err:
        _LOGGER.warning("Lovelace storage write failed: %s", err)


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
