from __future__ import annotations

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.core import callback
from homeassistant.helpers import entity_registry as er
import homeassistant.helpers.config_validation as cv

from .const import (
    DOMAIN,
    CONF_DEVICE_TRACKERS,
    CONF_GLOBAL_PROXIMITY_M,
    CONF_NOTIFICATIONS_ENABLED,
    CONF_NOTIFICATION_DWELL_MINUTES,
    DEFAULT_GLOBAL_PROXIMITY_M,
    DEFAULT_NOTIFICATION_DWELL_MINUTES,
)


class LoyaltyCardsConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input=None):
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")

        if user_input is not None:
            return self.async_create_entry(
                title="Věrnostní karty",
                data={},
                options={
                    CONF_DEVICE_TRACKERS: user_input.get(CONF_DEVICE_TRACKERS, []),
                    CONF_GLOBAL_PROXIMITY_M: user_input.get(
                        CONF_GLOBAL_PROXIMITY_M, DEFAULT_GLOBAL_PROXIMITY_M
                    ),
                    CONF_NOTIFICATIONS_ENABLED: user_input.get(
                        CONF_NOTIFICATIONS_ENABLED, True
                    ),
                    CONF_NOTIFICATION_DWELL_MINUTES: user_input.get(
                        CONF_NOTIFICATION_DWELL_MINUTES, DEFAULT_NOTIFICATION_DWELL_MINUTES
                    ),
                },
            )

        tracker_entities = self._get_device_trackers()
        schema = vol.Schema(
            {
                vol.Optional(CONF_DEVICE_TRACKERS, default=[]): cv.multi_select(
                    {e: e for e in tracker_entities}
                ),
                vol.Optional(
                    CONF_GLOBAL_PROXIMITY_M, default=DEFAULT_GLOBAL_PROXIMITY_M
                ): vol.All(vol.Coerce(int), vol.Range(min=50, max=10000)),
                vol.Optional(CONF_NOTIFICATIONS_ENABLED, default=True): bool,
                vol.Optional(
                    CONF_NOTIFICATION_DWELL_MINUTES,
                    default=DEFAULT_NOTIFICATION_DWELL_MINUTES,
                ): vol.All(vol.Coerce(int), vol.Range(min=1, max=60)),
            }
        )

        return self.async_show_form(step_id="user", data_schema=schema)

    def _get_device_trackers(self) -> list[str]:
        registry = er.async_get(self.hass)
        return [
            e.entity_id
            for e in registry.entities.values()
            if e.entity_id.startswith("device_tracker.")
        ]

    @staticmethod
    @callback
    def async_get_options_flow(config_entry):
        return LoyaltyCardsOptionsFlow()


class LoyaltyCardsOptionsFlow(config_entries.OptionsFlow):
    async def async_step_init(self, user_input=None):
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        current = self.config_entry.options
        tracker_entities = self._get_device_trackers()

        schema = vol.Schema(
            {
                vol.Optional(
                    CONF_DEVICE_TRACKERS,
                    default=current.get(CONF_DEVICE_TRACKERS, []),
                ): cv.multi_select({e: e for e in tracker_entities}),
                vol.Optional(
                    CONF_GLOBAL_PROXIMITY_M,
                    default=current.get(CONF_GLOBAL_PROXIMITY_M, DEFAULT_GLOBAL_PROXIMITY_M),
                ): vol.All(vol.Coerce(int), vol.Range(min=50, max=10000)),
                vol.Optional(
                    CONF_NOTIFICATIONS_ENABLED,
                    default=current.get(CONF_NOTIFICATIONS_ENABLED, True),
                ): bool,
                vol.Optional(
                    CONF_NOTIFICATION_DWELL_MINUTES,
                    default=current.get(
                        CONF_NOTIFICATION_DWELL_MINUTES, DEFAULT_NOTIFICATION_DWELL_MINUTES
                    ),
                ): vol.All(vol.Coerce(int), vol.Range(min=1, max=60)),
            }
        )

        return self.async_show_form(step_id="init", data_schema=schema)

    def _get_device_trackers(self) -> list[str]:
        registry = er.async_get(self.hass)
        return [
            e.entity_id
            for e in registry.entities.values()
            if e.entity_id.startswith("device_tracker.")
        ]
