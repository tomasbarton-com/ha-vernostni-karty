"""Mock Home Assistant modules so unit tests run without a full HA install."""
import sys
from unittest.mock import AsyncMock, MagicMock


def _mock(name, **attrs):
    mod = MagicMock(name=name)
    for k, v in attrs.items():
        setattr(mod, k, v)
    sys.modules[name] = mod
    return mod


# ── homeassistant core stubs ────────────────────────────────────────────────

ha_core = _mock("homeassistant")
ha_core.core = _mock("homeassistant.core")
ha_core.core.HomeAssistant = MagicMock
ha_core.core.ServiceCall = MagicMock
ha_core.core.callback = lambda f: f

config_entries_mod = _mock("homeassistant.config_entries")

class _FakeConfigEntry:
    def __init__(self):
        self.options = {}
    def add_update_listener(self, cb):
        return lambda: None
    def async_on_unload(self, *a):
        pass

config_entries_mod.ConfigEntry = _FakeConfigEntry

class _FakeConfigFlow:
    def __init__(self, *a, **kw):
        pass
    def _async_current_entries(self):
        return []
    async def async_step_user(self, user_input=None):
        pass
    def async_abort(self, reason):
        pass
    def async_show_form(self, **kw):
        pass
    def async_create_entry(self, **kw):
        pass

config_entries_mod.ConfigFlow = _FakeConfigFlow

class _FakeOptionsFlow:
    def __init__(self, *a, **kw):
        pass

config_entries_mod.OptionsFlow = _FakeOptionsFlow

# helpers
helpers_mod = _mock("homeassistant.helpers")
helpers_storage = _mock("homeassistant.helpers.storage")

class FakeStore:
    def __init__(self, hass, version, key):
        self._data = None
    async def async_load(self):
        return self._data
    async def async_save(self, data):
        self._data = data

helpers_storage.Store = FakeStore
helpers_mod.storage = helpers_storage

helpers_er = _mock("homeassistant.helpers.entity_registry")
helpers_er.async_get = MagicMock(return_value=MagicMock(entities={}))
helpers_mod.entity_registry = helpers_er

helpers_cv = _mock("homeassistant.helpers.config_validation")
helpers_cv.config_entry_only_config_schema = lambda d: d
helpers_cv.multi_select = lambda opts: opts
helpers_mod.config_validation = helpers_cv

# websocket_api
ws_mod = _mock("homeassistant.components.websocket_api")
ws_mod.websocket_command = lambda schema: (lambda f: f)
ws_mod.async_register_command = MagicMock()
ws_mod.ActiveConnection = MagicMock

# components.http
http_mod = _mock("homeassistant.components.http")
http_mod.StaticPathConfig = MagicMock

# voluptuous aliases
import voluptuous as vol
sys.modules["voluptuous"] = vol

# components (generic)
_mock("homeassistant.components")
_mock("homeassistant.components.http")

frontend_mod = _mock("homeassistant.components.frontend")
frontend_mod.add_extra_js_url = MagicMock()

# Sub-module aliases so imports resolve
sys.modules["homeassistant.core"] = ha_core.core
sys.modules["homeassistant.config_entries"] = config_entries_mod
sys.modules["homeassistant.helpers"] = helpers_mod
sys.modules["homeassistant.helpers.storage"] = helpers_storage
sys.modules["homeassistant.helpers.entity_registry"] = helpers_er
sys.modules["homeassistant.helpers.config_validation"] = helpers_cv
sys.modules["homeassistant.components.websocket_api"] = ws_mod
sys.modules["homeassistant.components.http"] = http_mod
sys.modules["homeassistant.components.frontend"] = frontend_mod
