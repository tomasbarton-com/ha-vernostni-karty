import { Html5Qrcode } from "html5-qrcode";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";

const VERSION = "0.2.6";

// Base URL for bundled logos — served directly from the integration's www/logos/
// directory via async_register_static_paths (no /config/www/ copy needed).
// User-uploaded logos still live at /local/loyalty-cards/logos/{store_id}.ext
const BUNDLED_LOGO_BASE = "/loyalty_cards_www/logos";

// ── Store database ────────────────────────────────────────────────────────────
const CZECH_STORES = [
  { name: "Albert",              category: "groceries",   logo: "albert",       logo_domain: "albert.cz" },
  { name: "Billa",               category: "groceries",   logo: "billa",        logo_domain: "billa.cz" },
  { name: "Kaufland",            category: "groceries",   logo: "kaufland",     logo_domain: "kaufland.cz" },
  { name: "Lidl",                category: "groceries",   logo: "lidl",         logo_domain: "lidl.cz" },
  { name: "Penny",               category: "groceries",   logo: "penny",        logo_domain: "penny.cz" },
  { name: "Tesco",               category: "groceries",   logo: "tesco",        logo_domain: "tesco.cz" },
  { name: "Globus",              category: "groceries",   logo: "globus",       logo_domain: "globus.cz" },
  { name: "Coop",                category: "groceries",   logo: "coop",         logo_domain: "coop.cz" },
  { name: "Norma",               category: "groceries",   logo: "norma",        logo_domain: "norma.de" },
  { name: "dm",                  category: "drugstore",   logo: "dm",           logo_domain: "dm.cz" },
  { name: "Rossmann",            category: "drugstore",   logo: "rossmann",     logo_domain: "rossmann.cz" },
  { name: "Teta",                category: "drugstore",   logo: "teta",         logo_domain: "tetadrogerie.cz" },
  { name: "Dr. Max",             category: "pharmacy",    logo: "drmax",        logo_domain: "drmax.cz" },
  { name: "Benu",                category: "pharmacy",    logo: "benu",         logo_domain: "benu.cz" },
  { name: "Pilulka",             category: "pharmacy",    logo: "pilulka",      logo_domain: "pilulka.cz" },
  { name: "Lékárna.cz",          category: "pharmacy",    logo: "lekarnacz",    logo_domain: "lekarna.cz" },
  { name: "OBI",                 category: "diy",         logo: "obi",          logo_domain: "obi.cz" },
  { name: "Bauhaus",             category: "diy",         logo: "bauhaus",      logo_domain: "bauhaus.cz" },
  { name: "Hornbach",            category: "diy",         logo: "hornbach",     logo_domain: "hornbach.cz" },
  { name: "Alza",                category: "electronics", logo: "alza",         logo_domain: "alza.cz" },
  { name: "CZC",                 category: "electronics", logo: "czc",          logo_domain: "czc.cz" },
  { name: "Datart",              category: "electronics", logo: "datart",       logo_domain: "datart.cz" },
  { name: "ElectroWorld",        category: "electronics", logo: "electroworld", logo_domain: "electroworld.cz" },
  { name: "Decathlon",           category: "sport",       logo: "decathlon",    logo_domain: "decathlon.cz" },
  { name: "Sportisimo",          category: "sport",       logo: "sportisimo",   logo_domain: "sportisimo.cz" },
  { name: "Hervis",              category: "sport",       logo: "hervis",       logo_domain: "hervis.cz" },
  { name: "H&M",                 category: "fashion",     logo: "hm",           logo_domain: "hm.com" },
  { name: "Zara",                category: "fashion",     logo: "zara",         logo_domain: "zara.com" },
  { name: "Reserved",            category: "fashion",     logo: "reserved",     logo_domain: "reserved.com" },
  { name: "Primark",             category: "fashion",     logo: "primark",      logo_domain: "primark.com" },
  { name: "CCC",                 category: "fashion",     logo: "ccc",          logo_domain: "ccc.eu" },
  { name: "Deichmann",           category: "fashion",     logo: "deichmann",    logo_domain: "deichmann.com" },
  { name: "New Yorker",          category: "fashion",     logo: "newyorker",    logo_domain: "newyorker.de" },
  { name: "Pepco",               category: "fashion",     logo: "pepco",        logo_domain: "pepco.com" },
  { name: "McDonald's",          category: "fastfood",    logo: "mcdonalds",    logo_domain: "mcdonalds.cz" },
  { name: "KFC",                 category: "fastfood",    logo: "kfc",          logo_domain: "kfc.cz" },
  { name: "Burger King",         category: "fastfood",    logo: "burgerking",   logo_domain: "burgerking.cz" },
  { name: "Subway",              category: "fastfood",    logo: "subway",       logo_domain: "subway.com" },
  { name: "Pizza Hut",           category: "fastfood",    logo: "pizzahut",     logo_domain: "pizzahut.cz" },
  { name: "Starbucks",           category: "fastfood",    logo: "starbucks",    logo_domain: "starbucks.cz" },
  { name: "Costa Coffee",        category: "fastfood",    logo: "costacoffee",  logo_domain: "costacoffee.cz" },
  { name: "Bageterie Boulevard", category: "fastfood",    logo: "bageterie",    logo_domain: "bageterie.com" },
  { name: "IKEA",                category: "other",       logo: "ikea",         logo_domain: "ikea.cz" },
  { name: "Okay",                category: "other",       logo: "okay",         logo_domain: "okay.cz" },
  { name: "Kika",                category: "other",       logo: "kika",         logo_domain: "kika.cz" },
  { name: "Zoot",                category: "other",       logo: "zoot",         logo_domain: "zoot.cz" },
  { name: "Tchibo",              category: "other",       logo: "tchibo",       logo_domain: "tchibo.cz" },
  { name: "Action",              category: "other",       logo: "action",       logo_domain: "action.com" },
  { name: "Flying Tiger",        category: "other",       logo: "flyingtiger",  logo_domain: "flyingtiger.com" },
];

