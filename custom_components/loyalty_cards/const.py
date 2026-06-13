DOMAIN = "loyalty_cards"
STORAGE_KEY = "loyalty_cards"
STORAGE_VERSION = 1

CONF_DEVICE_TRACKERS = "device_trackers"
CONF_GLOBAL_PROXIMITY_M = "global_proximity_m"
CONF_NOTIFICATIONS_ENABLED = "notifications_enabled"
CONF_NOTIFICATION_DWELL_MINUTES = "notification_dwell_minutes"

DEFAULT_GLOBAL_PROXIMITY_M = 300
DEFAULT_NOTIFICATION_DWELL_MINUTES = 7

CATEGORIES = [
    "groceries",
    "drugstore",
    "pharmacy",
    "diy",
    "electronics",
    "sport",
    "fashion",
    "fastfood",
    "toys",
    "other",
]

BARCODE_TYPES = [
    "EAN_13",
    "EAN_8",
    "UPC_A",
    "UPC_E",
    "CODE_128",
    "CODE_39",
    "ITF",
    "QR_CODE",
    "DATA_MATRIX",
    "PDF_417",
    "AZTEC",
]

WS_TYPE_GET_DATA = "loyalty_cards/get_data"
WS_TYPE_GET_STORES = "loyalty_cards/get_stores"

EVENT_DATA_UPDATED = "loyalty_cards_updated"

BUNDLED_LOGO_DIR = "www/loyalty-cards/logos"
USER_LOGO_DIR = "image/loyalty-card-logos"
USER_LOGO_URL_PREFIX = "/loyalty-card-logos"
