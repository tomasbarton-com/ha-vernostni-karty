# Věrnostní karty pro Home Assistant

[![HACS](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)

Správa věrnostních karet obchodů přímo v Home Assistantu. Zobrazí čárový nebo QR kód při příchodu do obchodu a umožní naskenovat kartu kamerou telefonu.

## Funkce

- **Správa karet** – přidání, úprava, mazání věrnostních karet
- **Skenování** – načtení kódu kamerou nebo z obrázku (EAN-13, EAN-8, Code 128, QR, DataMatrix, PDF-417, Aztec…)
- **Zobrazení kódu** – fullscreen zobrazení čárového nebo QR kódu na pokladně
- **Loga obchodů** – stažení z URL, nahrání ze souboru / fotky, lokální uložení
- **Dlaždicový layout** – 2 dlaždice vedle sebe (portrét), konfigurovatelná barva pozadí
- **Detekce polohy** – záložka „Poblíž" dle GPS z vybraného `device_tracker`
- **Notifikace** – připomínka karty po nastavené době v lokalitě
- **Více karet na obchod** – přepínání mezi kartami v detailu
- **Databáze** – 48 přednastavených českých obchodů (potraviny, drogerie, fastfood, …)

## Instalace přes HACS

1. Otevřete HACS → Integrace → tři tečky → Vlastní repozitáře
2. Přidejte `https://github.com/tomasbarton-com/ha-vernostni-karty` jako **Integration**
3. Nainstalujte „Věrnostní karty"
4. Restartujte Home Assistant

## Nastavení

1. **Integrace → Přidat integraci → Věrnostní karty**
2. Vyberte `device_tracker` entity telefonu (pro detekci polohy)
3. Nastavte vzdálenost „poblíž" a parametry notifikací

## Přidání karty do dashboardu

```yaml
type: custom:loyalty-cards-card
```

## Přidání obchodu

Klikněte na **+** v kartě nebo zavolejte službu:

```yaml
service: loyalty_cards.add_store
data:
  name: Albert
  category: groceries
  tile_color: "#e53935"
```

## Přidání věrnostní karty

```yaml
service: loyalty_cards.add_card
data:
  store_id: "uuid-obchodu"
  name: Moje karta
  barcode: "1234567890128"
  barcode_type: EAN_13
```

## Kategorie

| Klíč | Popis |
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

## Lokace obchodu

Přiřaďte GPS souřadnice pobočky – karta zobrazí obchod v záložce „Poblíž":

```yaml
service: loyalty_cards.add_location
data:
  store_id: "uuid-obchodu"
  lat: 50.0755
  lon: 14.4378
  radius_m: 300
  label: "OC Palladium"
```

## Notifikace

Notifikace se odešlou přes `notify.persistent_notification` po nastavené době v lokalitě.
Lze vypnout globálně v nastavení integrace nebo per-obchod v UI.

## Licence

MIT