const CATEGORY_LABELS = {
  groceries: "Potraviny", drugstore: "Drogerie", pharmacy: "Lékárna",
  diy: "Hobby & Nástroje", electronics: "Elektronika", sport: "Sport",
  fashion: "Móda", fastfood: "Fastfood", other: "Ostatní",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function distanceM(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function initials(name) {
  return name.split(/[\s&]+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

async function dominantColor(src) {
  return new Promise((resolve) => {
    const img = new Image();
    // No crossOrigin — HA's /local/ is same-origin; adding crossOrigin would
    // trigger a CORS check that HA's static server doesn't satisfy, breaking canvas.
    img.onload = () => {
      try {
        const c = document.createElement("canvas"); c.width = 32; c.height = 32;
        const ctx = c.getContext("2d"); ctx.drawImage(img, 0, 0, 32, 32);
        const d = ctx.getImageData(0, 0, 32, 32).data;
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] > 128) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
        }
        resolve(n > 0 ? "#" + [r, g, b].map(v => Math.round(v / n).toString(16).padStart(2, "0")).join("") : null);
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function jsBarcodeFormat(type) {
  const MAP = {
    EAN_13: "EAN13", EAN_8: "EAN8",
    UPC_A: "UPC",   UPC_E: "UPCE",
    CODE_128: "CODE128", CODE_39: "CODE39",
    ITF: "ITF14",
  };
  return MAP[type] || "CODE128";
}

function autoDetectType(barcode) {
  const b = barcode.trim().replace(/\s/g, "");
  if (/^\d{13}$/.test(b)) return "EAN_13";
  if (/^\d{8}$/.test(b))  return "EAN_8";
  if (/^\d{12}$/.test(b)) return "UPC_A";
  if (/^\d{6,7}$/.test(b)) return "UPC_E";
  return "CODE_128";
}

// ── Styles ────────────────────────────────────────────────────────────────────
const STYLES = `
  :host { display: block; font-family: var(--paper-font-body1_-_font-family, sans-serif); }
  .card-root { background: var(--card-background-color, #fff); border-radius: 12px; overflow: hidden; }
  .header { padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; }
  .header h2 { margin: 0; font-size: 1.1em; font-weight: 600; color: var(--primary-text-color); }
  .add-btn { background: var(--primary-color,#1976d2); color:#fff; border:none; border-radius:50%;
             width:32px; height:32px; font-size:1.4em; line-height:1; cursor:pointer; flex-shrink:0;
             display:flex; align-items:center; justify-content:center; }
  .tabs { display: flex; gap: 4px; padding: 0 16px 8px; border-bottom: 1px solid var(--divider-color,#e0e0e0);
          overflow-x: auto; scrollbar-width: none; }
  .tabs::-webkit-scrollbar { display: none; }
  .tab { padding: 6px 14px; border-radius: 20px; cursor: pointer; font-size: 0.85em; white-space: nowrap;
         color: var(--secondary-text-color); border: none; background: none; }
  .tab.active { background: var(--primary-color, #1976d2); color: #fff; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 12px 16px 16px; }
  @media (min-width: 600px) { .grid { grid-template-columns: repeat(3, 1fr); } }
  @media (min-width: 900px) { .grid { grid-template-columns: repeat(4, 1fr); } }
  .tile { border-radius: 10px; cursor: pointer; overflow: hidden; position: relative;
          display: flex; flex-direction: column; align-items: center; padding: 14px 8px 10px; gap: 8px;
          box-shadow: 0 1px 4px rgba(0,0,0,.12); }
  .tile:hover { transform: scale(1.03); box-shadow: 0 4px 12px rgba(0,0,0,.2); }
  .tile.no-cards { filter: grayscale(0.6) opacity(0.65); }
  .tile-menu { position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,.28); color: #fff;
               border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer;
               font-size: 1.1em; line-height: 1; padding: 0;
               display: flex; align-items: center; justify-content: center; z-index: 1; }
  .tile-menu:hover { background: rgba(0,0,0,.55); }
  .tile-logo { width: 56px; height: 56px; border-radius: 8px; object-fit: contain;
               background: rgba(255,255,255,.25); }
  .tile-initials { width: 56px; height: 56px; border-radius: 8px; display: flex; align-items: center;
                   justify-content: center; font-size: 1.4em; font-weight: 700; color: #fff;
                   background: rgba(0,0,0,.2); }
  .tile-name { font-size: 0.78em; font-weight: 600; text-align: center; color: #fff;
               text-shadow: 0 1px 2px rgba(0,0,0,.4); line-height: 1.2; }
  .tile-badge { position:absolute; top:5px; left:7px; background:rgba(0,0,0,.4); color:#fff;
                border-radius:10px; font-size:0.7em; font-weight:700; padding:1px 6px;
                min-width:18px; text-align:center; line-height:17px; pointer-events:none; }
  .grid-wrap { min-height: 80px; }
  .empty { padding: 24px; text-align: center; color: var(--secondary-text-color); font-size: 0.9em;
           grid-column: 1/-1; }
  .category-header { font-weight: 600; font-size: 0.82em; color: var(--secondary-text-color);
                     padding: 12px 16px 4px; text-transform: uppercase; letter-spacing: 0.5px; }

  /* Modal */
  .modal-overlay { position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,.6);
                   display: flex; align-items: flex-end; justify-content: center; }
  @media (min-width: 600px) { .modal-overlay { align-items: center; } }
  .modal { background: var(--card-background-color, #fff); border-radius: 16px 16px 0 0; width: 100%;
           max-width: 480px; padding: 20px; max-height: 90vh; overflow-y: auto; }
  @media (min-width: 600px) { .modal { border-radius: 16px; } }
  .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .modal-title { font-size: 1.1em; font-weight: 600; color: var(--primary-text-color); }
  .close-btn { background: none; border: none; font-size: 1.4em; cursor: pointer;
               color: var(--secondary-text-color); line-height: 1; }

  /* Barcode */
  .barcode-wrap { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 4px 0; }
  .barcode-wrap svg, .barcode-wrap canvas { max-width: 100%; }
  .barcode-value { font-size: 0.85em; color: var(--secondary-text-color); letter-spacing: 1px; }
  .barcode-name { font-size: 0.78em; color: var(--secondary-text-color); }
  .card-tabs { display:flex; gap:4px; margin-bottom:12px; flex-wrap:wrap; }
  .card-tab { padding:5px 12px; border-radius:16px; border:1px solid var(--divider-color,#ccc);
              background:none; cursor:pointer; font-size:0.8em; color:var(--primary-text-color); }
  .card-tab.active { background:var(--primary-color,#1976d2); color:#fff; border-color:transparent; }

  /* Forms */
  .form-group { margin-bottom: 14px; }
  .form-group label { display: block; font-size: 0.82em; color: var(--secondary-text-color); margin-bottom: 4px; }
  input[type=text], input[type=number], input[type=email], select, textarea {
    width: 100%; padding: 9px 10px; border: 1px solid var(--divider-color,#ccc);
    border-radius: 6px; font-size: 0.9em; color: var(--primary-text-color);
    background: var(--secondary-background-color,#f9f9f9); box-sizing: border-box; }
  textarea { resize: vertical; }
  .color-row { display:flex; align-items:center; gap:10px; }
  .hint { font-size:0.75em; color:var(--secondary-text-color); }
  .section-title { font-weight:600; font-size:0.85em; color:var(--secondary-text-color);
                   margin:14px 0 6px; text-transform:uppercase; letter-spacing:.5px; }
  .logo-row { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
  .logo-preview { width:40px; height:40px; object-fit:contain; border-radius:6px;
                  border:1px solid var(--divider-color,#ccc); }
  .location-list { list-style:none; padding:0; margin:0 0 8px; }
  .location-item { display:flex; justify-content:space-between; align-items:center;
                   padding:6px 0; border-bottom:1px solid var(--divider-color,#eee);
                   font-size:0.85em; color:var(--primary-text-color); }
  .file-label { display:inline-block; padding:8px 12px; background:var(--secondary-background-color,#f0f0f0);
                border:2px dashed var(--divider-color,#ccc); border-radius:8px; cursor:pointer;
                font-size:0.85em; color:var(--primary-text-color); }
  input[type=file] { display:none; }
  .scan-row { display:flex; gap:8px; margin-top:8px; flex-wrap:wrap; }
  .scan-btn { flex:1; min-width:120px; padding:10px; background:var(--secondary-background-color,#f0f0f0);
              border:2px dashed var(--divider-color,#ccc); border-radius:8px; cursor:pointer;
              font-size:0.85em; color:var(--primary-text-color); text-align:center; }
  .btn-row { display:flex; gap:8px; justify-content:flex-end; margin-top:16px; flex-wrap:wrap; }
  .btn { padding:9px 18px; border-radius:8px; border:none; cursor:pointer; font-size:0.9em; font-weight:500; }
  .btn-primary { background:var(--primary-color,#1976d2); color:#fff; }
  .btn-secondary { background:var(--secondary-background-color,#f0f0f0); color:var(--primary-text-color); }
  .btn-danger { background:#e53935; color:#fff; }
  .custom-fields { margin-top:10px; }
  .loc-actions { display:flex; gap:8px; margin-bottom:8px; flex-wrap:wrap; }
  .loc-addr-row { display:flex; gap:8px; align-items:center; margin-bottom:4px; }
  .loc-addr-row input { flex:1; min-width:0; }
  .loc-addr-results { border:1px solid var(--divider-color,#ccc); border-radius:6px; max-height:160px;
                      overflow-y:auto; margin-bottom:8px; background:var(--card-background-color,#fff); }
  .loc-result-item { padding:8px 10px; cursor:pointer; font-size:0.82em;
                     border-bottom:1px solid var(--divider-color,#eee); color:var(--primary-text-color); }
  .loc-result-item:last-child { border-bottom:none; }
  .loc-result-item:hover { background:var(--secondary-background-color,#f5f5f5); }
  [hidden] { display: none !important; }

  /* Store picker */
  .store-picker-list { border:1px solid var(--divider-color,#ccc); border-radius:6px; max-height:240px;
                       overflow-y:auto; margin-top:4px; background:var(--card-background-color,#fff); }
  .store-picker-item { display:flex; align-items:center; gap:8px; padding:7px 10px; cursor:pointer;
                       border-bottom:1px solid var(--divider-color,#eee); font-size:0.88em;
                       color:var(--primary-text-color); }
  .store-picker-item:last-child { border-bottom:none; }
  .store-picker-item:hover { background:var(--secondary-background-color,#f0f0f0); }
  .store-picker-item.selected { background:var(--primary-color,#1976d2); color:#fff; }
  .store-picker-logo { width:28px; height:28px; border-radius:4px; object-fit:contain; flex-shrink:0;
                       background:rgba(255,255,255,.85); padding:2px; }
  .store-picker-initials { width:28px; height:28px; border-radius:4px; display:flex; align-items:center;
                           justify-content:center; font-size:0.65em; font-weight:700; flex-shrink:0;
                           background:rgba(0,0,0,.15); }
`;

// ── Main custom element ───────────────────────────────────────────────────────
class LoyaltyCardsCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._data = null;
    this._hass = null;
    this._activeTab = "all";
    this._modal = null;
    this._scanner = null;
    this._unsubscribeBus = null;
    this._nearbyStoreIds = new Set();
    this._proximityTimer = {};
    this._notificationSent = new Set();
    this._logoPending = new Set();
    this._autoColoredStores = new Set();
    this._lastDataKey = null;
  }

  set hass(hass) {
    const firstLoad = !this._data;
    this._hass = hass;
    const nearbyChanged = this._updateNearby();
    if (firstLoad) {
      this._loadData();
    } else if (!this._modal && nearbyChanged) {
      this._render();
    }
  }

  setConfig(config) { this._config = config || {}; }
  connectedCallback() { this._subscribe(); }
  disconnectedCallback() { this._unsubscribeBus?.(); this._stopLiveScanner(); }

  _subscribe() {
    if (!this._hass || this._unsubscribeBus) return;
    this._unsubscribeBus = this._hass.connection.subscribeEvents(
      () => { if (!this._modal) this._loadData(); },
      "loyalty_cards_updated"
    );
  }

  async _loadData() {
    if (!this._hass) return;
    try {
      this._data = await this._hass.callWS({ type: "loyalty_cards/get_data" });
      this._updateNearby();
      if (!this._unsubscribeBus) this._subscribe();
      this._render();
      this._autoDownloadLogos();
    } catch {
      this._renderError("Nepodařilo se načíst data. Je integrace Věrnostní karty nainstalována?");
    }
  }

  _autoDownloadLogos() {
    // Bundled logos are served from /local/loyalty-cards/logos/{key}.png after HA restart.
    // No external download needed.
  }

  _updateNearby() {
    if (!this._hass || !this._data) return false;
    const { settings = {}, stores = [] } = this._data;
    const { device_trackers: trackers = [], global_proximity_m: globalR = 300,
            notifications_enabled: notifOn = false, notification_dwell_minutes: dwellMin = 7 } = settings;
    let userLat = null, userLon = null;
    for (const t of trackers) {
      const st = this._hass.states[t];
      if (st?.attributes?.latitude) { userLat = st.attributes.latitude; userLon = st.attributes.longitude; break; }
    }
    const nearby = new Set();
    if (userLat !== null) {
      for (const store of stores) {
        for (const loc of store.locations || []) {
          if (distanceM(userLat, userLon, loc.lat, loc.lon) <= Math.max(loc.radius_m ?? globalR, globalR)) {
            nearby.add(store.id);
            if (notifOn) this._handleNotification(store, dwellMin);
          }
        }
      }
      for (const id of Object.keys(this._proximityTimer)) {
        if (!nearby.has(id)) { clearTimeout(this._proximityTimer[id]); delete this._proximityTimer[id]; }
      }
    }
    const changed = nearby.size !== this._nearbyStoreIds.size ||
      [...nearby].some(id => !this._nearbyStoreIds.has(id));
    this._nearbyStoreIds = nearby;
    return changed;
  }

  _handleNotification(store, dwellMin) {
    if (this._notificationSent.has(store.id) || this._proximityTimer[store.id]) return;
    this._proximityTimer[store.id] = setTimeout(() => {
      delete this._proximityTimer[store.id];
      if (this._nearbyStoreIds.has(store.id) && !this._notificationSent.has(store.id)) {
        this._notificationSent.add(store.id);
        this._hass?.callService("notify", "persistent_notification", {
          title: "Věrnostní karta",
          message: `Jste u obchodu ${store.name}. Nezapomeňte na věrnostní kartu!`,
        }).catch(() => {});
      }
    }, dwellMin * 60000);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  _render() {
    const root = this.shadowRoot;
    // Smart diff: if data + tab unchanged, only update modal overlay (no tile flicker)
    const dataKey = (this._data ? JSON.stringify(this._data) : "null") + "|" + this._activeTab;
    if (this._lastDataKey !== null && this._lastDataKey === dataKey && root.querySelector(".card-root")) {
      const existing = root.querySelector(".modal-overlay");
      if (!this._modal && existing) { existing.remove(); return; }
      if (this._modal && !existing) { root.appendChild(this._buildModalOverlay()); return; }
      if (this._modal && existing) { existing.replaceWith(this._buildModalOverlay()); return; }
      return;
    }
    this._lastDataKey = dataKey;
    root.innerHTML = "";
    const style = document.createElement("style");
    style.textContent = STYLES;
    root.appendChild(style);
    if (!this._data) return;

    const wrap = document.createElement("div");
    wrap.className = "card-root";

    // Header with title + add button
    const header = document.createElement("div");
    header.className = "header";
    header.innerHTML = `<h2>Věrnostní karty</h2>`;
    const addBtn = document.createElement("button");
    addBtn.className = "add-btn";
    addBtn.title = "Přidat obchod";
    addBtn.textContent = "+";
    addBtn.addEventListener("click", () => this._openModal({ type: "add_store" }));
    header.appendChild(addBtn);
    wrap.appendChild(header);

    const isFlat = this._config?.layout === "flat";
    if (!isFlat) wrap.appendChild(this._buildTabs());

    const gridWrap = document.createElement("div");
    gridWrap.className = "grid-wrap";
    gridWrap.appendChild(isFlat ? this._buildFlatContent() : this._buildGrid());
    wrap.appendChild(gridWrap);
    root.appendChild(wrap);

    if (this._modal) root.appendChild(this._buildModalOverlay());
  }

  _buildTabs() {
    const tabs = document.createElement("div");
    tabs.className = "tabs";
    const defs = [
      { key: "all", label: "Vše" },
      { key: "nearby", label: `Poblíž${this._nearbyStoreIds.size > 0 ? ` (${this._nearbyStoreIds.size})` : ""}` },
      ...Object.entries(CATEGORY_LABELS).map(([k, v]) => ({ key: `cat:${k}`, label: v })),
    ];
    for (const { key, label } of defs) {
      const btn = document.createElement("button");
      btn.className = "tab" + (this._activeTab === key ? " active" : "");
      btn.textContent = label;
      btn.addEventListener("click", () => { this._activeTab = key; this._render(); });
      tabs.appendChild(btn);
    }
    return tabs;
  }

  _filteredStores() {
    const stores = this._data.stores || [];
    if (this._activeTab === "nearby") return stores.filter(s => this._nearbyStoreIds.has(s.id));
    if (this._activeTab.startsWith("cat:")) return stores.filter(s => s.category === this._activeTab.slice(4));
    return stores;
  }

  _buildGrid() {
    const stores = this._filteredStores();
    const grid = document.createElement("div");
    grid.className = "grid";
    if (stores.length === 0) {
      grid.appendChild(Object.assign(document.createElement("div"), {
        className: "empty",
        textContent: this._activeTab === "nearby"
          ? "Žádné obchody poblíž. Zkontrolujte nastavení polohování."
          : "Žádné karty. Přidejte první kliknutím na +",
      }));
    } else {
      for (const store of stores) grid.appendChild(this._buildTile(store));
    }
    return grid;
  }

  _buildFlatContent() {
    const frag = document.createDocumentFragment();
    const stores = this._data.stores || [];
    if (stores.length === 0) {
      frag.appendChild(Object.assign(document.createElement("div"), {
        className: "empty", textContent: "Žádné karty. Přidejte první kliknutím na +",
      }));
      return frag;
    }
    const byCategory = {};
    for (const store of stores) {
      const cat = store.category || "other";
      (byCategory[cat] = byCategory[cat] || []).push(store);
    }
    for (const [cat, catStores] of Object.entries(byCategory)) {
      frag.appendChild(Object.assign(document.createElement("div"), {
        className: "category-header", textContent: CATEGORY_LABELS[cat] || cat,
      }));
      const grid = document.createElement("div");
      grid.className = "grid";
      for (const store of catStores) grid.appendChild(this._buildTile(store));
      frag.appendChild(grid);
    }
    return frag;
  }

  _buildTile(store) {
    const cardCount = (store.cards || []).length;
    const tile = document.createElement("div");
    tile.className = "tile" + (cardCount === 0 ? " no-cards" : "");
    tile.style.background = store.tile_color || "#1976d2";

    // ⋮ menu button → dropdown
    const menuBtn = document.createElement("button");
    menuBtn.className = "tile-menu";
    menuBtn.title = "Možnosti";
    menuBtn.textContent = "⋮";
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this._showTileDropdown(store, menuBtn);
    });
    tile.appendChild(menuBtn);

    // Badge: only if > 1 card, top-left
    if (cardCount > 1) {
      tile.appendChild(Object.assign(document.createElement("div"), {
        className: "tile-badge",
        textContent: String(cardCount),
      }));
    }

    // Logo resolution: user-uploaded path > bundled offline logo > initials.
    // Bundled logos are served from the integration's www/logos/ directory via
    // async_register_static_paths — no file copying to /config/www/ needed.
    // User-uploaded logos (store.logo_path) are saved to /config/www/loyalty-cards/logos/
    // by logo_manager.py and are served from /local/loyalty-cards/logos/.
    const match = CZECH_STORES.find(s => s.name === store.name);
    const bundledLogoSrc = match?.logo
      ? `${BUNDLED_LOGO_BASE}/${match.logo}.png?v=${VERSION}`
      : null;
    // Don't append ?v= to user-uploaded paths — they already have unique UUID names.
    const logoSrc = store.logo_path || bundledLogoSrc;

    if (logoSrc) {
      const img = document.createElement("img");
      img.className = "tile-logo";
      img.src = logoSrc;
      img.alt = store.name;

      // Fallback chain: if user logo_path is broken, try the bundled logo.
      let usedFallback = false;
      img.onerror = () => {
        if (!usedFallback && logoSrc !== bundledLogoSrc && bundledLogoSrc) {
          usedFallback = true;
          img.src = bundledLogoSrc;
        } else {
          img.replaceWith(this._buildInitials(store.name));
        }
      };

      img.onload = async () => {
        // Auto-compute dominant color from logo on first load this session
        if (this._autoColoredStores.has(store.id)) return;
        this._autoColoredStores.add(store.id);
        const effectiveSrc = usedFallback ? bundledLogoSrc : logoSrc;
        const color = await dominantColor(effectiveSrc);
        if (!color) return;
        tile.style.background = color;
        // Persist only if the store is still using the default color
        if (!store.tile_color || store.tile_color === "#1976d2") {
          this._hass?.callService("loyalty_cards", "update_store", {
            store_id: store.id, tile_color: color,
          }).catch(() => {});
        }
      };

      tile.appendChild(img);
    } else {
      tile.appendChild(this._buildInitials(store.name));
    }

    tile.appendChild(Object.assign(document.createElement("div"), {
      className: "tile-name", textContent: store.name,
    }));

    tile.addEventListener("click", () => {
      this._openModal(cardCount === 0
        ? { type: "add_card", store }
        : { type: "barcode", store, cardIndex: 0 });
    });
    return tile;
  }

  _buildInitials(name) {
    return Object.assign(document.createElement("div"), {
      className: "tile-initials", textContent: initials(name),
    });
  }

  _showTileDropdown(store, anchor) {
    document.getElementById("lc-dropdown")?.remove();
    const dd = document.createElement("div");
    dd.id = "lc-dropdown";
    const rect = anchor.getBoundingClientRect();
    dd.style.cssText = `position:fixed;top:${rect.bottom + 4}px;right:${window.innerWidth - rect.right}px;
      background:var(--card-background-color,#fff);border-radius:10px;min-width:170px;
      box-shadow:0 4px 20px rgba(0,0,0,.22);z-index:10001;overflow:hidden;`;
    const items = [
      ["➕ Přidat kartu",     () => this._openModal({ type: "add_card",   store })],
      ["✏️  Upravit obchod",  () => this._openModal({ type: "edit_store", store })],
      ["📍 Přidat adresu",    () => this._openLocationModal(store)],
    ];
    for (const [label, action] of items) {
      const btn = document.createElement("button");
      btn.textContent = label;
      btn.style.cssText = "display:block;width:100%;padding:12px 16px;text-align:left;border:none;background:none;cursor:pointer;font-size:0.88em;color:var(--primary-text-color);";
      btn.addEventListener("mouseenter", () => btn.style.background = "var(--secondary-background-color,#f5f5f5)");
      btn.addEventListener("mouseleave", () => btn.style.background = "none");
      btn.addEventListener("click", () => { dd.remove(); action(); });
      dd.appendChild(btn);
    }
    document.body.appendChild(dd);
    const close = (e) => {
      if (!dd.contains(e.target) && e.target !== anchor) {
        dd.remove(); document.removeEventListener("click", close, true);
      }
    };
    setTimeout(() => document.addEventListener("click", close, true), 0);
  }

  // ── Modal router ──────────────────────────────────────────────────────────
  _openModal(modal) { this._modal = modal; this._render(); }
  _closeModal() {
    this._modal = null;
    this._render();
    this._loadData();
  }

  _buildModalOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.addEventListener("click", (e) => { if (e.target === overlay) this._closeModal(); });
    const inner = document.createElement("div");
    inner.className = "modal";
    switch (this._modal.type) {
      case "barcode":    inner.appendChild(this._buildBarcodeModal()); break;
      case "add_store":  inner.appendChild(this._buildAddStoreModal()); break;
      case "edit_store": inner.appendChild(this._buildEditStoreModal()); break;
      case "add_card":   inner.appendChild(this._buildAddCardModal()); break;
      case "edit_card":  inner.appendChild(this._buildEditCardModal()); break;
    }
    overlay.appendChild(inner);
    return overlay;
  }

  // ── Barcode modal ─────────────────────────────────────────────────────────
  _buildBarcodeModal() {
    const { store, cardIndex = 0 } = this._modal;
    const cards = store.cards || [];
    const card = cards[cardIndex] || null;
    const frag = document.createDocumentFragment();

    const mh = document.createElement("div");
    mh.className = "modal-header";
    mh.innerHTML = `<span class="modal-title">${store.name}</span><button class="close-btn">✕</button>`;
    mh.querySelector(".close-btn").addEventListener("click", () => this._closeModal());
    frag.appendChild(mh);

    if (cards.length > 1) {
      const tabRow = document.createElement("div");
      tabRow.className = "card-tabs";
      cards.forEach((c, i) => {
        const t = document.createElement("button");
        t.className = "card-tab" + (i === cardIndex ? " active" : "");
        t.textContent = c.name || `Karta ${i + 1}`;
        t.addEventListener("click", () => { this._modal.cardIndex = i; this._render(); });
        tabRow.appendChild(t);
      });
      frag.appendChild(tabRow);
    }

    const wrap = document.createElement("div");
    wrap.className = "barcode-wrap";
    if (card) {
      if (card.barcode_type === "QR_CODE") {
        const qrCanvas = document.createElement("canvas");
        qrCanvas.id = "qr-canvas";
        wrap.appendChild(qrCanvas);
        setTimeout(() => {
          const c = this.shadowRoot.getElementById("qr-canvas");
          if (c) QRCode.toCanvas(c, card.barcode, { width: 200, margin: 2 }).catch(() => {});
        }, 50);
      } else {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.id = "barcode-svg";
        wrap.appendChild(svg);
        setTimeout(() => {
          const el = this.shadowRoot.getElementById("barcode-svg");
          if (el) {
            try {
              JsBarcode(el, card.barcode, {
                format: jsBarcodeFormat(card.barcode_type),
                lineColor: "#000", background: "#fff",
                displayValue: false, margin: 10,
              });
            } catch (e) {
              el.outerHTML = `<p style="color:red;font-size:.8em">Nelze zobrazit: ${e.message}</p>`;
            }
          }
        }, 50);
      }
      wrap.appendChild(Object.assign(document.createElement("div"), {
        className: "barcode-value", textContent: card.barcode,
      }));
      if (card.name) {
        wrap.appendChild(Object.assign(document.createElement("div"), {
          className: "barcode-name", textContent: card.name,
        }));
      }
      wrap.style.cursor = "pointer";
      wrap.title = "Kliknutím na celou obrazovku";
      wrap.addEventListener("click", () => this._openFullscreen(card));
    }
    frag.appendChild(wrap);

    const btnRow = document.createElement("div");
    btnRow.className = "btn-row";
    if (card) {
      const editBtn = document.createElement("button");
      editBtn.className = "btn btn-secondary";
      editBtn.textContent = "✏️ Upravit kartu";
      editBtn.addEventListener("click", () => this._openModal({ type: "edit_card", store, card }));
      btnRow.appendChild(editBtn);
    }
    const addCardBtn = document.createElement("button");
    addCardBtn.className = "btn btn-secondary";
    addCardBtn.textContent = "+ Přidat kartu";
    addCardBtn.addEventListener("click", () => this._openModal({ type: "add_card", store }));
    btnRow.appendChild(addCardBtn);
    frag.appendChild(btnRow);
    return frag;
  }

  _openFullscreen(card) {
    const fs = document.createElement("div");
    fs.style.cssText =
      "position:fixed;inset:0;z-index:9999;background:#fff;display:flex;flex-direction:column;" +
      "align-items:center;justify-content:center;gap:16px;padding:20px;";

    // Keep screen on
    if (navigator.wakeLock) {
      navigator.wakeLock.request("screen").then(lock => { fs._wakeLock = lock; }).catch(() => {});
    }

    const closeFs = () => {
      if (fs._wakeLock) { fs._wakeLock.release().catch(() => {}); }
      screen.orientation?.unlock?.()?.catch?.(() => {});
      if (document.body.contains(fs)) document.body.removeChild(fs);
    };

    const close = document.createElement("button");
    close.style.cssText =
      "position:absolute;top:16px;right:16px;background:none;border:none;font-size:2em;cursor:pointer;color:#333;";
    close.textContent = "✕";
    close.addEventListener("click", closeFs);
    fs.appendChild(close);

    if (card.barcode_type === "QR_CODE") {
      const c = document.createElement("canvas");
      fs.appendChild(c);
      QRCode.toCanvas(c, card.barcode, { width: 280, margin: 2 }).catch(() => {});
    } else {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.style.maxWidth = "90vw";
      fs.appendChild(svg);
      try {
        JsBarcode(svg, card.barcode, {
          format: jsBarcodeFormat(card.barcode_type),
          lineColor: "#000", background: "#fff",
          displayValue: false, width: 3, height: 120, margin: 16,
        });
      } catch {}
    }
    const valDiv = Object.assign(document.createElement("div"), {
      style: { cssText: "font-size:1.1em;letter-spacing:2px;color:#333;" },
      textContent: card.barcode,
    });
    fs.appendChild(valDiv);
    if (card.name) {
      fs.appendChild(Object.assign(document.createElement("div"), {
        style: { cssText: "font-size:.9em;color:#888;" }, textContent: card.name,
      }));
    }
    document.body.appendChild(fs);
    screen.orientation?.lock?.("portrait")?.catch?.(() => {});
  }

  // ── Add Store modal ───────────────────────────────────────────────────────
  _buildAddStoreModal() {
    const frag = document.createDocumentFragment();
    const mh = document.createElement("div");
    mh.className = "modal-header";
    mh.innerHTML = `<span class="modal-title">Přidat obchod</span><button class="close-btn">✕</button>`;
    mh.querySelector(".close-btn").addEventListener("click", () => this._closeModal());
    frag.appendChild(mh);

    const customFields = document.createElement("div");
    customFields.id = "custom-fields";
    customFields.className = "custom-fields";
    customFields.hidden = true;
    customFields.innerHTML = `
      <div class="form-group"><label>Název obchodu</label><input type="text" id="store-name" placeholder="Název…" /></div>
      <div class="form-group"><label>Kategorie</label>
        <select id="store-category">
          ${Object.entries(CATEGORY_LABELS).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}
        </select></div>`;

    const logoSection = document.createElement("div");
    logoSection.id = "logo-section";
    logoSection.hidden = true;
    logoSection.innerHTML = `
      <div class="section-title">Logo (volitelné)</div>
      <div class="form-group"><input type="text" id="store-logo-url" placeholder="URL obrázku loga…" /></div>
      <div class="form-group">
        <label class="file-label" for="store-logo-file">📁 Vybrat ze souboru</label>
        <input type="file" id="store-logo-file" accept="image/*" />
        <span id="store-logo-fn" class="hint"></span>
      </div>`;

    const showCustom = (_val, isCustom) => {
      customFields.hidden = !isCustom;
      logoSection.hidden = !isCustom;
    };

    frag.appendChild(this._buildStorePickerField(showCustom));
    frag.appendChild(customFields);
    frag.appendChild(logoSection);

    frag.appendChild(this._makeField("Barva dlaždice", `
      <div class="color-row">
        <input type="color" id="store-color" value="#1976d2" />
        <span class="hint">Automaticky se upraví podle loga</span>
      </div>`));

    setTimeout(() => {
      const fi = this.shadowRoot.getElementById("store-logo-file");
      const ci = this.shadowRoot.getElementById("store-color");
      if (fi) fi.addEventListener("change", async () => {
        const file = fi.files[0]; if (!file) return;
        const fn = this.shadowRoot.getElementById("store-logo-fn");
        if (fn) fn.textContent = file.name;
        const url = URL.createObjectURL(file);
        const color = await dominantColor(url); URL.revokeObjectURL(url);
        if (color && ci) ci.value = color;
      });
    }, 50);

    const btnRow = document.createElement("div");
    btnRow.className = "btn-row";
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn btn-secondary";
    cancelBtn.textContent = "Zrušit";
    cancelBtn.addEventListener("click", () => this._closeModal());
    const saveBtn = document.createElement("button");
    saveBtn.className = "btn btn-primary";
    saveBtn.textContent = "Přidat";
    saveBtn.addEventListener("click", () => this._saveNewStore());
    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(saveBtn);
    frag.appendChild(btnRow);
    return frag;
  }

  _buildStorePickerField(onSelect) {
    const group = document.createElement("div");
    group.className = "form-group";
    const label = document.createElement("label");
    label.textContent = "Obchod";
    group.appendChild(label);

    const filterInp = document.createElement("input");
    filterInp.type = "text";
    filterInp.id = "store-search";
    filterInp.placeholder = "Vyhledat obchod…";
    group.appendChild(filterInp);

    const list = document.createElement("div");
    list.className = "store-picker-list";

    const buildItems = (query) => {
      list.innerHTML = "";
      const q = (query || "").toLowerCase();
      const selectedVal = filterInp.dataset.selected || "";
      const visible = q ? CZECH_STORES.filter(s => s.name.toLowerCase().includes(q)) : CZECH_STORES;

      for (const s of visible) {
        const val = `${s.name}|${s.category}`;
        const item = document.createElement("div");
        item.className = "store-picker-item" + (selectedVal === val ? " selected" : "");

        const img = document.createElement("img");
        img.className = "store-picker-logo";
        img.src = `${BUNDLED_LOGO_BASE}/${s.logo}.png?v=${VERSION}`;
        img.alt = "";
        img.onerror = () => img.replaceWith(Object.assign(document.createElement("div"), {
          className: "store-picker-initials", textContent: initials(s.name),
        }));

        item.appendChild(img);
        item.appendChild(Object.assign(document.createElement("span"), {
          style: "flex:1;", textContent: s.name,
        }));
        item.appendChild(Object.assign(document.createElement("span"), {
          style: "font-size:.72em;opacity:.65;", textContent: CATEGORY_LABELS[s.category] || "",
        }));

        item.addEventListener("click", () => {
          filterInp.value = s.name;
          filterInp.dataset.selected = val;
          buildItems(filterInp.value);
          onSelect(val, false);
        });
        list.appendChild(item);
      }

      // "Jiný obchod…" option
      const customItem = document.createElement("div");
      customItem.className = "store-picker-item" + (selectedVal === "custom" ? " selected" : "");
      if (selectedVal !== "custom") customItem.style.color = "var(--primary-color,#1976d2)";
      customItem.textContent = "+ Jiný obchod…";
      customItem.addEventListener("click", () => {
        filterInp.value = "";
        filterInp.dataset.selected = "custom";
        buildItems("");
        onSelect("custom", true);
      });
      list.appendChild(customItem);
    };

    buildItems("");
    filterInp.addEventListener("input", () => buildItems(filterInp.value));
    group.appendChild(list);
    return group;
  }

  async _saveNewStore() {
    const v = this.shadowRoot.getElementById("store-search")?.dataset?.selected || "";
    let name, category, isKnown = false, matchedStore = null;
    if (v && v !== "custom") {
      matchedStore = CZECH_STORES.find(s => `${s.name}|${s.category}` === v);
      name = matchedStore?.name; category = matchedStore?.category; isKnown = true;
    } else {
      name = this.shadowRoot.getElementById("store-name")?.value?.trim();
      category = this.shadowRoot.getElementById("store-category")?.value || "other";
    }
    if (!name) { alert("Zadejte nebo vyberte název obchodu."); return; }
    let color = this.shadowRoot.getElementById("store-color")?.value || "#1976d2";
    // For known stores, auto-derive tile color from the bundled logo
    if (isKnown && matchedStore?.logo) {
      const computed = await dominantColor(`${BUNDLED_LOGO_BASE}/${matchedStore.logo}.png?v=${VERSION}`);
      if (computed) color = computed;
    }
    await this._hass.callService("loyalty_cards", "add_store", { name, category, tile_color: color });

    if (!isKnown) {
      const logoUrl = this.shadowRoot.getElementById("store-logo-url")?.value?.trim();
      const fileInp = this.shadowRoot.getElementById("store-logo-file");
      if (logoUrl || fileInp?.files?.length > 0) {
        const refreshed = await this._hass.callWS({ type: "loyalty_cards/get_data" });
        const newStore = (refreshed.stores || []).find(s => s.name === name);
        if (newStore) {
          if (logoUrl) {
            await this._hass.callService("loyalty_cards", "download_logo", { store_id: newStore.id, url: logoUrl });
          } else if (fileInp?.files?.[0]) {
            await this._uploadLogoFile(newStore.id, fileInp.files[0]);
          }
        }
      }
    }

    // Open add_card immediately after creating store
    const refreshed2 = await this._hass.callWS({ type: "loyalty_cards/get_data" });
    const newStore = (refreshed2.stores || []).find(s => s.name === name);
    if (newStore) {
      this._data = refreshed2;
      this._modal = { type: "add_card", store: newStore };
      this._render();
    } else {
      this._closeModal();
    }
  }

  async _uploadLogoFile(storeId, file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        await this._hass.callService("loyalty_cards", "upload_logo", {
          store_id: storeId, data_url: e.target.result,
        });
        resolve();
      };
      reader.readAsDataURL(file);
    });
  }

  // ── Edit Store modal ──────────────────────────────────────────────────────
  _buildEditStoreModal() {
    const { store } = this._modal;
    const isKnown = CZECH_STORES.some(s => s.name === store.name);
    const frag = document.createDocumentFragment();

    const mh = document.createElement("div");
    mh.className = "modal-header";
    mh.innerHTML = `<span class="modal-title">${store.name}</span><button class="close-btn">✕</button>`;
    mh.querySelector(".close-btn").addEventListener("click", () => this._closeModal());
    frag.appendChild(mh);

    frag.appendChild(this._makeField("Název", `<input type="text" id="edit-name" value="${store.name}" />`));
    frag.appendChild(this._makeField("Kategorie", `
      <select id="edit-category">
        ${Object.entries(CATEGORY_LABELS).map(([k, v]) =>
          `<option value="${k}"${k === store.category ? " selected" : ""}>${v}</option>`
        ).join("")}
      </select>`));
    frag.appendChild(this._makeField("Barva dlaždice", `
      <div class="color-row">
        <input type="color" id="edit-color" value="${store.tile_color || "#1976d2"}" />
      </div>`));

    // Logo section: only for custom stores
    if (!isKnown) {
      frag.appendChild(Object.assign(document.createElement("div"), {
        className: "section-title", textContent: "Logo",
      }));
      const logoRow = document.createElement("div");
      logoRow.className = "logo-row";
      if (store.logo_path) {
        const img = document.createElement("img");
        img.className = "logo-preview"; img.src = store.logo_path; img.alt = "Logo";
        logoRow.appendChild(img);
      }
      const urlInp = document.createElement("input");
      urlInp.type = "text"; urlInp.id = "edit-logo-url"; urlInp.placeholder = "URL nového loga…"; urlInp.style.flex = "1";
      logoRow.appendChild(urlInp);
      frag.appendChild(logoRow);
      const fileGroup = document.createElement("div");
      fileGroup.className = "form-group";
      fileGroup.innerHTML = `
        <label class="file-label" for="edit-logo-file">📁 Nahrát ze souboru</label>
        <input type="file" id="edit-logo-file" accept="image/*" />
        <span id="edit-logo-fn" class="hint"></span>`;
      frag.appendChild(fileGroup);
      if (store.logo_path) {
        const delLogoBtn = document.createElement("button");
        delLogoBtn.className = "btn btn-secondary";
        delLogoBtn.style.marginBottom = "8px";
        delLogoBtn.textContent = "Smazat logo";
        delLogoBtn.addEventListener("click", async () => {
          await this._hass.callService("loyalty_cards", "delete_logo", { store_id: store.id });
          this._closeModal();
        });
        frag.appendChild(delLogoBtn);
      }
      setTimeout(() => {
        const fi = this.shadowRoot.getElementById("edit-logo-file");
        const ci = this.shadowRoot.getElementById("edit-color");
        if (fi) fi.addEventListener("change", async () => {
          const file = fi.files[0]; if (!file) return;
          const fn = this.shadowRoot.getElementById("edit-logo-fn");
          if (fn) fn.textContent = file.name;
          const url = URL.createObjectURL(file);
          const color = await dominantColor(url); URL.revokeObjectURL(url);
          if (color && ci) ci.value = color;
        });
      }, 50);
    }

    // Cards list
    frag.appendChild(Object.assign(document.createElement("div"), {
      className: "section-title", textContent: `Karty (${(store.cards || []).length})`,
    }));
    const cardsList = document.createElement("ul");
    cardsList.className = "location-list";
    (store.cards || []).forEach((c, i) => {
      const li = document.createElement("li");
      li.className = "location-item";
      li.innerHTML = `<span>${c.name || `Karta ${i + 1}`} · ${c.barcode}</span>`;
      const db = document.createElement("button");
      db.className = "btn btn-danger";
      db.style.cssText = "padding:2px 8px;font-size:.75em;";
      db.textContent = "✕";
      db.addEventListener("click", async () => {
        if (confirm(`Smazat kartu „${c.name || `Karta ${i + 1}`}"?`)) {
          await this._hass.callService("loyalty_cards", "delete_card", { card_id: c.id });
          this._closeModal();
        }
      });
      li.appendChild(db);
      cardsList.appendChild(li);
    });
    frag.appendChild(cardsList);

    // Locations list
    frag.appendChild(Object.assign(document.createElement("div"), {
      className: "section-title", textContent: `Adresy poboček (${(store.locations || []).length})`,
    }));
    const locList = document.createElement("ul");
    locList.className = "location-list";
    (store.locations || []).forEach((loc, i) => {
      const li = document.createElement("li");
      li.className = "location-item";
      li.innerHTML = `<span>${loc.label || "Pobočka"} (${loc.lat.toFixed(4)}, ${loc.lon.toFixed(4)}, ${loc.radius_m}m)</span>`;
      const db = document.createElement("button");
      db.className = "btn btn-danger"; db.style.cssText = "padding:2px 8px;font-size:.75em;"; db.textContent = "✕";
      db.addEventListener("click", async () => {
        await this._hass.callService("loyalty_cards", "delete_location", { store_id: store.id, location_index: i });
        this._closeModal();
      });
      li.appendChild(db);
      locList.appendChild(li);
    });
    frag.appendChild(locList);

    const btnRow = document.createElement("div");
    btnRow.className = "btn-row";
    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-danger";
    delBtn.textContent = "Smazat obchod";
    delBtn.addEventListener("click", async () => {
      if (confirm(`Smazat obchod „${store.name}"?`)) {
        await this._hass.callService("loyalty_cards", "delete_store", { store_id: store.id });
        this._closeModal();
      }
    });
    const addCardBtn = document.createElement("button");
    addCardBtn.className = "btn btn-secondary";
    addCardBtn.textContent = "+ Přidat kartu";
    addCardBtn.addEventListener("click", () => this._openModal({ type: "add_card", store }));
    const saveBtn = document.createElement("button");
    saveBtn.className = "btn btn-primary"; saveBtn.textContent = "Uložit";
    saveBtn.addEventListener("click", () => this._saveEditStore(store));
    btnRow.appendChild(delBtn); btnRow.appendChild(addCardBtn); btnRow.appendChild(saveBtn);
    frag.appendChild(btnRow);
    return frag;
  }

  async _saveEditStore(store) {
    const name = this.shadowRoot.getElementById("edit-name")?.value?.trim();
    const category = this.shadowRoot.getElementById("edit-category")?.value;
    const color = this.shadowRoot.getElementById("edit-color")?.value;
    await this._hass.callService("loyalty_cards", "update_store", {
      store_id: store.id,
      ...(name && { name }), ...(category && { category }), ...(color && { tile_color: color }),
    });
    const logoUrl = this.shadowRoot.getElementById("edit-logo-url")?.value?.trim();
    if (logoUrl) await this._hass.callService("loyalty_cards", "download_logo", { store_id: store.id, url: logoUrl });
    const fileInp = this.shadowRoot.getElementById("edit-logo-file");
    if (fileInp?.files?.length > 0) await this._uploadLogoFile(store.id, fileInp.files[0]);
    this._closeModal();
  }

  // ── Add Card modal ────────────────────────────────────────────────────────
  _buildAddCardModal() {
    const { store, prefill = {} } = this._modal;
    const cardCount = (store.cards || []).length;
    const autoName = `Karta ${cardCount + 1}`;
    const frag = document.createDocumentFragment();

    const mh = document.createElement("div");
    mh.className = "modal-header";
    mh.innerHTML = `<span class="modal-title">Přidat kartu – ${store.name}</span><button class="close-btn">✕</button>`;
    mh.querySelector(".close-btn").addEventListener("click", () => this._closeModal());
    frag.appendChild(mh);

    frag.appendChild(this._makeField("Název karty", `
      <input type="text" id="card-name" placeholder="${autoName}" value="${prefill.name || ""}" />`));
    frag.appendChild(this._makeField("Číslo / kód", `
      <input type="text" id="card-barcode" placeholder="Zadejte nebo naskenujte" value="${prefill.barcode || ""}" />`));

    const scanRow = document.createElement("div");
    scanRow.className = "scan-row";
    const fileLabel = document.createElement("label");
    fileLabel.className = "scan-btn"; fileLabel.htmlFor = "scan-file-input";
    fileLabel.textContent = "🖼 Naskenovat z obrázku";
    scanRow.appendChild(fileLabel);
    const fileInput = document.createElement("input");
    fileInput.type = "file"; fileInput.id = "scan-file-input"; fileInput.accept = "image/*";
    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0]; if (file) await this._scanFromFile(file);
    });
    scanRow.appendChild(fileInput);
    frag.appendChild(scanRow);

    const btnRow = document.createElement("div");
    btnRow.className = "btn-row";
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn btn-secondary"; cancelBtn.textContent = "Zrušit";
    cancelBtn.addEventListener("click", () => this._closeModal());
    const saveBtn = document.createElement("button");
    saveBtn.className = "btn btn-primary"; saveBtn.textContent = "Přidat kartu";
    saveBtn.addEventListener("click", () => this._saveNewCard(store, autoName));
    btnRow.appendChild(cancelBtn); btnRow.appendChild(saveBtn);
    frag.appendChild(btnRow);
    return frag;
  }

  async _saveNewCard(store, autoName) {
    const barcode = this.shadowRoot.getElementById("card-barcode")?.value?.trim();
    if (!barcode) { alert("Zadejte číslo karty."); return; }
    const name = this.shadowRoot.getElementById("card-name")?.value?.trim() || autoName;
    const barcodeType = autoDetectType(barcode);
    await this._hass.callService("loyalty_cards", "add_card", {
      store_id: store.id, name, barcode, barcode_type: barcodeType, notes: "",
    });
    this._closeModal();
  }

  // ── Edit Card modal ───────────────────────────────────────────────────────
  _buildEditCardModal() {
    const { store, card } = this._modal;
    const frag = document.createDocumentFragment();

    const mh = document.createElement("div");
    mh.className = "modal-header";
    mh.innerHTML = `<span class="modal-title">Upravit kartu – ${store.name}</span><button class="close-btn">✕</button>`;
    mh.querySelector(".close-btn").addEventListener("click", () =>
      this._openModal({ type: "barcode", store, cardIndex: (store.cards || []).findIndex(c => c.id === card.id) }));
    frag.appendChild(mh);

    frag.appendChild(this._makeField("Název karty", `
      <input type="text" id="edit-card-name" value="${card.name || ""}" placeholder="Karta" />`));
    frag.appendChild(this._makeField("Číslo / kód", `
      <input type="text" id="edit-card-barcode" value="${card.barcode}" />`));

    const btnRow = document.createElement("div");
    btnRow.className = "btn-row";
    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-danger"; delBtn.textContent = "Smazat kartu";
    delBtn.addEventListener("click", async () => {
      if (confirm(`Smazat kartu „${card.name || card.barcode}"?`)) {
        await this._hass.callService("loyalty_cards", "delete_card", { card_id: card.id });
        this._closeModal();
      }
    });
    const saveBtn = document.createElement("button");
    saveBtn.className = "btn btn-primary"; saveBtn.textContent = "Uložit";
    saveBtn.addEventListener("click", () => this._saveEditCard(store, card));
    btnRow.appendChild(delBtn); btnRow.appendChild(saveBtn);
    frag.appendChild(btnRow);
    return frag;
  }

  async _saveEditCard(store, card) {
    const name = this.shadowRoot.getElementById("edit-card-name")?.value?.trim();
    const barcode = this.shadowRoot.getElementById("edit-card-barcode")?.value?.trim();
    if (!barcode) { alert("Zadejte číslo karty."); return; }
    await this._hass.callService("loyalty_cards", "update_card", {
      card_id: card.id,
      ...(name && { name }), barcode, barcode_type: autoDetectType(barcode),
    });
    this._closeModal();
  }

  // ── Location modal (Leaflet map on document.body) ─────────────────────────
  async _openLocationModal(store) {
    if (!window.L) {
      try {
        await Promise.all([
          this._loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"),
          this._loadStyle("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"),
        ]);
      } catch {
        alert("Nelze načíst mapu. Zkontrolujte připojení k internetu."); return;
      }
    }

    document.getElementById("lc-loc-overlay")?.remove();
    const overlay = document.createElement("div");
    overlay.id = "lc-loc-overlay";
    overlay.style.cssText = "position:fixed;inset:0;z-index:10000;display:flex;flex-direction:column;background:#fff;";

    // Header
    const hdr = document.createElement("div");
    hdr.style.cssText = "display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid #e0e0e0;flex-shrink:0;background:#fff;";
    hdr.innerHTML = `<strong>${store.name} – Přidat adresu pobočky</strong>
      <button id="lc-loc-close" style="background:none;border:none;font-size:1.5em;cursor:pointer;">✕</button>`;
    overlay.appendChild(hdr);

    // Search + GPS row
    const searchRow = document.createElement("div");
    searchRow.style.cssText = "display:flex;gap:8px;padding:10px 12px;flex-shrink:0;background:#fff;";
    searchRow.innerHTML = `
      <input id="lc-loc-addr" type="text" placeholder="Hledat adresu, název místa…"
        style="flex:1;padding:8px 10px;border:1px solid #ccc;border-radius:6px;font-size:14px;" />
      <button id="lc-loc-search" style="padding:8px 12px;border:1px solid #ccc;border-radius:6px;cursor:pointer;white-space:nowrap;">Hledat</button>
      <button id="lc-loc-gps" style="padding:8px 12px;border:1px solid #ccc;border-radius:6px;cursor:pointer;" title="Použít polohu zařízení">📍</button>`;
    overlay.appendChild(searchRow);

    // Map
    const mapDiv = document.createElement("div");
    mapDiv.id = "lc-leaflet-map";
    mapDiv.style.cssText = "flex:1;";
    overlay.appendChild(mapDiv);

    // Bottom: radius, label, save
    const bottom = document.createElement("div");
    bottom.style.cssText = "padding:12px 16px;border-top:1px solid #e0e0e0;flex-shrink:0;background:#fff;";
    bottom.innerHTML = `
      <div style="display:flex;gap:8px;margin-bottom:8px;">
        <input id="lc-loc-radius" type="number" value="300" placeholder="Poloměr (m)"
          style="flex:1;padding:8px;border:1px solid #ccc;border-radius:6px;" />
        <input id="lc-loc-label" type="text" placeholder="Název pobočky (nepovinné)"
          style="flex:2;padding:8px;border:1px solid #ccc;border-radius:6px;" />
      </div>
      <button id="lc-loc-save"
        style="width:100%;background:#1976d2;color:#fff;border:none;padding:12px;border-radius:8px;cursor:pointer;font-size:1em;font-weight:600;">
        Uložit lokaci
      </button>`;
    overlay.appendChild(bottom);
    document.body.appendChild(overlay);

    // Init Leaflet
    const map = window.L.map("lc-leaflet-map").setView([49.8, 15.5], 7);
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap", maxZoom: 19,
    }).addTo(map);
    let marker = null;
    const placeMarker = (latlng) => {
      if (marker) marker.remove();
      marker = window.L.marker(latlng).addTo(map);
    };
    map.on("click", (e) => placeMarker(e.latlng));

    // GPS
    document.getElementById("lc-loc-gps").addEventListener("click", () => {
      if (!navigator.geolocation) { alert("GPS není dostupná"); return; }
      const btn = document.getElementById("lc-loc-gps");
      btn.textContent = "⏳"; btn.disabled = true;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const latlng = window.L.latLng(pos.coords.latitude, pos.coords.longitude);
          map.setView(latlng, 16); placeMarker(latlng);
          btn.textContent = "📍"; btn.disabled = false;
        },
        () => { alert("Nepodařilo se získat polohu. Povolte přístup k poloze v nastavení."); btn.textContent = "📍"; btn.disabled = false; },
        { enableHighAccuracy: true, timeout: 12000 }
      );
    });

    // Address search
    const doSearch = async () => {
      const q = document.getElementById("lc-loc-addr")?.value?.trim(); if (!q) return;
      const btn = document.getElementById("lc-loc-search");
      if (btn) { btn.textContent = "…"; btn.disabled = true; }
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
          { headers: { "Accept-Language": "cs,en" } }
        );
        const results = await resp.json();
        if (results.length > 0) {
          const r = results[0];
          const latlng = window.L.latLng(parseFloat(r.lat), parseFloat(r.lon));
          map.setView(latlng, 16); placeMarker(latlng);
        } else { alert("Adresa nenalezena."); }
      } catch { alert("Chyba při vyhledávání."); }
      finally { if (btn) { btn.textContent = "Hledat"; btn.disabled = false; } }
    };
    document.getElementById("lc-loc-search").addEventListener("click", doSearch);
    document.getElementById("lc-loc-addr").addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); doSearch(); }
    });

    // Close
    document.getElementById("lc-loc-close").addEventListener("click", () => overlay.remove());

    // Save
    document.getElementById("lc-loc-save").addEventListener("click", async () => {
      if (!marker) { alert("Vyberte lokaci kliknutím na mapu nebo vyhledejte adresu."); return; }
      const latlng = marker.getLatLng();
      const radius = parseInt(document.getElementById("lc-loc-radius")?.value) || 300;
      const label = document.getElementById("lc-loc-label")?.value?.trim() || "";
      const btn = document.getElementById("lc-loc-save");
      btn.textContent = "Ukládám…"; btn.disabled = true;
      await this._hass.callService("loyalty_cards", "add_location", {
        store_id: store.id, lat: latlng.lat, lon: latlng.lng, radius_m: radius, label,
      });
      overlay.remove();
      this._loadData();
    });
  }

  _loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const s = document.createElement("script");
      s.src = src; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  _loadStyle(href) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`link[href="${href}"]`)) { resolve(); return; }
      const l = document.createElement("link");
      l.rel = "stylesheet"; l.href = href; l.onload = resolve; l.onerror = reject;
      document.head.appendChild(l);
    });
  }

  // ── Scanner – live camera ─────────────────────────────────────────────────
  _startLiveScanner(store) {
    const readerId = "lc-scanner-reader";
    const overlay = document.createElement("div");
    overlay.id = "lc-scanner-overlay";
    overlay.style.cssText = "position:fixed;inset:0;z-index:10000;background:#000;display:flex;flex-direction:column;";
    const header = document.createElement("div");
    header.style.cssText = "display:flex;justify-content:space-between;align-items:center;padding:16px;color:#fff;flex-shrink:0;";
    header.innerHTML = `<span style="font-size:1.1em;font-weight:600;">Skenování</span>
      <button id="lc-close-scan" style="background:none;border:none;color:#fff;font-size:1.8em;cursor:pointer;padding:0;">✕</button>`;
    overlay.appendChild(header);
    const readerDiv = document.createElement("div");
    readerDiv.id = readerId; readerDiv.style.cssText = "flex:1;overflow:hidden;";
    overlay.appendChild(readerDiv);
    const hint = document.createElement("p");
    hint.style.cssText = "color:#aaa;text-align:center;font-size:.85em;padding:12px;flex-shrink:0;margin:0;";
    hint.textContent = "Namiřte kameru na čárový nebo QR kód.";
    overlay.appendChild(hint);
    document.body.appendChild(overlay);
    document.getElementById("lc-close-scan").addEventListener("click", () => this._stopLiveScanner());
    try {
      this._scanner = new Html5Qrcode(readerId, { verbose: false });
      this._scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (text, result) => {
          const type = this._mapScanFormat(result?.result?.format?.formatName);
          this._stopLiveScanner();
          this._modal = { type: "add_card", store, prefill: { barcode: text, barcode_type: type } };
          this._render();
        }
      ).catch(() => { hint.textContent = "Kamera nedostupná nebo zakázaná."; });
    } catch { this._stopLiveScanner(); }
  }

  _stopLiveScanner() {
    const overlay = document.getElementById("lc-scanner-overlay");
    const scanner = this._scanner;
    this._scanner = null;
    if (scanner) scanner.stop().catch(() => {});
    if (overlay?.parentNode) overlay.parentNode.removeChild(overlay);
  }

  // ── Scanner – from image file ─────────────────────────────────────────────
  async _scanFromFile(file) {
    const tempId = "lc-temp-" + Date.now();
    const tempDiv = document.createElement("div");
    tempDiv.id = tempId;
    tempDiv.style.cssText = "position:fixed;left:-9999px;top:0;width:300px;height:300px;visibility:hidden;";
    document.body.appendChild(tempDiv);
    try {
      const scanner = new Html5Qrcode(tempId);
      let text, formatName;
      if (typeof scanner.scanFileV2 === "function") {
        try {
          const result = await scanner.scanFileV2(file, false);
          text = result.decodedText; formatName = result.result?.format?.formatName;
        } catch { text = await scanner.scanFile(file, false); }
      } else { text = await scanner.scanFile(file, false); }
      if (text) {
        const barcodeInp = this.shadowRoot.getElementById("card-barcode");
        if (barcodeInp) barcodeInp.value = text;
        if (formatName) {
          const mapped = this._mapScanFormat(formatName);
          // store as data attribute for saveNewCard to pick up
          if (barcodeInp) barcodeInp.dataset.detectedType = mapped;
        }
      }
    } catch { alert("Kód se nepodařilo přečíst. Zkuste jiný obrázek."); }
    finally { if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv); }
  }

  _mapScanFormat(fmt) {
    const map = {
      QR_CODE: "QR_CODE", EAN_13: "EAN_13", EAN_8: "EAN_8",
      CODE_128: "CODE_128", CODE_39: "CODE_39", ITF: "ITF",
      PDF_417: "PDF_417", AZTEC: "AZTEC", DATA_MATRIX: "DATA_MATRIX",
      UPC_A: "UPC_A", UPC_E: "UPC_E",
    };
    return map[fmt] || "CODE_128";
  }

  async _geocodeAddress(query) {
    if (!query) return;
    const resultsEl = this.shadowRoot.getElementById("loc-addr-results");
    const searchBtn = this.shadowRoot.getElementById("loc-search-btn");
    if (searchBtn) { searchBtn.textContent = "Hledám…"; searchBtn.disabled = true; }
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=0`;
      const resp = await fetch(url, { headers: { "Accept-Language": "cs,en" } });
      const results = await resp.json();
      if (!resultsEl) return;
      if (results.length === 0) {
        resultsEl.innerHTML = `<div class="loc-result-item" style="color:var(--secondary-text-color);">Adresa nenalezena.</div>`;
        resultsEl.style.display = "block"; return;
      }
      resultsEl.innerHTML = "";
      for (const r of results) {
        const item = document.createElement("div");
        item.className = "loc-result-item"; item.textContent = r.display_name;
        item.addEventListener("click", () => {
          const la = this.shadowRoot.getElementById("loc-lat");
          const lo = this.shadowRoot.getElementById("loc-lon");
          if (la) la.value = parseFloat(r.lat).toFixed(6);
          if (lo) lo.value = parseFloat(r.lon).toFixed(6);
          resultsEl.style.display = "none";
          const addrInp = this.shadowRoot.getElementById("loc-addr");
          if (addrInp) addrInp.value = r.display_name.split(",")[0];
        });
        resultsEl.appendChild(item);
      }
      resultsEl.style.display = "block";
    } catch {
      if (resultsEl) {
        resultsEl.innerHTML = `<div class="loc-result-item" style="color:var(--error-color,#c00);">Chyba při vyhledávání.</div>`;
        resultsEl.style.display = "block";
      }
    } finally { if (searchBtn) { searchBtn.textContent = "Hledat"; searchBtn.disabled = false; } }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  _makeField(labelText, inputHtml) {
    const div = document.createElement("div");
    div.className = "form-group";
    div.innerHTML = labelText ? `<label>${labelText}</label>${inputHtml}` : inputHtml;
    return div;
  }

  _renderError(msg) {
    this.shadowRoot.innerHTML = `<style>${STYLES}</style>
      <div class="card-root"><div class="empty" style="padding:32px;">${msg}</div></div>`;
  }

  static getConfigElement() { return document.createElement("loyalty-cards-card-editor"); }
  static getStubConfig() { return {}; }
}

// ── Card editor ───────────────────────────────────────────────────────────────
class LoyaltyCardsCardEditor extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: "open" }); this._config = {}; }

  setConfig(config) { this._config = { ...config }; this._render(); }

  _render() {
    const layout = this._config.layout || "";
    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; }
        .row { margin-bottom:14px; }
        label { display:block; font-size:.82em; color:var(--secondary-text-color,#555); margin-bottom:4px; }
        select { width:100%; padding:8px 10px; border-radius:6px; border:1px solid var(--divider-color,#ccc);
                 background:var(--card-background-color,#fff); color:var(--primary-text-color,#333); font-size:.9em; }
      </style>
      <div class="row">
        <label>Rozložení karet</label>
        <select id="layout-select">
          <option value="" ${!layout ? "selected" : ""}>Záložky (Vše / Poblíž / Kategorie)</option>
          <option value="flat" ${layout === "flat" ? "selected" : ""}>Ploché (skupiny dle kategorie)</option>
        </select>
      </div>`;
    this.shadowRoot.getElementById("layout-select").addEventListener("change", (e) => {
      const cfg = { ...this._config };
      if (e.target.value) cfg.layout = e.target.value; else delete cfg.layout;
      this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: cfg }, bubbles: true, composed: true }));
    });
  }
}

customElements.define("loyalty-cards-card-editor", LoyaltyCardsCardEditor);
customElements.define("loyalty-cards-card", LoyaltyCardsCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "loyalty-cards-card",
  name: "Věrnostní karty",
  description: "Správa věrnostních karet obchodů s GPS detekcí.",
  preview: false,
});
