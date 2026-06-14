DOMAIN = "loyalty_cards"
STORAGE_KEY = "loyalty_cards"
STORAGE_VERSION = 1

CONF_DEVICE_TRACKERS = "device_trackers"
CONF_GLOBAL_PROXIMITY_M = "global_proximity_m"
CONF_NOTIFICATIONS_ENABLED = "notifications_enabled"
CONF_NOTIFICATION_DWELL_MINUTES = "notification_dwell_minutes"

DEFAULT_GLOBAL_PROXIMITY_M = 300
DEFAULT_NOTIFICATION_DWELL_MINUTES = 7

CATEGORY_LABELS: dict[str, str] = {
    "groceries":   "Potraviny",
    "drugstore":   "Drogerie",
    "pharmacy":    "Lékárna",
    "diy":         "Hobby & Nástroje",
    "electronics": "Elektronika",
    "sport":       "Sport",
    "fashion":     "Móda",
    "fastfood":    "Fastfood",
    "toys":        "Hračkářství",
    "other":       "Ostatní",
}

CATEGORIES = list(CATEGORY_LABELS.keys())

# Katalog předdefinovaných obchodů — klíč musí odpovídat názvu souboru loga (bez přípony)
CZECH_STORES: list[dict] = [
    # Potraviny
    {"key": "albert",       "name": "Albert",               "category": "groceries"},
    {"key": "billa",        "name": "Billa",                "category": "groceries"},
    {"key": "kaufland",     "name": "Kaufland",             "category": "groceries"},
    {"key": "lidl",         "name": "Lidl",                 "category": "groceries"},
    {"key": "penny",        "name": "Penny",                "category": "groceries"},
    {"key": "tesco",        "name": "Tesco",                "category": "groceries"},
    {"key": "globus",       "name": "Globus",               "category": "groceries"},
    {"key": "coop",         "name": "COOP",                 "category": "groceries"},
    {"key": "norma",        "name": "Norma",                "category": "groceries"},
    # Drogerie
    {"key": "dm",           "name": "dm",                   "category": "drugstore"},
    {"key": "rossmann",     "name": "Rossmann",             "category": "drugstore"},
    {"key": "teta",         "name": "Teta",                 "category": "drugstore"},
    # Lékárna
    {"key": "drmax",        "name": "Dr. Max",              "category": "pharmacy"},
    {"key": "benu",         "name": "Benu",                 "category": "pharmacy"},
    {"key": "pilulka",      "name": "Pilulka.cz",           "category": "pharmacy"},
    {"key": "lekarnacz",    "name": "Lékárna.cz",           "category": "pharmacy"},
    # Hobby & Nástroje
    {"key": "obi",          "name": "OBI",                  "category": "diy"},
    {"key": "bauhaus",      "name": "Bauhaus",              "category": "diy"},
    {"key": "hornbach",     "name": "Hornbach",             "category": "diy"},
    # Elektronika
    {"key": "alza",         "name": "Alza",                 "category": "electronics"},
    {"key": "czc",          "name": "CZC",                  "category": "electronics"},
    {"key": "datart",       "name": "Datart",               "category": "electronics"},
    {"key": "electroworld", "name": "Electroworld",         "category": "electronics"},
    # Sport
    {"key": "decathlon",    "name": "Decathlon",            "category": "sport"},
    {"key": "sportisimo",   "name": "Sportisimo",           "category": "sport"},
    {"key": "hervis",       "name": "Hervis",               "category": "sport"},
    # Móda
    {"key": "hm",           "name": "H&M",                  "category": "fashion"},
    {"key": "zara",         "name": "Zara",                 "category": "fashion"},
    {"key": "reserved",     "name": "Reserved",             "category": "fashion"},
    {"key": "primark",      "name": "Primark",              "category": "fashion"},
    {"key": "ccc",          "name": "CCC",                  "category": "fashion"},
    {"key": "deichmann",    "name": "Deichmann",            "category": "fashion"},
    {"key": "newyorker",    "name": "New Yorker",           "category": "fashion"},
    {"key": "pepco",        "name": "Pepco",                "category": "fashion"},
    {"key": "kik",          "name": "KIK",                  "category": "fashion"},
    {"key": "zoot",         "name": "Zoot",                 "category": "fashion"},
    # Fastfood
    {"key": "mcdonalds",    "name": "McDonald's",           "category": "fastfood"},
    {"key": "kfc",          "name": "KFC",                  "category": "fastfood"},
    {"key": "burgerking",   "name": "Burger King",          "category": "fastfood"},
    {"key": "subway",       "name": "Subway",               "category": "fastfood"},
    {"key": "pizzahut",     "name": "Pizza Hut",            "category": "fastfood"},
    {"key": "starbucks",    "name": "Starbucks",            "category": "fastfood"},
    {"key": "costacoffee",  "name": "Costa Coffee",         "category": "fastfood"},
    {"key": "bageterie",    "name": "Bageterie Boulevard",  "category": "fastfood"},
    # Hračkářství
    {"key": "sparkys",      "name": "Sparkys",              "category": "toys"},
    {"key": "bambule",      "name": "Bambule",              "category": "toys"},
    {"key": "hamleys",      "name": "Hamleys",              "category": "toys"},
    {"key": "dracik",       "name": "Dráčik",               "category": "toys"},
    # Ostatní
    {"key": "ikea",         "name": "IKEA",                 "category": "other"},
    {"key": "okay",         "name": "Okay",                 "category": "other"},
    {"key": "kika",         "name": "Kika",                 "category": "other"},
    {"key": "tchibo",       "name": "Tchibo",               "category": "other"},
    {"key": "action",       "name": "Action",               "category": "other"},
    {"key": "flyingtiger",  "name": "Flying Tiger",         "category": "other"},
]

BARCODE_TYPES = [
    "EAN_13", "EAN_8", "UPC_A", "UPC_E",
    "CODE_128", "CODE_39", "ITF",
    "QR_CODE", "DATA_MATRIX", "PDF_417", "AZTEC",
]

WS_TYPE_GET_DATA    = "loyalty_cards/get_data"
WS_TYPE_GET_CATALOG = "loyalty_cards/get_catalog"
WS_TYPE_GET_STORES  = "loyalty_cards/get_stores"

EVENT_DATA_UPDATED = "loyalty_cards_updated"

BUNDLED_LOGO_DIR    = "www/loyalty-cards/logos"
BUNDLED_LOGO_URL    = "/local/loyalty-cards/logos"
USER_LOGO_DIR       = "image/loyalty-card-logos"
USER_LOGO_URL_PREFIX = "/loyalty-card-logos"

