import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import { Html5Qrcode } from "html5-qrcode";

// ── Czech store catalogue ───────────────────────────────────────────────────
const CZECH_STORES = [
  { name: "Albert", category: "groceries" },
  { name: "Billa", category: "groceries" },
  { name: "Kaufland", category: "groceries" },
  { name: "Lidl", category: "groceries" },
  { name: "Penny", category: "groceries" },
  { name: "Tesco", category: "groceries" },
  { name: "Globus", category: "groceries" },
  { name: "Coop", category: "groceries" },
  { name: "Norma", category: "groceries" },
  { name: "dm", category: "drugstore" },
  { name: "Rossmann", category: "drugstore" },
  { name: "Teta", category: "drugstore" },
  { name: "Dr. Max", category: "pharmacy" },
  { name: "Benu", category: "pharmacy" },
  { name: "Pilulka", category: "pharmacy" },
  { name: "OBI", category: "diy" },
  { name: "Bauhaus", category: "diy" },
  { name: "Hornbach", category: "diy" },
  { name: "Alza", category: "electronics" },
  { name: "CZC", category: "electronics" },
  { name: "Datart", category: "electronics" },
  { name: "Decathlon", category: "sport" },
  { name: "Sportisimo", category: "sport" },
  { name: "Hervis", category: "sport" },
  { name: "H&M", category: "fashion" },
  { name: "Zara", category: "fashion" },
  { name: "Reserved", category: "fashion" },
  { name: "Primark", category: "fashion" },
  { name: "CCC", category: "fashion" },
  { name: "Deichmann", category: "fashion" },
  { name: "Pepco", category: "fashion" },
  { name: "McDonald's", category: "fastfood" },
  { name: "KFC", category: "fastfood" },
  { name: "Burger King", category: "fastfood" },
  { name: "Subway", category: "fastfood" },
  { name: "Pizza Hut", category: "fastfood" },
  { name: "Starbucks", category: "fastfood" },
  { name: "Costa Coffee", category: "fastfood" },
  { name: "IKEA", category: "other" },
  { name: "Okay", category: "other" },
  { name: "Tchibo", category: "other" },
  { name: "Flying Tiger", category: "other" },
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

// Haversine distance in metres
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

// ── Styles ──────────────────────────────────────────────────────────────────
const STYLES = `
  :host { display: block; font-family: var(--paper-font-body1_-_font-family, sans-serif); }
  .card-root { background: var(--card-background-color, #fff); border-radius: 12px; overflow: hidden; }
  .header { padding: 16px 16px 0; display: flex; justify-content: space-between; align-items: center; }
  .header h2 { margin: 0; font-size: 1.1em; font-weight: 600; color: var(--primary-text-color); }
  .tabs { display: flex; gap: 4px; padding: 8px 16px; border-bottom: 1px solid var(--divider-color, #e0e0e0); overflow-x: auto; }
  .tab { padding: 6px 14px; border-radius: 20px; cursor: pointer; font-size: 0.85em; white-space: nowrap;
         color: var(--secondary-text-color); border: none; background: none; }
  .tab.active { background: var(--primary-color, #1976d2); color: #fff; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 12px 16px 16px; }
  @media (min-width: 600px) { .grid { grid-template-columns: repeat(3, 1fr); } }
  @media (min-width: 900px) { .grid { grid-template-columns: repeat(4, 1fr); } }
  .tile { border-radius: 10px; cursor: pointer; overflow: hidden; transition: transform 0.15s, box-shadow 0.15s;
           display: flex; flex-direction: column; align-items: center; padding: 14px 8px 10px; gap: 8px;
           box-shadow: 0 1px 4px rgba(0,0,0,.12); }
  .tile:hover { transform: scale(1.03); box-shadow: 0 4px 12px rgba(0,0,0,.2); }
  .tile-logo { width: 56px; height: 56px; border-radius: 8px; object-fit: contain; background: rgba(255,255,255,.25); }
  .tile-initials { width: 56px; height: 56px; border-radius: 8px; display: flex; align-items: center;
                   justify-content: center; font-size: 1.4em; font-weight: 700; color: #fff;
                   background: rgba(0,0,0,.2); }
  .tile-name { font-size: 0.78em; font-weight: 600; text-align: center; color: #fff;
               text-shadow: 0 1px 2px rgba(0,0,0,.4); line-height: 1.2; }
  .tile-badge { font-size: 0.68em; color: rgba(255,255,255,.8); }
  .fab { position: absolute; bottom: 16px; right: 16px; width: 48px; height: 48px; border-radius: 50%;
         background: var(--primary-color, #1976d2); color: #fff; border: none; font-size: 1.8em;
         cursor: pointer; display: flex; align-items: center; justify-content: center;
         box-shadow: 0 4px 12px rgba(0,0,0,.3); }
  .grid-wrap { position: relative; min-height: 80px; }
  .empty { padding: 24px; text-align: center; color: var(--secondary-text-color); font-size: 0.9em; }

  /* ── Modal overlay ── */
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

  /* ── Barcode display ── */
  .barcode-wrap { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 8px 0; }
  .barcode-wrap svg, .barcode-wrap canvas { max-width: 100%; }
  .barcode-value { font-size: 0.85em; color: var(--secondary-text-color); letter-spacing: 1px; }
  .card-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }
  .card-tab { padding: 4px 12px; border-radius: 16px; cursor: pointer; font-size: 0.8em;
              border: 1px solid var(--divider-color, #e0e0e0); background: none; }
  .card-tab.active { background: var(--primary-color, #1976d2); color: #fff; border-color: transparent; }
  .fullscreen-btn { background: var(--primary-color, #1976d2); color: #fff; border: none; border-radius: 8px;
                    padding: 10px 20px; cursor: pointer; font-size: 0.9em; }

  /* ── Add / edit forms ── */
  .form-group { margin-bottom: 14px; }
  label { display: block; font-size: 0.82em; color: var(--secondary-text-color); margin-bottom: 4px; }
  input[type=text], input[type=number], select, textarea {
    width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 6px;
    border: 1px solid var(--divider-color, #ccc); background: var(--card-background-color, #fff);
    color: var(--primary-text-color); font-size: 0.9em; }
  .color-row { display: flex; gap: 8px; align-items: center; }
  input[type=color] { width: 40px; height: 36px; padding: 2px; border-radius: 6px; border: 1px solid var(--divider-color,#ccc); }
  .btn-row { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
  .btn { padding: 9px 18px; border-radius: 8px; border: none; cursor: pointer; font-size: 0.9em; }
  .btn-primary { background: var(--primary-color, #1976d2); color: #fff; }
  .btn-danger { background: #d32f2f; color: #fff; }
  .btn-secondary { background: var(--secondary-background-color, #f5f5f5); color: var(--primary-text-color); }
  .scan-btn { width: 100%; padding: 12px; background: var(--secondary-background-color,#f0f0f0);
              border: 2px dashed var(--divider-color,#ccc); border-radius: 8px; cursor: pointer; font-size: 0.9em; }
  #reader { width: 100%; border-radius: 8px; overflow: hidden; margin-top: 8px; }
  .logo-section { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .logo-preview { width: 48px; height: 48px; object-fit: contain; border-radius: 6px; border: 1px solid var(--divider-color,#ccc); }
  .section-title { font-weight: 600; color: var(--primary-text-color); margin: 16px 0 8px; font-size: 0.9em; }
  .store-suggestions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
  .suggestion-chip { padding: 4px 10px; border-radius: 14px; background: var(--secondary-background-color,#f0f0f0);
                     cursor: pointer; font-size: 0.8em; border: none; }
  .location-list { list-style: none; padding: 0; margin: 0; }
  .location-item { display: flex; justify-content: space-between; align-items: center;
                   padding: 6px 0; border-bottom: 1px solid var(--divider-color,#e0e0e0); font-size: 0.85em; }
  .nearby-badge { font-size: 0.7em; background: #43a047; color: #fff; border-radius: 10px; padding: 2px 7px; }
`;

// ── Main custom element ──────────────────────────────────────────────────────
class LoyaltyCardsCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._data = null;
    this._hass = null;
    this._activeTab = "all";
    this._activeCategory = null;
    this._modal = null; // { type: 'barcode'|'add_store'|'add_card'|'edit_store'|'scan', payload }
    this._scanner = null;
    this._unsubscribe = null;
    this._nearbyStoreIds = new Set();
    this._proximityTimer = {};
    this._notificationSent = new Set();
  }

  set hass(hass) {
    this._hass = hass;
    this._updateNearby();
    if (!this._data) this._loadData();
    else this._render();
  }

  setConfig(config) {
    this._config = config || {};
  }

  connectedCallback() {
    this._subscribe();
  }

  disconnectedCallback() {
    this._unsubscribeBus?.();
    this._stopScanner();
  }

  _subscribe() {
    if (!this._hass || this._unsubscribeBus) return;
    this._unsubscribeBus = this._hass.connection.subscribeEvents(
      () => this._loadData(),
      "loyalty_cards_updated"
    );
  }

  async _loadData() {
    if (!this._hass) return;
    try {
      const result = await this._hass.callWS({ type: "loyalty_cards/get_data" });
      this._data = result;
      this._updateNearby();
      this._render();
      if (!this._unsubscribeBus) this._subscribe();
    } catch (e) {
      this._data = null;
      this._renderError("Nepodařilo se načíst data. Je integrace Věrnostní karty nainstalována?");
    }
  }

  _updateNearby() {
    if (!this._hass || !this._data) return;
    const settings = this._data.settings || {};
    const trackers = settings.device_trackers || [];
    const globalR = settings.global_proximity_m ?? 300;
    const stores = this._data.stores || [];

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
          const d = distanceM(userLat, userLon, loc.lat, loc.lon);
          const r = Math.max(loc.radius_m ?? globalR, globalR);
          if (d <= r) {
            nearby.add(store.id);
            this._handleNearbyNotification(store, settings);
          }
        }
      }
    }
    this._nearbyStoreIds = nearby;
  }

  _handleNearbyNotification(store, settings) {
    if (!settings.notifications_enabled) return;
    if (this._notificationSent.has(store.id)) return;
    const dwellMs = (settings.notification_dwell_minutes ?? 7) * 60 * 1000;
    if (!this._proximityTimer[store.id]) {
      this._proximityTimer[store.id] = setTimeout(() => {
        if (this._nearbyStoreIds.has(store.id) && !this._notificationSent.has(store.id)) {
          this._notificationSent.add(store.id);
          this._hass?.callService("notify", "persistent_notification", {
            title: "Věrnostní karta",
            message: `Jste u obchodu ${store.name}. Nezapomeňte na věrnostní kartu!`,
          }).catch(() => {});
        }
        delete this._proximityTimer[store.id];
      }, dwellMs);
    }
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

    const header = document.createElement("div");
    header.className = "header";
    header.innerHTML = `<h2>Věrnostní karty</h2>`;
    wrap.appendChild(header);

    wrap.appendChild(this._buildTabs());

    const gridWrap = document.createElement("div");
    gridWrap.className = "grid-wrap";
    gridWrap.appendChild(this._buildGrid());

    const fab = document.createElement("button");
    fab.className = "fab";
    fab.title = "Přidat obchod";
    fab.textContent = "+";
    fab.addEventListener("click", () => this._openModal({ type: "add_store" }));
    gridWrap.appendChild(fab);

    wrap.appendChild(gridWrap);
    root.appendChild(wrap);

    if (this._modal) {
      root.appendChild(this._buildModal());
    }
  }

  _buildTabs() {
    const tabs = document.createElement("div");
    tabs.className = "tabs";

    const tabDefs = [
      { key: "all", label: "Vše" },
      { key: "nearby", label: `Poblíž ${this._nearbyStoreIds.size > 0 ? `(${this._nearbyStoreIds.size})` : ""}` },
      ...Object.entries(CATEGORY_LABELS).map(([k, v]) => ({ key: `cat:${k}`, label: v })),
    ];

    for (const { key, label } of tabDefs) {
      const btn = document.createElement("button");
      btn.className = "tab" + (this._activeTab === key ? " active" : "");
      btn.textContent = label;
      btn.addEventListener("click", () => {
        this._activeTab = key;
        this._render();
      });
      tabs.appendChild(btn);
    }
    return tabs;
  }

  _buildGrid() {
    const stores = this._data.stores || [];
    let filtered = stores;

    if (this._activeTab === "nearby") {
      filtered = stores.filter((s) => this._nearbyStoreIds.has(s.id));
    } else if (this._activeTab.startsWith("cat:")) {
      const cat = this._activeTab.slice(4);
      filtered = stores.filter((s) => s.category === cat);
    }

    const grid = document.createElement("div");
    grid.className = "grid";

    if (filtered.length === 0) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.style.gridColumn = "1/-1";
      empty.textContent =
        this._activeTab === "nearby"
          ? "Žádné obchody poblíž. Zkontrolujte nastavení polohování."
          : "Žádné karty. Přidejte první kliknutím na +";
      grid.appendChild(empty);
      return grid;
    }

    for (const store of filtered) {
      grid.appendChild(this._buildTile(store));
    }
    return grid;
  }

  _buildTile(store) {
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.style.background = store.tile_color || "#1976d2";

    if (store.logo_path) {
      const img = document.createElement("img");
      img.className = "tile-logo";
      img.src = store.logo_path;
      img.alt = store.name;
      img.onerror = () => {
        img.replaceWith(this._buildInitials(store.name));
      };
      tile.appendChild(img);
    } else {
      tile.appendChild(this._buildInitials(store.name));
    }

    const name = document.createElement("div");
    name.className = "tile-name";
    name.textContent = store.name;
    tile.appendChild(name);

    const cardCount = (store.cards || []).length;
    if (cardCount > 0) {
      const badge = document.createElement("div");
      badge.className = "tile-badge";
      badge.textContent = `${cardCount} kart${cardCount === 1 ? "a" : cardCount < 5 ? "y" : ""}`;
      tile.appendChild(badge);
    }

    tile.addEventListener("click", () => {
      if ((store.cards || []).length === 0) {
        this._openModal({ type: "add_card", store });
      } else {
        this._openModal({ type: "barcode", store, cardIndex: 0 });
      }
    });

    tile.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this._openModal({ type: "edit_store", store });
    });

    return tile;
  }

  _buildInitials(name) {
    const el = document.createElement("div");
    el.className = "tile-initials";
    el.textContent = initials(name);
    return el;
  }

  // ── Modal router ────────────────────────────────────────────────────────────
  _openModal(modal) {
    this._modal = modal;
    this._render();
  }

  _closeModal() {
    this._modal = null;
    this._stopScanner();
    this._render();
  }

  _buildModal() {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) this._closeModal();
    });

    const inner = document.createElement("div");
    inner.className = "modal";

    switch (this._modal.type) {
      case "barcode": inner.appendChild(this._buildBarcodeModal()); break;
      case "add_store": inner.appendChild(this._buildAddStoreModal()); break;
      case "edit_store": inner.appendChild(this._buildEditStoreModal()); break;
      case "add_card": inner.appendChild(this._buildAddCardModal()); break;
      case "scan": inner.appendChild(this._buildScanModal()); break;
    }

    overlay.appendChild(inner);
    return overlay;
  }

  // ── Barcode display modal ───────────────────────────────────────────────────
  _buildBarcodeModal() {
    const { store, cardIndex } = this._modal;
    const cards = store.cards || [];
    const card = cards[cardIndex] || cards[0];

    const frag = document.createDocumentFragment();

    const mh = document.createElement("div");
    mh.className = "modal-header";
    mh.innerHTML = `
      <span class="modal-title">${store.name}</span>
      <button class="close-btn" title="Zavřít">✕</button>
    `;
    mh.querySelector(".close-btn").addEventListener("click", () => this._closeModal());
    frag.appendChild(mh);

    if (cards.length > 1) {
      const tabRow = document.createElement("div");
      tabRow.className = "card-tabs";
      cards.forEach((c, i) => {
        const t = document.createElement("button");
        t.className = "card-tab" + (i === cardIndex ? " active" : "");
        t.textContent = c.name;
        t.addEventListener("click", () => {
          this._modal.cardIndex = i;
          this._render();
        });
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
        svg.style.maxWidth = "100%";
        wrap.appendChild(svg);
        setTimeout(() => {
          const svgEl = this.shadowRoot.getElementById("barcode-svg");
          if (svgEl) {
            try {
              JsBarcode(svgEl, card.barcode, {
                format: card.barcode_type?.replace("_", "") || "CODE128",
                lineColor: "#000",
                background: "#fff",
                displayValue: true,
                fontSize: 14,
                margin: 10,
              });
            } catch (e) {
              svgEl.outerHTML = `<p style="color:red;font-size:.8em">Nelze zobrazit čárový kód: ${e.message}</p>`;
            }
          }
        }, 50);
      }

      const val = document.createElement("div");
      val.className = "barcode-value";
      val.textContent = card.barcode;
      wrap.appendChild(val);
    }

    frag.appendChild(wrap);

    const btnRow = document.createElement("div");
    btnRow.className = "btn-row";

    const addCardBtn = document.createElement("button");
    addCardBtn.className = "btn btn-secondary";
    addCardBtn.textContent = "+ Přidat kartu";
    addCardBtn.addEventListener("click", () => this._openModal({ type: "add_card", store }));
    btnRow.appendChild(addCardBtn);

    const editBtn = document.createElement("button");
    editBtn.className = "btn btn-secondary";
    editBtn.textContent = "Nastavení obchodu";
    editBtn.addEventListener("click", () => this._openModal({ type: "edit_store", store }));
    btnRow.appendChild(editBtn);

    const fsBtn = document.createElement("button");
    fsBtn.className = "btn btn-primary fullscreen-btn";
    fsBtn.textContent = "Celá obrazovka";
    fsBtn.addEventListener("click", () => this._openFullscreen(card));
    btnRow.appendChild(fsBtn);

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
      if (screen.orientation?.unlock) screen.orientation.unlock().catch(() => {});
    });
    fs.appendChild(close);

    if (card.barcode_type === "QR_CODE") {
      const qrCanvas = document.createElement("canvas");
      fs.appendChild(qrCanvas);
      QRCode.toCanvas(qrCanvas, card.barcode, { width: 260, margin: 2 }).catch(() => {});
    } else {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.style.maxWidth = "90vw";
      fs.appendChild(svg);
      try {
        JsBarcode(svg, card.barcode, {
          format: card.barcode_type?.replace("_", "") || "CODE128",
          lineColor: "#000",
          background: "#fff",
          displayValue: true,
          fontSize: 16,
          width: 3,
          height: 120,
          margin: 16,
        });
      } catch (e) {}
    }

    const val = document.createElement("div");
    val.style.cssText = "font-size:1.1em;letter-spacing:2px;color:#333;";
    val.textContent = card.barcode;
    fs.appendChild(val);

    document.body.appendChild(fs);

    // Max brightness hint
    if (screen.orientation?.lock) {
      screen.orientation.lock("portrait").catch(() => {});
    }
  }

  // ── Add Store modal ─────────────────────────────────────────────────────────
  _buildAddStoreModal() {
    const frag = document.createDocumentFragment();

    const mh = document.createElement("div");
    mh.className = "modal-header";
    mh.innerHTML = `<span class="modal-title">Přidat obchod</span><button class="close-btn">✕</button>`;
    mh.querySelector(".close-btn").addEventListener("click", () => this._closeModal());
    frag.appendChild(mh);

    const nameGroup = document.createElement("div");
    nameGroup.className = "form-group";
    nameGroup.innerHTML = `<label>Název obchodu</label><input type="text" id="store-name" placeholder="např. Albert" />`;
    frag.appendChild(nameGroup);

    const suggestLabel = document.createElement("div");
    suggestLabel.className = "section-title";
    suggestLabel.textContent = "Rychlý výběr:";
    frag.appendChild(suggestLabel);

    const suggestions = document.createElement("div");
    suggestions.className = "store-suggestions";
    for (const s of CZECH_STORES) {
      const chip = document.createElement("button");
      chip.className = "suggestion-chip";
      chip.textContent = s.name;
      chip.addEventListener("click", () => {
        frag.getElementById?.("store-name")?.value;
        const inp = this.shadowRoot.getElementById("store-name");
        if (inp) inp.value = s.name;
        const sel = this.shadowRoot.getElementById("store-category");
        if (sel) sel.value = s.category;
      });
      suggestions.appendChild(chip);
    }
    frag.appendChild(suggestions);

    const catGroup = document.createElement("div");
    catGroup.className = "form-group";
    catGroup.innerHTML = `
      <label>Kategorie</label>
      <select id="store-category">
        ${Object.entries(CATEGORY_LABELS).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}
      </select>`;
    frag.appendChild(catGroup);

    const colorGroup = document.createElement("div");
    colorGroup.className = "form-group";
    colorGroup.innerHTML = `
      <label>Barva dlaždice</label>
      <div class="color-row">
        <input type="color" id="store-color" value="#1976d2" />
        <span style="font-size:.85em;color:var(--secondary-text-color)">Barva pozadí dlaždice</span>
      </div>`;
    frag.appendChild(colorGroup);

    const logoGroup = document.createElement("div");
    logoGroup.className = "form-group";
    logoGroup.innerHTML = `
      <label>Logo (volitelné)</label>
      <input type="text" id="store-logo-url" placeholder="URL obrázku loga" />`;
    frag.appendChild(logoGroup);

    const btnRow = document.createElement("div");
    btnRow.className = "btn-row";
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn btn-secondary";
    cancelBtn.textContent = "Zrušit";
    cancelBtn.addEventListener("click", () => this._closeModal());
    const saveBtn = document.createElement("button");
    saveBtn.className = "btn btn-primary";
    saveBtn.textContent = "Přidat obchod";
    saveBtn.addEventListener("click", () => this._saveNewStore());
    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(saveBtn);
    frag.appendChild(btnRow);

    return frag;
  }

  async _saveNewStore() {
    const name = this.shadowRoot.getElementById("store-name")?.value?.trim();
    if (!name) return;
    const category = this.shadowRoot.getElementById("store-category")?.value || "other";
    const color = this.shadowRoot.getElementById("store-color")?.value || "#1976d2";
    const logoUrl = this.shadowRoot.getElementById("store-logo-url")?.value?.trim();

    await this._hass.callService("loyalty_cards", "add_store", { name, category, tile_color: color });

    if (logoUrl) {
      const stores = await this._hass.callWS({ type: "loyalty_cards/get_data" });
      const newStore = (stores.stores || []).find((s) => s.name === name);
      if (newStore) {
        await this._hass.callService("loyalty_cards", "download_logo", { store_id: newStore.id, url: logoUrl });
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

    const nameGroup = document.createElement("div");
    nameGroup.className = "form-group";
    nameGroup.innerHTML = `<label>Název</label><input type="text" id="edit-name" value="${store.name}" />`;
    frag.appendChild(nameGroup);

    const catGroup = document.createElement("div");
    catGroup.className = "form-group";
    catGroup.innerHTML = `
      <label>Kategorie</label>
      <select id="edit-category">
        ${Object.entries(CATEGORY_LABELS).map(([k, v]) =>
          `<option value="${k}"${k === store.category ? " selected" : ""}>${v}</option>`
        ).join("")}
      </select>`;
    frag.appendChild(catGroup);

    const colorGroup = document.createElement("div");
    colorGroup.className = "form-group";
    colorGroup.innerHTML = `
      <label>Barva dlaždice</label>
      <div class="color-row">
        <input type="color" id="edit-color" value="${store.tile_color || "#1976d2"}" />
      </div>`;
    frag.appendChild(colorGroup);

    // Logo management
    const logoSection = document.createElement("div");
    logoSection.className = "section-title";
    logoSection.textContent = "Logo";
    frag.appendChild(logoSection);

    const logoGroup = document.createElement("div");
    logoGroup.className = "form-group logo-section";
    if (store.logo_path) {
      logoGroup.innerHTML += `<img class="logo-preview" src="${store.logo_path}" alt="Logo" />`;
    }
    logoGroup.innerHTML += `<input type="text" id="edit-logo-url" placeholder="URL nového loga" style="flex:1;" />`;
    frag.appendChild(logoGroup);

    const logoFileGroup = document.createElement("div");
    logoFileGroup.className = "form-group";
    logoFileGroup.innerHTML = `
      <label>Nebo nahrát ze souboru / fotky</label>
      <input type="file" id="edit-logo-file" accept="image/*" />`;
    frag.appendChild(logoFileGroup);

    // Locations
    const locSection = document.createElement("div");
    locSection.className = "section-title";
    locSection.textContent = "Lokace";
    frag.appendChild(locSection);

    const locList = document.createElement("ul");
    locList.className = "location-list";
    (store.locations || []).forEach((loc, i) => {
      const li = document.createElement("li");
      li.className = "location-item";
      li.innerHTML = `
        <span>${loc.label || "Pobočka"} (${loc.lat.toFixed(4)}, ${loc.lon.toFixed(4)}, ${loc.radius_m}m)</span>
        <button class="btn btn-danger" style="padding:2px 8px;font-size:.75em;" data-idx="${i}">✕</button>`;
      li.querySelector("button").addEventListener("click", async () => {
        await this._hass.callService("loyalty_cards", "delete_location", {
          store_id: store.id,
          location_index: i,
        });
        this._closeModal();
      });
      locList.appendChild(li);
    });
    frag.appendChild(locList);

    const addLocGroup = document.createElement("div");
    addLocGroup.className = "form-group";
    addLocGroup.innerHTML = `
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        <input type="number" id="loc-lat" placeholder="Šířka" step="0.000001" style="flex:1;min-width:80px;" />
        <input type="number" id="loc-lon" placeholder="Délka" step="0.000001" style="flex:1;min-width:80px;" />
        <input type="number" id="loc-radius" placeholder="Poloměr (m)" value="300" style="flex:1;min-width:80px;" />
        <input type="text" id="loc-label" placeholder="Název pobočky" style="flex:2;min-width:120px;" />
      </div>`;
    frag.appendChild(addLocGroup);

    const useGpsBtn = document.createElement("button");
    useGpsBtn.className = "btn btn-secondary";
    useGpsBtn.style.marginBottom = "8px";
    useGpsBtn.textContent = "Použít aktuální polohu trackeru";
    useGpsBtn.addEventListener("click", () => {
      const trackers = this._data?.settings?.device_trackers || [];
      for (const t of trackers) {
        const st = this._hass.states[t];
        if (st?.attributes?.latitude) {
          this.shadowRoot.getElementById("loc-lat").value = st.attributes.latitude.toFixed(6);
          this.shadowRoot.getElementById("loc-lon").value = st.attributes.longitude.toFixed(6);
          break;
        }
      }
    });
    frag.appendChild(useGpsBtn);

    // Cards list
    const cardsSection = document.createElement("div");
    cardsSection.className = "section-title";
    cardsSection.textContent = `Karty (${(store.cards || []).length})`;
    frag.appendChild(cardsSection);

    const cardsList = document.createElement("ul");
    cardsList.className = "location-list";
    (store.cards || []).forEach((c) => {
      const li = document.createElement("li");
      li.className = "location-item";
      li.innerHTML = `
        <span>${c.name} · ${c.barcode_type}</span>
        <button class="btn btn-danger" style="padding:2px 8px;font-size:.75em;">✕</button>`;
      li.querySelector("button").addEventListener("click", async () => {
        if (confirm(`Smazat kartu „${c.name}"?`)) {
          await this._hass.callService("loyalty_cards", "delete_card", { card_id: c.id });
          this._closeModal();
        }
      });
      cardsList.appendChild(li);
    });
    frag.appendChild(cardsList);

    const btnRow = document.createElement("div");
    btnRow.className = "btn-row";

    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-danger";
    delBtn.textContent = "Smazat obchod";
    delBtn.addEventListener("click", async () => {
      if (confirm(`Smazat obchod „${store.name}" a všechny jeho karty?`)) {
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

    const fileInput = this.shadowRoot.getElementById("edit-logo-file");
    if (fileInput?.files?.length > 0) {
      await this._uploadLogoFile(store.id, fileInput.files[0]);
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

  async _uploadLogoFile(storeId, file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        await this._hass.callService("loyalty_cards", "upload_logo", {
          store_id: storeId,
          data_url: e.target.result,
        });
        resolve();
      };
      reader.readAsDataURL(file);
    });
  }

  // ── Add Card modal ──────────────────────────────────────────────────────────
  _buildAddCardModal() {
    const { store } = this._modal;
    const frag = document.createDocumentFragment();

    const mh = document.createElement("div");
    mh.className = "modal-header";
    mh.innerHTML = `<span class="modal-title">Přidat kartu – ${store.name}</span><button class="close-btn">✕</button>`;
    mh.querySelector(".close-btn").addEventListener("click", () => this._closeModal());
    frag.appendChild(mh);

    const nameGroup = document.createElement("div");
    nameGroup.className = "form-group";
    nameGroup.innerHTML = `<label>Název karty</label><input type="text" id="card-name" value="Moje karta" />`;
    frag.appendChild(nameGroup);

    const barcodeGroup = document.createElement("div");
    barcodeGroup.className = "form-group";
    barcodeGroup.innerHTML = `<label>Číslo / kód</label><input type="text" id="card-barcode" placeholder="Zadejte nebo naskenujte" />`;
    frag.appendChild(barcodeGroup);

    const scanBtn = document.createElement("button");
    scanBtn.className = "scan-btn";
    scanBtn.textContent = "📷  Naskenovat kamerou nebo vybrat obrázek";
    scanBtn.addEventListener("click", () => this._openModal({ type: "scan", store }));
    frag.appendChild(scanBtn);

    const typeGroup = document.createElement("div");
    typeGroup.className = "form-group";
    typeGroup.innerHTML = `
      <label>Typ kódu</label>
      <select id="card-type">
        <option value="EAN_13">EAN-13</option>
        <option value="EAN_8">EAN-8</option>
        <option value="CODE_128" selected>Code 128</option>
        <option value="CODE_39">Code 39</option>
        <option value="QR_CODE">QR kód</option>
        <option value="DATA_MATRIX">Data Matrix</option>
        <option value="PDF_417">PDF-417</option>
        <option value="AZTEC">Aztec</option>
        <option value="ITF">ITF</option>
        <option value="UPC_A">UPC-A</option>
        <option value="UPC_E">UPC-E</option>
      </select>`;
    frag.appendChild(typeGroup);

    const notesGroup = document.createElement("div");
    notesGroup.className = "form-group";
    notesGroup.innerHTML = `<label>Poznámka</label><textarea id="card-notes" rows="2" placeholder="Volitelná poznámka"></textarea>`;
    frag.appendChild(notesGroup);

    const btnRow = document.createElement("div");
    btnRow.className = "btn-row";
    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn btn-secondary";
    cancelBtn.textContent = "Zrušit";
    cancelBtn.addEventListener("click", () => this._closeModal());
    const saveBtn = document.createElement("button");
    saveBtn.className = "btn btn-primary";
    saveBtn.textContent = "Přidat kartu";
    saveBtn.addEventListener("click", () => this._saveNewCard(store));
    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(saveBtn);
    frag.appendChild(btnRow);

    return frag;
  }

  async _saveNewCard(store) {
    const barcode = this.shadowRoot.getElementById("card-barcode")?.value?.trim();
    if (!barcode) { alert("Zadejte číslo karty."); return; }
    const name = this.shadowRoot.getElementById("card-name")?.value?.trim() || "Karta";
    const type = this.shadowRoot.getElementById("card-type")?.value || "CODE_128";
    const notes = this.shadowRoot.getElementById("card-notes")?.value?.trim() || "";

    await this._hass.callService("loyalty_cards", "add_card", {
      store_id: store.id, name, barcode, barcode_type: type, notes,
    });
    this._closeModal();
  }

  // ── Scanner modal ───────────────────────────────────────────────────────────
  _buildScanModal() {
    const { store } = this._modal;
    const frag = document.createDocumentFragment();

    const mh = document.createElement("div");
    mh.className = "modal-header";
    mh.innerHTML = `<span class="modal-title">Skenovat kód</span><button class="close-btn">✕</button>`;
    mh.querySelector(".close-btn").addEventListener("click", () => {
      this._stopScanner();
      this._openModal({ type: "add_card", store });
    });
    frag.appendChild(mh);

    const info = document.createElement("p");
    info.style.cssText = "font-size:.85em;color:var(--secondary-text-color);margin:0 0 12px;";
    info.textContent = "Nasměrujte kameru na čárový nebo QR kód, nebo vyberte obrázek ze souboru.";
    frag.appendChild(info);

    const reader = document.createElement("div");
    reader.id = "reader";
    frag.appendChild(reader);

    const result = document.createElement("div");
    result.id = "scan-result";
    result.style.cssText = "margin-top:12px;font-size:.85em;color:var(--primary-text-color);";
    frag.appendChild(result);

    setTimeout(() => this._startScanner(store), 100);

    return frag;
  }

  _startScanner(store) {
    const readerEl = this.shadowRoot.getElementById("reader");
    if (!readerEl) return;

    this._scanner = new Html5Qrcode("reader", { formatsToSupport: undefined, verbose: false });

    const onSuccess = (decodedText, decodedResult) => {
      this._stopScanner();
      const type = this._mapScanFormat(decodedResult?.result?.format?.formatName);
      this._modal = { type: "add_card", store, prefill: { barcode: decodedText, barcode_type: type } };
      this._render();
      setTimeout(() => {
        const inp = this.shadowRoot.getElementById("card-barcode");
        if (inp) inp.value = decodedText;
        const sel = this.shadowRoot.getElementById("card-type");
        if (sel) sel.value = type;
      }, 80);
    };

    const config = { fps: 10, qrbox: { width: 250, height: 150 } };

    this._scanner
      .start({ facingMode: "environment" }, config, onSuccess)
      .catch(() => {
        // Camera denied – show file picker fallback
        const resultEl = this.shadowRoot.getElementById("scan-result");
        if (resultEl) resultEl.textContent = "Kamera nedostupná – vyberte obrázek níže.";
      });

    // File picker support
    Html5Qrcode.scanFile = Html5Qrcode.scanFile || (() => {});
    const filePicker = document.createElement("input");
    filePicker.type = "file";
    filePicker.accept = "image/*";
    filePicker.style.cssText = "margin-top:12px;width:100%;";
    filePicker.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const scanner = new Html5Qrcode("reader", { verbose: false });
        const result = await scanner.scanFile(file, true);
        onSuccess(result, null);
      } catch (err) {
        const resultEl = this.shadowRoot.getElementById("scan-result");
        if (resultEl) resultEl.textContent = "Kód se nepodařilo přečíst. Zkuste jiný obrázek.";
      }
    });
    const readerAfter = this.shadowRoot.getElementById("reader");
    readerAfter?.parentNode?.insertBefore(filePicker, readerAfter.nextSibling);
  }

  _stopScanner() {
    if (this._scanner) {
      this._scanner.stop().catch(() => {});
      this._scanner = null;
    }
  }

  _mapScanFormat(fmt) {
    const map = {
      QR_CODE: "QR_CODE",
      EAN_13: "EAN_13",
      EAN_8: "EAN_8",
      CODE_128: "CODE_128",
      CODE_39: "CODE_39",
      ITF: "ITF",
      PDF_417: "PDF_417",
      AZTEC: "AZTEC",
      DATA_MATRIX: "DATA_MATRIX",
      UPC_A: "UPC_A",
      UPC_E: "UPC_E",
    };
    return map[fmt] || "CODE_128";
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  _renderError(msg) {
    this.shadowRoot.innerHTML = `
      <style>${STYLES}</style>
      <div class="card-root">
        <div class="empty" style="padding:32px;">${msg}</div>
      </div>`;
  }

  // ── HA card metadata ────────────────────────────────────────────────────────
  static getConfigElement() {
    return document.createElement("loyalty-cards-card-editor");
  }

  static getStubConfig() {
    return {};
  }
}

customElements.define("loyalty-cards-card", LoyaltyCardsCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "loyalty-cards-card",
  name: "Věrnostní karty",
  description: "Správa věrnostních karet obchodů s GPS detekcí.",
  preview: false,
});
