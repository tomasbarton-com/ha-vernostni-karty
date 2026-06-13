# Věrnostní karty pro Home Assistant

[![HACS](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
[![Verze](https://img.shields.io/badge/verze-0.3.0-blue.svg)](https://github.com/tomasbarton-com/ha-vernostni-karty/releases)

Správa věrnostních karet obchodů přímo v Home Assistantu. Zobrazí čárový nebo QR kód na pokladně, detekuje polohu telefonu a upozorní, když jste u obchodu s vaší kartou.

> **Od verze 0.3.0** jsou integrace (backend) a ovládací panel (Lovelace karta) **odděleny** a instalují se zvlášť.

---

## Funkce

- **Správa karet** – přidání, úprava, mazání věrnostních karet
- **Skenování** – načtení kódu kamerou nebo z obrázku (EAN-13, EAN-8, Code 128, QR, DataMatrix, PDF-417, Aztec…)
- **Fullscreen zobrazení** – čárový nebo QR kód přes celou obrazovku pro skenování na pokladně
- **Loga obchodů** – 48 předinstalovaných českých obchodů + stažení z URL nebo nahrání ze souboru
- **Detekce polohy** – záložka „Poblíž" dle GPS z vybraného `device_tracker`
- **Notifikace** – připomínka karty po nastavené době strávené v lokalitě
- **Více karet na obchod** – přepínání záložkami v detailu obchodu
- **Databáze** – 48 přednastavených českých obchodů (potraviny, drogerie, fastfood…)

---

## Instalace

### Krok 1 – Integrace (backend)

Přes HACS jako vlastní repozitář:

1. HACS → Integrace → tři tečky → Vlastní repozitáře
2. URL: `https://github.com/tomasbarton-com/ha-vernostni-karty`, typ: **Integrace**
3. Nainstalujte „Věrnostní karty" a restartujte Home Assistant
4. Nastavení → Integrace → Přidat integraci → **Věrnostní karty**

### Krok 2 – Ovládací panel (Lovelace karta)

Karta se instaluje zvlášť z vlastního repozitáře:

**Přes HACS (doporučeno):**

1. HACS → Frontend → tři tečky → Vlastní repozitáře
2. URL: `https://github.com/tomasbarton-com/ha-vernostni-karty-card`, typ: **Lovelace**
3. Nainstalujte „Věrnostní karty – karta"
4. Dejte souhlasit s restartem Lovelace

**Ručně:**

1. Stáhněte `loyalty-cards-card.js` z [Releases](https://github.com/tomasbarton-com/ha-vernostni-karty/releases)
2. Uložte do `/config/www/loyalty-cards/loyalty-cards-card.js`
3. Nastavení → Dashboardy → tři tečky → Upravit → **Spravovat zdroje** → Přidat:
   - URL: `/local/loyalty-cards/loyalty-cards-card.js`
   - Typ: **JavaScript modul**

### Krok 3 – Přidání karty do dashboardu

```yaml
type: custom:loyalty-cards-card
```

Volitelná konfigurace:

```yaml
type: custom:loyalty-cards-card
layout: flat        # "flat" = skupiny dle kategorie; výchozí = záložky
```

---

## Konfigurace integrace

Po přidání integrace (Nastavení → Integrace → Věrnostní karty → Konfigurovat):

| Parametr | Výchozí | Popis |
|----------|---------|-------|
| `device_trackers` | `[]` | Entity `device_tracker.*` telefonu pro GPS detekci |
| `global_proximity_m` | `300` | Výchozí vzdálenost (metry) pro záložku „Poblíž" |
| `notifications_enabled` | `true` | Zapnout/vypnout notifikace |
| `notification_dwell_minutes` | `7` | Minuty strávené v lokalitě před notifikací |

---

## Služby (Services)

Všechny operace lze volat jako Home Assistant služby. Hodí se pro automatizace.

### `loyalty_cards.add_store`

Přidá nový obchod.

| Parametr | Typ | Povinný | Popis |
|----------|-----|---------|-------|
| `name` | string | ✓ | Název obchodu |
| `category` | string | | Kategorie (viz tabulka níže), výchozí `other` |
| `tile_color` | string | | Barva dlaždice jako hex, výchozí `#1976d2` |

```yaml
service: loyalty_cards.add_store
data:
  name: Albert
  category: groceries
  tile_color: "#e53935"
```

---

### `loyalty_cards.update_store`

Aktualizuje existující obchod.

| Parametr | Typ | Povinný | Popis |
|----------|-----|---------|-------|
| `store_id` | string | ✓ | UUID obchodu |
| `name` | string | | Nový název |
| `category` | string | | Nová kategorie |
| `tile_color` | string | | Nová barva dlaždice |

```yaml
service: loyalty_cards.update_store
data:
  store_id: "550e8400-e29b-41d4-a716-446655440000"
  tile_color: "#1565c0"
```

---

### `loyalty_cards.delete_store`

Smaže obchod včetně všech karet, lokací a loga.

| Parametr | Typ | Povinný | Popis |
|----------|-----|---------|-------|
| `store_id` | string | ✓ | UUID obchodu |

---

### `loyalty_cards.add_card`

Přidá věrnostní kartu do obchodu.

| Parametr | Typ | Povinný | Popis |
|----------|-----|---------|-------|
| `store_id` | string | ✓ | UUID obchodu |
| `name` | string | ✓ | Název karty |
| `barcode` | string | ✓ | Číslo / kód karty |
| `barcode_type` | string | | Typ čárového kódu (viz tabulka níže), výchozí `EAN_13` |
| `notes` | string | | Poznámka |

```yaml
service: loyalty_cards.add_card
data:
  store_id: "550e8400-e29b-41d4-a716-446655440000"
  name: Moje karta
  barcode: "8594003425000"
  barcode_type: EAN_13
```

---

### `loyalty_cards.update_card`

Aktualizuje existující kartu.

| Parametr | Typ | Povinný | Popis |
|----------|-----|---------|-------|
| `card_id` | string | ✓ | UUID karty |
| `name` | string | | Nový název |
| `barcode` | string | | Nový kód |
| `barcode_type` | string | | Nový typ čárového kódu |
| `notes` | string | | Nová poznámka |

---

### `loyalty_cards.delete_card`

Smaže kartu.

| Parametr | Typ | Povinný | Popis |
|----------|-----|---------|-------|
| `card_id` | string | ✓ | UUID karty |

---

### `loyalty_cards.add_location`

Přiřadí GPS lokaci pobočky k obchodu. Používá se pro detekci polohy a záložku „Poblíž".

| Parametr | Typ | Povinný | Popis |
|----------|-----|---------|-------|
| `store_id` | string | ✓ | UUID obchodu |
| `lat` | float | ✓ | Zeměpisná šířka |
| `lon` | float | ✓ | Zeměpisná délka |
| `radius_m` | int | | Poloměr v metrech, výchozí `300` |
| `label` | string | | Název pobočky |

```yaml
service: loyalty_cards.add_location
data:
  store_id: "550e8400-e29b-41d4-a716-446655440000"
  lat: 50.0755
  lon: 14.4378
  radius_m: 200
  label: "OC Palladium"
```

---

### `loyalty_cards.delete_location`

Odstraní lokaci dle indexu.

| Parametr | Typ | Povinný | Popis |
|----------|-----|---------|-------|
| `store_id` | string | ✓ | UUID obchodu |
| `location_index` | int | ✓ | Index lokace (0 = první) |

---

### `loyalty_cards.download_logo`

Stáhne logo z URL a uloží ho lokálně.

| Parametr | Typ | Povinný | Popis |
|----------|-----|---------|-------|
| `store_id` | string | ✓ | UUID obchodu |
| `url` | string | ✓ | URL obrázku (max 2 MB, povolené typy: PNG, JPEG, GIF, WebP, SVG) |

```yaml
service: loyalty_cards.download_logo
data:
  store_id: "550e8400-e29b-41d4-a716-446655440000"
  url: "https://example.com/logo.png"
```

---

### `loyalty_cards.upload_logo`

Nahraje logo jako base64 data URL.

| Parametr | Typ | Povinný | Popis |
|----------|-----|---------|-------|
| `store_id` | string | ✓ | UUID obchodu |
| `data_url` | string | ✓ | Data URL ve formátu `data:image/png;base64,…` |

---

### `loyalty_cards.delete_logo`

Smaže logo obchodu.

| Parametr | Typ | Povinný | Popis |
|----------|-----|---------|-------|
| `store_id` | string | ✓ | UUID obchodu |

---

### `loyalty_cards.update_settings`

Aktualizuje globální nastavení integrace.

| Parametr | Typ | Popis |
|----------|-----|-------|
| `device_trackers` | list | Seznam entity ID telefonu, např. `["device_tracker.telefon"]` |
| `global_proximity_m` | int | Vzdálenost v metrech pro detekci „Poblíž" |
| `notifications_enabled` | bool | Zapnout/vypnout notifikace |
| `notification_dwell_minutes` | int | Minuty setrvání v lokalitě před notifikací |

```yaml
service: loyalty_cards.update_settings
data:
  device_trackers:
    - device_tracker.muj_telefon
  global_proximity_m: 200
  notifications_enabled: true
  notification_dwell_minutes: 5
```

---

## Typy čárových kódů

| Klíč | Popis |
|------|-------|
| `EAN_13` | EAN-13 (13 číslic, nejběžnější) |
| `EAN_8` | EAN-8 (8 číslic) |
| `UPC_A` | UPC-A (12 číslic, USA) |
| `UPC_E` | UPC-E (6–7 číslic, zkrácený UPC) |
| `CODE_128` | Code 128 (alfanumerický) |
| `CODE_39` | Code 39 (alfanumerický) |
| `ITF` | ITF-14 (číslicový) |
| `QR_CODE` | QR kód |
| `DATA_MATRIX` | DataMatrix 2D kód |
| `PDF_417` | PDF-417 2D kód |
| `AZTEC` | Aztec 2D kód |

Pokud typ nezadáte, integrace ho odvodí automaticky z délky a formátu hodnoty.

---

## Kategorie obchodů

| Klíč | Česky |
|------|-------|
| `groceries` | Potraviny |
| `drugstore` | Drogerie |
| `pharmacy` | Lékárna |
| `diy` | Hobby & Nástroje |
| `electronics` | Elektronika |
| `sport` | Sport |
| `fashion` | Móda |
| `fastfood` | Fastfood |
| `other` | Ostatní |

---

## WebSocket API

Lovelace karta komunikuje s integrací přes Home Assistant WebSocket API.

### `loyalty_cards/get_data`

Vrátí kompletní data (obchody, karty, lokace, nastavení).

```js
await hass.callWS({ type: "loyalty_cards/get_data" });
```

Odpověď:

```json
{
  "stores": [
    {
      "id": "uuid",
      "name": "Albert",
      "category": "groceries",
      "tile_color": "#e53935",
      "logo_path": "/local/loyalty-cards/logos/uuid.png",
      "locations": [
        { "lat": 50.07, "lon": 14.43, "radius_m": 300, "label": "OC Palladium" }
      ],
      "cards": [
        { "id": "uuid", "name": "Moje karta", "barcode": "8594003425000", "barcode_type": "EAN_13", "notes": "" }
      ]
    }
  ],
  "settings": {
    "device_trackers": ["device_tracker.telefon"],
    "global_proximity_m": 300,
    "notifications_enabled": true,
    "notification_dwell_minutes": 7
  }
}
```

### Event `loyalty_cards_updated`

Integrace vyšle tento event přes HA event bus po každé změně dat. Karta se na něj přihlásí a automaticky obnoví zobrazení.

```js
hass.connection.subscribeEvents(() => { /* refresh */ }, "loyalty_cards_updated");
```

---

## Loga obchodů

Loga jsou uložena v `/config/www/loyalty-cards/logos/` a servírována přes `/local/loyalty-cards/logos/`.

| Typ | Název souboru | Zdroj |
|-----|--------------|-------|
| Bundlované (48 CZ obchodů) | `{klíč}.png` (např. `albert.png`) | Součást integrace, kopíruje se při spuštění |
| Uživatelsky nahrané | `{store_uuid}.{přípona}` | Nahráno přes UI nebo službu `upload_logo` / `download_logo` |

Povolené formáty: PNG, JPEG, GIF, WebP, SVG. Maximální velikost: 2 MB.

---

## Troubleshooting

**Karta se nezobrazuje v dashboardu**
- Zkontrolujte, že je `loyalty-cards-card.js` správně registrováno jako Lovelace resource
- Otevřete vývojářské nástroje prohlížeče (F12) a zkontrolujte chyby konzole
- Zkuste tvrdé obnovení stránky (Ctrl+Shift+R)

**„Nepodařilo se načíst data"**
- Integrace není nainstalovaná nebo není spuštěná (Nastavení → Integrace → Věrnostní karty)
- Restartujte Home Assistant

**Záložka „Poblíž" je prázdná**
- Nastavte `device_tracker` v konfiguraci integrace
- Přidejte GPS lokace k obchodům přes UI (⋮ → Přidat adresu)
- Ověřte, že tracker hlásí polohu (Vývojářské nástroje → Stavy → `device_tracker.*`)

**Loga obchodů se nezobrazují**
- Ujistěte se, že integrace je nainstalována a spuštěna – kopíruje loga při startu
- Pro 48 přednastavených obchodů jsou loga bundlována, není třeba nic stahovat

---

## Architektura (v0.3.0+)

```
┌─────────────────────────────────┐     ┌──────────────────────────────┐
│  ha-vernostni-karty             │     │  ha-vernostni-karty-card     │
│  (HACS integrace)               │     │  (HACS Lovelace plugin)      │
│                                 │     │                              │
│  custom_components/             │     │  loyalty-cards-card.js       │
│    loyalty_cards/               │     │  hacs.json                   │
│      __init__.py  ←─ services ──┼─────┼─→ callService()             │
│      store.py     ←─ WebSocket ─┼─────┼─→ callWS()                  │
│      logo_manager.py            │     │  ←─ subscribeEvents()        │
│      ...                        │     │                              │
└─────────────────────────────────┘     └──────────────────────────────┘
         ↕ HA Storage API
    /config/.storage/loyalty_cards
         ↕ www
    /config/www/loyalty-cards/logos/
```

Integrace **nepotřebuje** vědět nic o kartě. Karta komunikuje se standardním HA API (WebSocket + Services + Events). Obě části lze aktualizovat nezávisle.

---

## Licence

MIT
