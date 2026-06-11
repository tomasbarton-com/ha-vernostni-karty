import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import { Html5Qrcode } from "html5-qrcode";

// ── Czech store catalogue ───────────────────────────────────────────────────
const CZECH_STORES = [
  { name: "Albert", category: "groceries", logo_domain: "albert.cz" },
  { name: "Billa", category: "groceries", logo_domain: "billa.cz" },
  { name: "Kaufland", category: "groceries", logo_domain: "kaufland.cz" },
  { name: "Lidl", category: "groceries", logo_domain: "lidl.cz" },
  { name: "Penny", category: "groceries", logo_domain: "penny.cz" },
  { name: "Tesco", category: "groceries", logo_domain: "tesco.cz" },
  { name: "Globus", category: "groceries", logo_domain: "globus.cz" },
  { name: "Coop", category: "groceries", logo_domain: "coop.cz" },
  { name: "Norma", category: "groceries", logo_domain: "norma.de" },
  { name: "dm", category: "drugstore", logo_domain: "dm.cz" },
  { name: "Rossmann", category: "drugstore", logo_domain: "rossmann.cz" },
  { name: "Teta", category: "drugstore", logo_domain: "tetadrogerie.cz" },
  { name: "Dr. Max", category: "pharmacy", logo_domain: "drmax.cz" },
  { name: "Benu", category: "pharmacy", logo_domain: "benu.cz" },
  { name: "Pilulka", category: "pharmacy", logo_domain: "pilulka.cz" },
  { name: "Lékárna.cz", category: "pharmacy", logo_domain: "lekarna.cz" },
  { name: "OBI", category: "diy", logo_domain: "obi.cz" },
  { name: "Bauhaus", category: "diy", logo_domain: "bauhaus.cz" },
  { name: "Hornbach", category: "diy", logo_domain: "hornbach.cz" },
  { name: "Alza", category: "electronics", logo_domain: "alza.cz" },
  { name: "CZC", category: "electronics", logo_domain: "czc.cz" },
  { name: "Datart", category: "electronics", logo_domain: "datart.cz" },
  { name: "ElectroWorld", category: "electronics", logo_domain: "electroworld.cz" },
  { name: "Decathlon", category: "sport", logo_domain: "decathlon.cz" },
  { name: "Sportisimo", category: "sport", logo_domain: "sportisimo.cz" },
  { name: "Hervis", category: "sport", logo_domain: "hervis.cz" },
  { name: "H&M", category: "fashion", logo_domain: "hm.com" },
  { name: "Zara", category: "fashion", logo_domain: "zara.com" },
  { name: "Reserved", category: "fashion", logo_domain: "reserved.com" },
  { name: "Primark", category: "fashion", logo_domain: "primark.com" },
  { name: "CCC", category: "fashion", logo_domain: "ccc.eu" },
  { name: "Deichmann", category: "fashion", logo_domain: "deichmann.com" },
  { name: "New Yorker", category: "fashion", logo_domain: "newyorker.de" },
  { name: "Pepco", category: "fashion", logo_domain: "pepco.com" },
  { name: "McDonald's", category: "fastfood", logo_domain: "mcdonalds.cz" },
  { name: "KFC", category: "fastfood", logo_domain: "kfc.cz" },
  { name: "Burger King", category: "fastfood", logo_domain: "burgerking.cz" },
  { name: "Subway", category: "fastfood", logo_domain: "subway.com" },
  { name: "Pizza Hut", category: "fastfood", logo_domain: "pizzahut.cz" },
  { name: "Starbucks", category: "fastfood", logo_domain: "starbucks.cz" },
  { name: "Costa Coffee", category: "fastfood", logo_domain: "costacoffee.cz" },
  { name: "Bageterie Boulevard", category: "fastfood", logo_domain: "bageterie.com" },
  { name: "IKEA", category: "other", logo_domain: "ikea.cz" },
  { name: "Okay", category: "other", logo_domain: "okay.cz" },
  { name: "Kika", category: "other", logo_domain: "kika.cz" },
  { name: "Zoot", category: "other", logo_domain: "zoot.cz" },
  { name: "Tchibo", category: "other", logo_domain: "tchibo.cz" },
  { name: "Action", category: "other", logo_domain: "action.com" },
  { name: "Flying Tiger", category: "other", logo_domain: "flyingtiger.com" },
];

const CATEGORY_LABELS = {
  groceries: "Potraviny",
  drugstore: "Drogerie",
  pharmacy: "Lékárna",
  diy: "Hobby & Nástroje",
  electronics: "Elektronika",
  sport: "Sport",
  fashion: "Móda",
  fastfood: "Fastfood",
  other: "Ostatní",
};

function distanceM(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function initials(name) {
  return name
    .split(/[\s&]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

async function dominantColor(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = 32;
        c.height = 32;
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0, 32, 32);
        const d = ctx.getImageData(0, 0, 32, 32).data;
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] > 128) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
        }
        resolve(n > 0
          ? "#" + [r, g, b].map(v => Math.round(v / n).toString(16).padStart(2, "0")).join("")
          : null);
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// ── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
  :host { display: block; font-family: var(--paper-font-body1_-_font-family, sans-serif); }
  .card-root { background: var(--card-background-color, #fff); border-radius: 12px; overflow: hidden; }
  .header { padding: 16px 16px 0; display: flex; justify-content: space-between; align-items: center; }
  .header h2 { margin: 0; font-size: 1.1em; font-weight: 600; color: var(--primary-text-color); }
  .tabs { display: flex; gap: 4px; padding: 8px 16px; border-bottom: 1px solid var(--divider-color,#e0e0e0);
          overflow-x: auto; scrollbar-width: none; }
  .tabs::-webkit-scrollbar { display: none; }
  .tab { padding: 6px 14px; border-radius: 20px; cursor: pointer; font-size: 0.85em; white-space: nowrap;
         color: var(--secondary-text-color); border: none; background: none; }
  .tab.active { background: var(--primary-color, #1976d2); color: #fff; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 12px 16px 16px; }
  @media (min-width: 600px) { .grid { grid-template-columns: repeat(3, 1fr); } }
  @media (min-width: 900px) { .grid { grid-template-columns: repeat(4, 1fr); } }
  .tile { border-radius: 10px; cursor: pointer; overflow: hidden; position: relative;
          transition: transform .15s, box-shadow .15s;
          display: flex; flex-direction: column; align-items: center; padding: 14px 8px 10px; gap: 8px;
          box-shadow: 0 1px 4px rgba(0,0,0,.12); }
  .tile:hover { transform: scale(1.03); box-shadow: 0 4px 12px rgba(0,0,0,.2); }
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
  .tile-badge { position:absolute; bottom:6px; right:8px; background:rgba(0,0,0,.35); color:#fff;
                border-radius:10px; font-size:0.72em; font-weight:700; padding:1px 6px;
                min-width:20px; text-align:center; line-height:18px; pointer-events:none; }
  .loc-actions { display:flex; gap:8px; margin-bottom:8px; flex-wrap:wrap; }
  .loc-addr-row { display:flex; gap:8px; align-items:center; margin-bottom:4px; }
  .loc-addr-row input { flex:1; min-width:0; }
  .loc-addr-results { border:1px solid var(--divider-color,#ccc); border-radius:6px; max-height:160px;
                      overflow-y:auto; margin-bottom:8px; background:var(--card-background-color,#fff); }
  .loc-result-item { padding:8px 10px; cursor:pointer; font-size:0.82em;
                     border-bottom:1px solid var(--divider-color,#eee); color:var(--primary-text-color); }
  .loc-result-item:last-child { border-bottom:none; }
  .loc-result-item:hover { background:var(--secondary-background-color,#f5f5f5); }
  .fab { position: absolute; bottom: 16px; right: 16px; width: 48px; height: 48px; border-radius: 50%;
         background: var(--primary-color, #1976d2); color: #fff; border: none; font-size: 1.8em;
         cursor: pointer; display: flex; align-items: center; justify-content: center;
         box-shadow: 0 4px 12px rgba(0,0,0,.3); z-index: 1; }
  .grid-wrap { position: relative; min-height: 80px; }
  .empty { padding: 24px; text-align: center; color: var(--secondary-text-color); font-size: 0.9em; }
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
  .barcode-wrap { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 8px 0; }
  .barcode-wrap svg, .barcode-wrap canvas { max-width: 100%; }
  .barcode-value { font-size: 0.85em; color: var(--secondary-text-color); letter-spacing: 1px; }
  .card-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }
  .card-tab { padding: 4px 12px; border-radius: 16px; cursor: pointer; font-size: 0.8em;
              border: 1px solid var(--divider-color, #e0e0e0); background: none;
              color: var(--primary-text-color); }
  .card-tab.active { background: var(--primary-color, #1976d2); color: #fff; border-color: transparent; }

  /* Forms */
  .form-group { margin-bottom: 14px; }
  label { display: block; font-size: 0.82em; color: var(--secondary-text-color); margin-bottom: 4px; }
  input[type=text], input[type=number], select, textarea {
    width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 6px;
    border: 1px solid var(--divider-color, #ccc); background: var(--card-background-color, #fff);
    color: var(--primary-text-color); font-size: 0.9em; }
  .color-row { display: flex; gap: 8px; align-items: center; }
  input[type=color] { width: 40px; height: 36px; padding: 2px; border-radius: 6px;
                      border: 1px solid var(--divider-color,#ccc); cursor: pointer; }
  .btn-row { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; flex-wrap: wrap; }
  .btn { padding: 9px 18px; border-radius: 8px; border: none; cursor: pointer; font-size: 0.9em; }
  .btn-primary { background: var(--primary-color, #1976d2); color: #fff; }
  .btn-danger { background: #d32f2f; color: #fff; }
  .btn-secondary { background: var(--secondary-background-color, #f5f5f5); color: var(--primary-text-color);
                   border: 1px solid var(--divider-color,#e0e0e0); }
  .logo-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 8px; }
  .logo-preview { width: 48px; height: 48px; object-fit: contain; border-radius: 6px;
                  border: 1px solid var(--divider-color,#ccc); }
  .section-title { font-weight: 600; color: var(--primary-text-color); margin: 16px 0 8px; font-size: 0.9em; }
  .location-list { list-style: none; padding: 0; margin: 0 0 8px; }
  .location-item { display: flex; justify-content: space-between; align-items: center;
                   padding: 6px 0; border-bottom: 1px solid var(--divider-color,#e0e0e0); font-size: 0.85em; }
  .file-label { display: inline-block; padding: 8px 14px; background: var(--secondary-background-color,#f0f0f0);
                border: 1px solid var(--divider-color,#ccc); border-radius: 6px; cursor: pointer;
                font-size: 0.85em; color: var(--primary-text-color); }
  .file-label:hover { background: var(--divider-color,#e0e0e0); }
  input[type=file] { display: none; }
  .hint { font-size: 0.78em; color: var(--secondary-text-color); margin-top: 4px; display: block; }
  .scan-row { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
  .scan-btn { flex: 1; min-width: 120px; padding: 10px; background: var(--secondary-background-color,#f0f0f0);
              border: 2px dashed var(--divider-color,#ccc); border-radius: 8px; cursor: pointer;
              font-size: 0.85em; color: var(--primary-text-color); text-align: center; }
  .custom-fields { margin-top: 10px; }
`;

// ── Main custom element ──────────────────────────────────────────────────────
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
  }

  set hass(hass) {
    const firstLoad = !this._data;
    this._hass = hass;
    this._updateNearby();
    if (firstLoad) {
      this._loadData();
    } else if (!this._modal) {
      // Don't re-render while a modal/form is open — would destroy user input
      this._render();
    }
  }

  setConfig(config) {
    this._config = config || {};
  }

  connectedCallback() {
    this._subscribe();
  }

  disconnectedCallback() {
    this._unsubscribeBus?.();
    this._stopLiveScanner();
  }

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
      this._render();
      if (!this._unsubscribeBus) this._subscribe();
    } catch {
      this._renderError("Nepodařilo se načíst data. Je integrace Věrnostní karty nainstalována?");
    }
  }

  _updateNearby() {
    if (!this._hass || !this._data) return;
    const { settings = {}, stores = [] } = this._data;
    const {
      device_trackers: trackers = [],
      global_proximity_m: globalR = 300,
      notifications_enabled: notifOn = false,
      notification_dwell_minutes: dwellMin = 7,
    } = settings;

    let userLat = null, userLon = null;
    for (const t of trackers) {
      const st = this._hass.states[t];
      if (st?.attributes?.latitude) {
        userLat = st.attributes.latitude;
        userLon = st.attributes.longitude;
        break;
      }
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
        if (!nearby.has(id)) {
          clearTimeout(this._proximityTimer[id]);
          delete this._proximityTimer[id];
        }
      }
    }
    this._nearbyStoreIds = nearby;
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

  // ── Render ─────────────────────────────────────────────────────────────────
  _render() {
    const root = this.shadowRoot;
    root.innerHTML = "";
    const style = document.createElement("style");
    style.textContent = STYLES;
    root.appendChild(style);

    if (!this._data) return;

    const wrap = document.createElement("div");
    wrap.className = "card-root";

    wrap.appendChild(Object.assign(document.createElement("div"), {
      className: "header",
      innerHTML: `<h2>Věrnostní karty</h2>`,
    }));

    const isFlat = this._config?.layout === "flat";

    if (!isFlat) wrap.appendChild(this._buildTabs());

    const gridWrap = document.createElement("div");
    gridWrap.className = "grid-wrap";
    gridWrap.appendChild(isFlat ? this._buildFlatContent() : this._buildGrid());

    const fab = document.createElement("button");
    fab.className = "fab";
    fab.title = "Přidat obchod";
    fab.textContent = "+";
    fab.addEventListener("click", () => this._openModal({ type: "add_store" }));
    gridWrap.appendChild(fab);

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
      const empty = Object.assign(document.createElement("div"), {
        className: "empty",
        textContent: this._activeTab === "nearby"
          ? "Žádné obchody poblíž. Zkontrolujte nastavení polohování."
          : "Žádné karty. Přidejte první kliknutím na +",
      });
      empty.style.gridColumn = "1/-1";
      grid.appendChild(empty);
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
        className: "empty",
        textContent: "Žádné karty. Přidejte první kliknutím na +",
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
        className: "category-header",
        textContent: CATEGORY_LABELS[cat] || cat,
      }));
      const grid = document.createElement("div");
      grid.className = "grid";
      for (const store of catStores) grid.appendChild(this._buildTile(store));
      frag.appendChild(grid);
    }
    return frag;
  }

  _buildTile(store) {
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.style.background = store.tile_color || "#1976d2";

    const menuBtn = document.createElement("button");
    menuBtn.className = "tile-menu";
    menuBtn.title = "Nastavení obchodu";
    menuBtn.textContent = "⋮";
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this._openModal({ type: "edit_store", store });
    });
    tile.appendChild(menuBtn);

    if (store.logo_path) {
      const img = document.createElement("img");
      img.className = "tile-logo";
      img.src = store.logo_path;
      img.alt = store.name;
      img.onerror = () => img.replaceWith(this._buildInitials(store.name));
      tile.appendChild(img);
    } else {
      tile.appendChild(this._buildInitials(store.name));
    }

    tile.appendChild(Object.assign(document.createElement("div"), {
      className: "tile-name",
      textContent: store.name,
    }));

    const cardCount = (store.cards || []).length;
    if (cardCount > 0) {
      tile.appendChild(Object.assign(document.createElement("div"), {
        className: "tile-badge",
        textContent: String(cardCount),
      }));
    }

    tile.addEventListener("click", () => {
      this._openModal(cardCount === 0
        ? { type: "add_card", store }
        : { type: "barcode", store, cardIndex: 0 });
    });
    return tile;
  }

  _buildInitials(name) {
    return Object.assign(document.createElement("div"), {
      className: "tile-initials",
      textContent: initials(name),
    });
  }

  // ── Modal router ────────────────────────────────────────────────────────────
  _openModal(modal) { this._modal = modal; this._render(); }
  _closeModal() {
    this._modal = null;
    this._render();       // immediate UI update (grid visible again)
    this._loadData();     // background refresh to pick up any saved changes
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
    }
    overlay.appendChild(inner);
    return overlay;
  }

  // ── Barcode display modal ───────────────────────────────────────────────────
  _buildBarcodeModal() {
    const { store, cardIndex = 0 } = this._modal;
    const cards = store.cards || [];
    const card = cards[cardIndex] ?? cards[0];
    const frag = document.createDocumentFragment();

    const mh = document.createElement("div");
    mh.className = "modal-header";
    mh.innerHTML = `<span class="modal-title">${store.name}</span><button class="close-btn">✕</button>`;
    mh.querySelector(".close-btn").addEventListener("click", () => this._closeModal());
    frag.appendChild(mh);

    if (cards.length > 1) {
      const tabRow = document.createElement("div");
      tabRow.className = "card-tabs";
      cards.forEach((_, i) => {
        const t = document.createElement("button");
        t.className = "card-tab" + (i === cardIndex ? " active" : "");
        t.textContent = `Karta ${i + 1}`;
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
                format: card.barcode_type?.replace("_", "") || "CODE128",
                lineColor: "#000", background: "#fff",
                displayValue: true, fontSize: 14, margin: 10,
              });
            } catch (e) {
              el.outerHTML = `<p style="color:red;font-size:.8em">Nelze zobrazit: ${e.message}</p>`;
            }
          }
        }, 50);
      }
      wrap.appendChild(Object.assign(document.createElement("div"), {
        className: "barcode-value",
        textContent: card.barcode,
      }));
      if (card.notes) {
        wrap.appendChild(Object.assign(document.createElement("div"), {
          style: { cssText: "font-size:.82em;color:var(--secondary-text-color);text-align:center;" },
          textContent: card.notes,
        }));
      }
      wrap.style.cursor = "pointer";
      wrap.title = "Kliknutím zobrazíte na celé obrazovce";
      wrap.addEventListener("click", () => this._openFullscreen(card));
    }
    frag.appendChild(wrap);

    const btnRow = document.createElement("div");
    btnRow.className = "btn-row";
    [
      ["+ Přidat kartu", "btn-secondary", () => this._openModal({ type: "add_card", store })],
      ["Nastavení", "btn-secondary", () => this._openModal({ type: "edit_store", store })],
    ].forEach(([text, cls, handler]) => {
      const b = document.createElement("button");
      b.className = `btn ${cls}`;
      b.textContent = text;
      b.addEventListener("click", handler);
      btnRow.appendChild(b);
    });
    frag.appendChild(btnRow);
    return frag;
  }

  _openFullscreen(card) {
    const fs = document.createElement("div");
    fs.style.cssText =
      "position:fixed;inset:0;z-index:9999;background:#fff;display:flex;flex-direction:column;" +
      "align-items:center;justify-content:center;gap:16px;padding:20px;";

    const close = document.createElement("button");
    close.style.cssText =
      "position:absolute;top:16px;right:16px;background:none;border:none;font-size:2em;cursor:pointer;";
    close.textContent = "✕";
    close.addEventListener("click", () => {
      document.body.removeChild(fs);
      screen.orientation?.unlock?.()?.catch?.(() => {});
    });
    fs.appendChild(close);

    if (card.barcode_type === "QR_CODE") {
      const c = document.createElement("canvas");
      fs.appendChild(c);
      QRCode.toCanvas(c, card.barcode, { width: 260, margin: 2 }).catch(() => {});
    } else {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.style.maxWidth = "90vw";
      fs.appendChild(svg);
      try {
        JsBarcode(svg, card.barcode, {
          format: card.barcode_type?.replace("_", "") || "CODE128",
          lineColor: "#000", background: "#fff",
          displayValue: true, fontSize: 16, width: 3, height: 120, margin: 16,
        });
      } catch {}
    }
    fs.appendChild(Object.assign(document.createElement("div"), {
      style: { cssText: "font-size:1.1em;letter-spacing:2px;color:#333;" },
      textContent: card.barcode,
    }));
    document.body.appendChild(fs);
    screen.orientation?.lock?.("portrait")?.catch?.(() => {});
  }

  // ── Add Store modal ─────────────────────────────────────────────────────────
  _buildAddStoreModal() {
    const frag = document.createDocumentFragment();

    const mh = document.createElement("div");
    mh.className = "modal-header";
    mh.innerHTML = `<span class="modal-title">Přidat obchod</span><button class="close-btn">✕</button>`;
    mh.querySelector(".close-btn").addEventListener("click", () => this._closeModal());
    frag.appendChild(mh);

    // Grouped store selector
    const storeGroup = this._makeField("Obchod", "");
    const sel = document.createElement("select");
    sel.id = "store-select";
    sel.innerHTML = `<option value="">-- Vyberte nebo zadejte vlastní --</option>`;

    const byCategory = {};
    for (const s of CZECH_STORES) {
      (byCategory[s.category] = byCategory[s.category] || []).push(s);
    }
    for (const [cat, stores] of Object.entries(byCategory)) {
      const og = document.createElement("optgroup");
      og.label = CATEGORY_LABELS[cat] || cat;
      for (const s of stores) {
        const opt = document.createElement("option");
        opt.value = `${s.name}|${s.category}`;
        opt.textContent = s.name;
        og.appendChild(opt);
      }
      sel.appendChild(og);
    }
    sel.appendChild(Object.assign(document.createElement("option"), { value: "custom", textContent: "Jiný obchod…" }));
    storeGroup.appendChild(sel);
    frag.appendChild(storeGroup);

    // Custom fields
    const customFields = document.createElement("div");
    customFields.id = "custom-fields";
    customFields.className = "custom-fields";
    customFields.style.display = "none";
    customFields.innerHTML = `
      <div class="form-group"><label>Název obchodu</label><input type="text" id="store-name" placeholder="Název…" /></div>
      <div class="form-group"><label>Kategorie</label>
        <select id="store-category">
          ${Object.entries(CATEGORY_LABELS).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}
        </select></div>`;
    frag.appendChild(customFields);

    sel.addEventListener("change", () => {
      const v = sel.value;
      customFields.style.display = (v === "custom") ? "block" : "none";
    });

    // Color
    const colorGroup = this._makeField("Barva dlaždice", `
      <div class="color-row">
        <input type="color" id="store-color" value="#1976d2" />
        <span class="hint">Automaticky se upraví podle loga</span>
      </div>`);
    frag.appendChild(colorGroup);

    // Logo
    frag.appendChild(Object.assign(document.createElement("div"), {
      className: "section-title",
      textContent: "Logo (volitelné)",
    }));
    frag.appendChild(this._makeField("", `<input type="text" id="store-logo-url" placeholder="URL obrázku loga…" />`));

    const fileGroup = document.createElement("div");
    fileGroup.className = "form-group";
    fileGroup.innerHTML = `
      <label class="file-label" for="store-logo-file">📁 Vybrat ze souboru / fotky</label>
      <input type="file" id="store-logo-file" accept="image/*" />
      <span id="store-logo-fn" class="hint"></span>`;
    frag.appendChild(fileGroup);

    setTimeout(() => {
      const fi = this.shadowRoot.getElementById("store-logo-file");
      const ci = this.shadowRoot.getElementById("store-color");
      if (fi) fi.addEventListener("change", async () => {
        const file = fi.files[0];
        if (!file) return;
        const fn = this.shadowRoot.getElementById("store-logo-fn");
        if (fn) fn.textContent = file.name;
        const url = URL.createObjectURL(file);
        const color = await dominantColor(url);
        URL.revokeObjectURL(url);
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

  async _saveNewStore() {
    const v = this.shadowRoot.getElementById("store-select")?.value;
    let name, category, logoDomain;
    if (v && v !== "custom" && v !== "") {
      const found = CZECH_STORES.find(s => `${s.name}|${s.category}` === v);
      name = found?.name;
      category = found?.category;
      logoDomain = found?.logo_domain;
    } else {
      name = this.shadowRoot.getElementById("store-name")?.value?.trim();
      category = this.shadowRoot.getElementById("store-category")?.value || "other";
    }
    if (!name) { alert("Zadejte nebo vyberte název obchodu."); return; }
    const color = this.shadowRoot.getElementById("store-color")?.value || "#1976d2";

    await this._hass.callService("loyalty_cards", "add_store", { name, category, tile_color: color });

    const logoUrl = this.shadowRoot.getElementById("store-logo-url")?.value?.trim();
    const fileInp = this.shadowRoot.getElementById("store-logo-file");
    const hasExplicitLogo = logoUrl || fileInp?.files?.length > 0;

    if (hasExplicitLogo || logoDomain) {
      const refreshed = await this._hass.callWS({ type: "loyalty_cards/get_data" });
      const newStore = (refreshed.stores || []).find(s => s.name === name);
      if (newStore) {
        if (logoUrl) {
          await this._hass.callService("loyalty_cards", "download_logo", { store_id: newStore.id, url: logoUrl });
        } else if (fileInp?.files?.[0]) {
          await this._uploadLogoFile(newStore.id, fileInp.files[0]);
        } else if (logoDomain) {
          // Auto-fetch logo from Clearbit on background — don't block close
          this._hass.callService("loyalty_cards", "download_logo", {
            store_id: newStore.id,
            url: `https://logo.clearbit.com/${logoDomain}`,
          }).catch(() => {});
        }
      }
    }
    this._closeModal();
  }

  // ── Edit Store modal ────────────────────────────────────────────────────────
  _buildEditStoreModal() {
    const { store } = this._modal;
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

    frag.appendChild(Object.assign(document.createElement("div"), {
      className: "section-title", textContent: "Logo",
    }));

    const logoRow = document.createElement("div");
    logoRow.className = "logo-row";
    if (store.logo_path) {
      const img = document.createElement("img");
      img.className = "logo-preview";
      img.src = store.logo_path;
      img.alt = "Logo";
      logoRow.appendChild(img);
    }
    const urlInp = document.createElement("input");
    urlInp.type = "text";
    urlInp.id = "edit-logo-url";
    urlInp.placeholder = "URL nového loga…";
    urlInp.style.flex = "1";
    logoRow.appendChild(urlInp);
    frag.appendChild(logoRow);

    const fileGroup = document.createElement("div");
    fileGroup.className = "form-group";
    fileGroup.innerHTML = `
      <label class="file-label" for="edit-logo-file">📁 Nahrát ze souboru / fotky</label>
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
        const file = fi.files[0];
        if (!file) return;
        const fn = this.shadowRoot.getElementById("edit-logo-fn");
        if (fn) fn.textContent = file.name;
        const url = URL.createObjectURL(file);
        const color = await dominantColor(url);
        URL.revokeObjectURL(url);
        if (color && ci) ci.value = color;
      });
    }, 50);

    // Locations
    frag.appendChild(Object.assign(document.createElement("div"), {
      className: "section-title", textContent: "Lokace",
    }));
    const locList = document.createElement("ul");
    locList.className = "location-list";
    (store.locations || []).forEach((loc, i) => {
      const li = document.createElement("li");
      li.className = "location-item";
      li.innerHTML = `<span>${loc.label || "Pobočka"} (${loc.lat.toFixed(4)}, ${loc.lon.toFixed(4)}, ${loc.radius_m}m)</span>`;
      const db = document.createElement("button");
      db.className = "btn btn-danger";
      db.style.cssText = "padding:2px 8px;font-size:.75em;";
      db.textContent = "✕";
      db.addEventListener("click", async () => {
        await this._hass.callService("loyalty_cards", "delete_location", {
          store_id: store.id, location_index: i,
        });
        this._closeModal();
      });
      li.appendChild(db);
      locList.appendChild(li);
    });
    frag.appendChild(locList);

    // Location quick-fill buttons
    const locActions = document.createElement("div");
    locActions.className = "loc-actions";

    const gpsBtn = document.createElement("button");
    gpsBtn.className = "btn btn-secondary";
    gpsBtn.textContent = "📍 Moje poloha";
    gpsBtn.addEventListener("click", () => {
      if (!navigator.geolocation) { alert("Geolokace není v tomto prohlížeči dostupná."); return; }
      gpsBtn.textContent = "Načítám…";
      gpsBtn.disabled = true;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const la = this.shadowRoot.getElementById("loc-lat");
          const lo = this.shadowRoot.getElementById("loc-lon");
          if (la) la.value = pos.coords.latitude.toFixed(6);
          if (lo) lo.value = pos.coords.longitude.toFixed(6);
          gpsBtn.textContent = "📍 Moje poloha";
          gpsBtn.disabled = false;
        },
        () => {
          alert("Nepodařilo se získat polohu. Zkontrolujte povolení prohlížeče.");
          gpsBtn.textContent = "📍 Moje poloha";
          gpsBtn.disabled = false;
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
    locActions.appendChild(gpsBtn);

    const configuredTrackers = this._data?.settings?.device_trackers || [];
    if (configuredTrackers.length > 0) {
      const trackerBtn = document.createElement("button");
      trackerBtn.className = "btn btn-secondary";
      trackerBtn.textContent = "📡 Poloha trackeru";
      trackerBtn.addEventListener("click", () => {
        for (const t of configuredTrackers) {
          const st = this._hass.states[t];
          if (st?.attributes?.latitude) {
            const la = this.shadowRoot.getElementById("loc-lat");
            const lo = this.shadowRoot.getElementById("loc-lon");
            if (la) la.value = st.attributes.latitude.toFixed(6);
            if (lo) lo.value = st.attributes.longitude.toFixed(6);
            return;
          }
        }
        alert("Tracker zatím nemá dostupnou polohu GPS.");
      });
      locActions.appendChild(trackerBtn);
    }
    frag.appendChild(locActions);

    // Address search
    const addrRow = document.createElement("div");
    addrRow.className = "loc-addr-row form-group";
    addrRow.innerHTML = `
      <input type="text" id="loc-addr" placeholder="Hledat adresu, město, PSČ…" />
      <button class="btn btn-secondary" id="loc-search-btn" style="white-space:nowrap;flex-shrink:0;">Hledat</button>`;
    frag.appendChild(addrRow);

    const addrResults = document.createElement("div");
    addrResults.id = "loc-addr-results";
    addrResults.className = "loc-addr-results";
    addrResults.style.display = "none";
    frag.appendChild(addrResults);

    // Coordinates (filled automatically, still editable)
    const addLocDiv = document.createElement("div");
    addLocDiv.className = "form-group";
    addLocDiv.innerHTML = `
      <label>Souřadnice a poloměr</label>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        <input type="number" id="loc-lat" placeholder="Šířka" step="0.000001" style="flex:1;min-width:80px;" />
        <input type="number" id="loc-lon" placeholder="Délka" step="0.000001" style="flex:1;min-width:80px;" />
        <input type="number" id="loc-radius" placeholder="Poloměr (m)" value="300" style="flex:1;min-width:80px;" />
        <input type="text" id="loc-label" placeholder="Název pobočky" style="flex:2;min-width:120px;" />
      </div>`;
    frag.appendChild(addLocDiv);

    setTimeout(() => {
      const searchBtn = this.shadowRoot.getElementById("loc-search-btn");
      const addrInp = this.shadowRoot.getElementById("loc-addr");
      if (searchBtn && addrInp) {
        const doSearch = () => this._geocodeAddress(addrInp.value.trim());
        searchBtn.addEventListener("click", doSearch);
        addrInp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); doSearch(); } });
      }
    }, 50);

    // Cards list
    frag.appendChild(Object.assign(document.createElement("div"), {
      className: "section-title",
      textContent: `Karty (${(store.cards || []).length})`,
    }));
    const cardsList = document.createElement("ul");
    cardsList.className = "location-list";
    (store.cards || []).forEach((c, i) => {
      const li = document.createElement("li");
      li.className = "location-item";
      li.innerHTML = `<span>Karta ${i + 1} · ${c.barcode_type}${c.notes ? ` · ${c.notes}` : ""}</span>`;
      const db = document.createElement("button");
      db.className = "btn btn-danger";
      db.style.cssText = "padding:2px 8px;font-size:.75em;";
      db.textContent = "✕";
      db.addEventListener("click", async () => {
        if (confirm(`Smazat kartu ${i + 1}?`)) {
          await this._hass.callService("loyalty_cards", "delete_card", { card_id: c.id });
          this._closeModal();
        }
      });
      li.appendChild(db);
      cardsList.appendChild(li);
    });
    frag.appendChild(cardsList);

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
    saveBtn.className = "btn btn-primary";
    saveBtn.textContent = "Uložit";
    saveBtn.addEventListener("click", () => this._saveEditStore(store));
    btnRow.appendChild(delBtn);
    btnRow.appendChild(addCardBtn);
    btnRow.appendChild(saveBtn);
    frag.appendChild(btnRow);
    return frag;
  }

  async _saveEditStore(store) {
    const name = this.shadowRoot.getElementById("edit-name")?.value?.trim();
    const category = this.shadowRoot.getElementById("edit-category")?.value;
    const color = this.shadowRoot.getElementById("edit-color")?.value;

    await this._hass.callService("loyalty_cards", "update_store", {
      store_id: store.id,
      ...(name && { name }),
      ...(category && { category }),
      ...(color && { tile_color: color }),
    });

    const logoUrl = this.shadowRoot.getElementById("edit-logo-url")?.value?.trim();
    if (logoUrl) {
      await this._hass.callService("loyalty_cards", "download_logo", { store_id: store.id, url: logoUrl });
    }

    const fileInp = this.shadowRoot.getElementById("edit-logo-file");
    if (fileInp?.files?.length > 0) {
      await this._uploadLogoFile(store.id, fileInp.files[0]);
    }

    const lat = parseFloat(this.shadowRoot.getElementById("loc-lat")?.value);
    const lon = parseFloat(this.shadowRoot.getElementById("loc-lon")?.value);
    const radius = parseInt(this.shadowRoot.getElementById("loc-radius")?.value) || 300;
    const label = this.shadowRoot.getElementById("loc-label")?.value?.trim() || "";
    if (!isNaN(lat) && !isNaN(lon)) {
      await this._hass.callService("loyalty_cards", "add_location", {
        store_id: store.id, lat, lon, radius_m: radius, label,
      });
    }
    this._closeModal();
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
        resultsEl.style.display = "block";
        return;
      }
      resultsEl.innerHTML = "";
      for (const r of results) {
        const item = document.createElement("div");
        item.className = "loc-result-item";
        item.textContent = r.display_name;
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
    } finally {
      if (searchBtn) { searchBtn.textContent = "Hledat"; searchBtn.disabled = false; }
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

  // ── Add Card modal ──────────────────────────────────────────────────────────
  _buildAddCardModal() {
    const { store, prefill = {} } = this._modal;
    const cardCount = (store.cards || []).length;
    const frag = document.createDocumentFragment();

    const mh = document.createElement("div");
    mh.className = "modal-header";
    mh.innerHTML = `<span class="modal-title">Přidat kartu – ${store.name}</span><button class="close-btn">✕</button>`;
    mh.querySelector(".close-btn").addEventListener("click", () => this._closeModal());
    frag.appendChild(mh);

    frag.appendChild(this._makeField("Číslo / kód", `
      <input type="text" id="card-barcode" placeholder="Zadejte nebo naskenujte" value="${prefill.barcode || ""}" />`));

    // Scan via camera
    const scanRow = document.createElement("div");
    scanRow.className = "scan-row";
    const camBtn = document.createElement("button");
    camBtn.className = "scan-btn";
    camBtn.textContent = "📷 Naskenovat kamerou";
    camBtn.addEventListener("click", () => this._startLiveScanner(store));
    scanRow.appendChild(camBtn);
    frag.appendChild(scanRow);

    // Barcode type select
    const typeOpts = [
      ["EAN_13","EAN-13"], ["EAN_8","EAN-8"], ["CODE_128","Code 128"],
      ["CODE_39","Code 39"], ["QR_CODE","QR kód"], ["DATA_MATRIX","Data Matrix"],
      ["PDF_417","PDF-417"], ["AZTEC","Aztec"], ["ITF","ITF"], ["UPC_A","UPC-A"], ["UPC_E","UPC-E"],
    ];
    const selected = prefill.barcode_type || "CODE_128";
    frag.appendChild(this._makeField("Typ kódu", `
      <select id="card-type">
        ${typeOpts.map(([v, l]) => `<option value="${v}"${v === selected ? " selected" : ""}>${l}</option>`).join("")}
      </select>`));

    frag.appendChild(this._makeField("Poznámka (volitelná)", `
      <textarea id="card-notes" rows="2" placeholder=""></textarea>`));

    const btnRow = document.createElement("div");
    btnRow.className = "btn-row";
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn btn-secondary";
    cancelBtn.textContent = "Zrušit";
    cancelBtn.addEventListener("click", () => this._closeModal());
    const saveBtn = document.createElement("button");
    saveBtn.className = "btn btn-primary";
    saveBtn.textContent = "Přidat kartu";
    saveBtn.addEventListener("click", () => this._saveNewCard(store, cardCount));
    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(saveBtn);
    frag.appendChild(btnRow);
    return frag;
  }

  async _saveNewCard(store, cardIndex) {
    const barcode = this.shadowRoot.getElementById("card-barcode")?.value?.trim();
    if (!barcode) { alert("Zadejte číslo karty."); return; }
    const type = this.shadowRoot.getElementById("card-type")?.value || "CODE_128";
    const notes = this.shadowRoot.getElementById("card-notes")?.value?.trim() || "";
    await this._hass.callService("loyalty_cards", "add_card", {
      store_id: store.id,
      name: `Karta ${cardIndex + 1}`,
      barcode,
      barcode_type: type,
      notes,
    });
    this._closeModal();
  }

  // ── Scanner – live camera (on document.body to bypass shadow DOM) ──────────
  _startLiveScanner(store) {
    const readerId = "lc-scanner-reader";
    const overlay = document.createElement("div");
    overlay.id = "lc-scanner-overlay";
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:10000;background:#000;display:flex;flex-direction:column;";

    const header = document.createElement("div");
    header.style.cssText =
      "display:flex;justify-content:space-between;align-items:center;padding:16px;color:#fff;flex-shrink:0;";
    header.innerHTML = `
      <span style="font-size:1.1em;font-weight:600;">Skenování</span>
      <button id="lc-close-scan" style="background:none;border:none;color:#fff;font-size:1.8em;cursor:pointer;padding:0;">✕</button>`;
    overlay.appendChild(header);

    const readerDiv = document.createElement("div");
    readerDiv.id = readerId;
    readerDiv.style.cssText = "flex:1;overflow:hidden;";
    overlay.appendChild(readerDiv);

    const hint = document.createElement("p");
    hint.style.cssText = "color:#aaa;text-align:center;font-size:.85em;padding:12px;flex-shrink:0;margin:0;";
    hint.textContent = "Namiřte kameru na čárový nebo QR kód.";
    overlay.appendChild(hint);

    document.body.appendChild(overlay);

    document.getElementById("lc-close-scan").addEventListener("click", () => {
      this._stopLiveScanner();
    });

    try {
      this._scanner = new Html5Qrcode(readerId, { verbose: false });
      this._scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (text, result) => {
            const type = this._mapScanFormat(result?.result?.format?.formatName);
            this._stopLiveScanner();
            this._modal = { type: "add_card", store, prefill: { barcode: text, barcode_type: type } };
            this._render();
          }
        )
        .catch(() => {
          hint.textContent = "Kamera nedostupná nebo zakázaná.";
        });
    } catch {
      this._stopLiveScanner();
    }
  }

  _stopLiveScanner() {
    const overlay = document.getElementById("lc-scanner-overlay");
    const scanner = this._scanner;
    this._scanner = null;
    if (scanner) scanner.stop().catch(() => {});
    if (overlay?.parentNode) overlay.parentNode.removeChild(overlay);
  }

  // ── Scanner – from file (also on document.body to bypass shadow DOM) ───────
  async _scanFromFile(file) {
    const tempId = "lc-temp-" + Date.now();
    const tempDiv = document.createElement("div");
    tempDiv.id = tempId;
    // Needs dimensions in DOM for canvas rendering — use off-screen, not display:none
    tempDiv.style.cssText = "position:fixed;left:-9999px;top:0;width:300px;height:300px;visibility:hidden;";
    document.body.appendChild(tempDiv);

    try {
      const scanner = new Html5Qrcode(tempId);
      let text, formatName;
      if (typeof scanner.scanFileV2 === "function") {
        try {
          const result = await scanner.scanFileV2(file, false);
          text = result.decodedText;
          formatName = result.result?.format?.formatName;
        } catch {
          text = await scanner.scanFile(file, false);
        }
      } else {
        text = await scanner.scanFile(file, false);
      }
      if (text) {
        const barcodeInp = this.shadowRoot.getElementById("card-barcode");
        const typeSelect = this.shadowRoot.getElementById("card-type");
        if (barcodeInp) barcodeInp.value = text;
        if (typeSelect && formatName) typeSelect.value = this._mapScanFormat(formatName);
      }
    } catch {
      alert("Kód se nepodařilo přečíst. Zkuste jiný obrázek.");
    } finally {
      if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv);
    }
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

  // ── Helpers ─────────────────────────────────────────────────────────────────
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

  static getConfigElement() {
    return document.createElement("loyalty-cards-card-editor");
  }

  static getStubConfig() { return {}; }
}

// ── Card editor (visual config in Lovelace UI) ───────────────────────────────
class LoyaltyCardsCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

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
      this.dispatchEvent(new CustomEvent("config-changed", {
        detail: { config: cfg }, bubbles: true, composed: true,
      }));
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
