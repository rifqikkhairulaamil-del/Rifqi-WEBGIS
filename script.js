// ===============================
// 0) UTIL LOG STATUS DATA
// ===============================
function setDataStatus(text, color = "#111") {
  const el = document.getElementById("data-status");
  if (!el) return;
  el.textContent = text;
  el.style.color = color;
}
function addDataLog(text, ok = true) {
  const el = document.getElementById("data-log");
  if (!el) return;
  const line = document.createElement("div");
  line.textContent = text;
  line.style.color = ok ? "#198754" : "#dc3545"; // hijau/merah
  el.appendChild(line);
}

// ===============================
// 1) INISIALISASI PETA
// ===============================
const map = L.map('map', { zoomControl: false }).setView([-6.28, 106.97], 12);
L.control.zoom({ position: 'bottomright' }).addTo(map);

// SCALE BAR
L.control.scale({
  position: 'bottomleft',
  imperial: false,
  maxWidth: 140
}).addTo(map);

// ===============================
// 2) BASEMAP OPTIONS
// ===============================
const basemapOptions = [
  {
    id: 'street',
    name: 'OpenStreet',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    sub: ['a', 'b', 'c'],
    thumb: 'https://a.tile.openstreetmap.org/12/2126/1865.png',
    attribution: '&copy; OpenStreetMap contributors'
  },
  {
    id: 'satellite',
    name: 'Satellite',
    url: 'https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    sub: ['0', '1', '2', '3'],
    thumb: 'https://khms1.google.com/kh/v=908?x=2126&y=1865&z=12',
    attribution: '&copy; Google Maps'
  },
  {
    id: 'hybrid',
    name: 'Hybrid',
    url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    sub: ['0', '1', '2', '3'],
    thumb: 'https://mt1.google.com/vt/lyrs=y&x=2126&y=1865&z=12',
    attribution: '&copy; Google Maps'
  },
  {
    id: 'terrain',
    name: 'Terrain',
    url: 'https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    sub: ['0', '1', '2', '3'],
    thumb: 'https://mt1.google.com/vt/lyrs=p&x=2126&y=1865&z=12',
    attribution: '&copy; Google Maps'
  },
  {
    id: 'dark',
    name: 'Dark Matter',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    sub: ['a', 'b', 'c', 'd'],
    thumb: 'https://a.basemaps.cartocdn.com/dark_all/12/2126/1865.png',
    attribution: '&copy; CartoDB'
  },
  {
    id: 'topo',
    name: 'Esri Topo',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    sub: [],
    thumb: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/12/2513/1324',
    attribution: '&copy; Esri'
  }
];

let currentLayer = L.tileLayer(basemapOptions[0].url, {
  attribution: basemapOptions[0].attribution
}).addTo(map);

function initBasemapGallery() {
  const gallery = document.getElementById('basemap-gallery');
  if (!gallery) return;
  gallery.innerHTML = '';

  basemapOptions.forEach(bm => {
    const col = document.createElement('div');
    col.className = `col-4 basemap-card ${bm.id === 'street' ? 'active' : ''}`;
    col.id = `bm-${bm.id}`;
    col.innerHTML = `
      <img src="${bm.thumb}" alt="${bm.name}" onerror="this.src='https://via.placeholder.com/80?text=Map'">
      <span>${bm.name}</span>
    `;

    col.onclick = () => {
      document.querySelectorAll('.basemap-card').forEach(el => el.classList.remove('active'));
      col.classList.add('active');

      map.removeLayer(currentLayer);
      currentLayer = L.tileLayer(bm.url, {
        subdomains: bm.sub,
        attribution: bm.attribution
      }).addTo(map);
    };

    gallery.appendChild(col);
  });
}

// ===============================
// 3) DATASET GEOJSON (JANGAN DIHAPUS)
// ===============================
// Semua data GeoJSON kamu TETAP ADA di sini
let geoLayers = {};

const datasets = [
  { id: 'desa',    url: 'asset/ADMINISTRASIDESA_AR_25K.geojson', name: 'Batas Desa',        color: '#2ecc71', type: 'area'  },
  { id: 'jalan',   url: 'asset/JALAN_LN_25K.geojson',            name: 'Jaringan Jalan',    color: '#e74c3c', type: 'line'  },
  { id: 'sungai',  url: 'asset/SUNGAI_LN_25K.geojson',           name: 'Aliran Sungai',     color: '#3498db', type: 'line'  },
  { id: 'admin_ln',url: 'asset/ADMINISTRASI_LN_25K.geojson',     name: 'Garis Administrasi',color: '#34495e', type: 'line'  },
  { id: 'sekolah', url: 'asset/PENDIDIKAN_PT_25K.geojson',       name: 'Sekolah',           color: '#f1c40f', type: 'point' },
  { id: 'stasiun', url: 'asset/STASIUNKA_PT_25K.geojson',        name: 'Stasiun KA',        color: '#9b59b6', type: 'point' },
  { id: 'bangunan',url: 'asset/BANGUNAN_PT_25K.geojson',         name: 'Bangunan',          color: '#7f8c8d', type: 'point' }
];

// ===============================
// 4) UI DETAIL PANEL
// ===============================
function showDetailPanel(props, layerName, lat = null, lng = null) {
  const panel = document.getElementById('detail-panel');
  const content = document.getElementById('detail-content');
  if (!panel || !content) return;

  panel.classList.add('active');

  let html = `<h6 class="fw-bold mb-2">${layerName}</h6>`;

  if (lat !== null && lng !== null) {
    html += `
      <div class="small text-muted mb-2">
        <i class="fa-solid fa-location-dot me-1"></i>
        ${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}
      </div>
    `;
  }

  html += `<table class="attr-table">`;
  for (let key in props) {
    html += `<tr><td class="attr-key">${key}</td><td>${props[key] || '-'}</td></tr>`;
  }
  html += `</table>`;
  content.innerHTML = html;
}

function closeDetailPanel() {
  const panel = document.getElementById('detail-panel');
  if (panel) panel.classList.remove('active');
}

// ===============================
// 5) SIDEBAR LAYER TOGGLE
// ===============================
function addSidebarToggle(id, name, color) {
  const list = document.getElementById('layer-list');
  if (!list) return;

  const item = document.createElement('div');
  item.className = "layer-item d-flex justify-content-between align-items-center shadow-sm";
  item.innerHTML = `
    <span><i class="fas fa-layer-group me-2" style="color:${color}"></i> ${name}</span>
    <div class="form-check form-switch">
      <input class="form-check-input" type="checkbox" checked onchange="toggleLayer('${id}')">
    </div>
  `;
  list.appendChild(item);
}

function toggleLayer(id) {
  if (!geoLayers[id]) return;
  if (map.hasLayer(geoLayers[id])) map.removeLayer(geoLayers[id]);
  else map.addLayer(geoLayers[id]);
}

function focusObject(lat, lng) {
  map.flyTo([lat, lng], 16);
}

// ===============================
// 6) LOAD GEOJSON LAYERS (PASTI KEBACA)
// ===============================
async function loadLayers() {
  setDataStatus("Memuat...", "#0d6efd");

  let okCount = 0;
  let failCount = 0;

  for (const ds of datasets) {
    try {
      const res = await fetch(ds.url, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} - ${ds.url}`);
      }

      const data = await res.json();

      geoLayers[ds.id] = L.geoJSON(data, {
        style: function () {
          return ds.type === 'area'
            ? { fillColor: ds.color, color: "#1b8a4a", weight: 1.5, fillOpacity: 0.3 }
            : { color: ds.color, weight: 2 };
        },
        pointToLayer: (feature, latlng) => {
          if (ds.type !== 'point') return null;
          return L.circleMarker(latlng, { radius: 5, fillColor: ds.color, color: "#fff", weight: 1, fillOpacity: 1 });
        },
        onEachFeature: (f, l) => {
          l.on('click', (e) => {
            L.DomEvent.stopPropagation(e);

            const lat = e.latlng.lat.toFixed(6);
            const lng = e.latlng.lng.toFixed(6);

            const popupContent = `
              <div class="custom-popup">
                <h6 class="fw-bold text-primary mb-1">${ds.name}</h6>
                <span class="small fw-bold">${(f.properties && f.properties.NAMOBJ) ? f.properties.NAMOBJ : 'Tanpa Nama'}</span>
                <button class="btn btn-sm btn-primary w-100 mt-2" onclick="focusObject(${lat}, ${lng})">Fokus</button>
              </div>
            `;
            l.bindPopup(popupContent).openPopup();

            showDetailPanel(f.properties || {}, ds.name, lat, lng);
          });
        }
      }).addTo(map);

      addSidebarToggle(ds.id, ds.name, ds.color);

      okCount++;
      addDataLog(`✅ OK: ${ds.name} (${ds.url})`, true);
    } catch (e) {
      failCount++;
      console.warn(`Gagal memuat layer ${ds.name}:`, e);
      addDataLog(`❌ GAGAL: ${ds.name} (${ds.url})`, false);
    }
  }

  if (failCount === 0) setDataStatus(`Selesai (${okCount}/${datasets.length})`, "#198754");
  else setDataStatus(`Sebagian gagal (${okCount}/${datasets.length})`, "#dc3545");
}

// ===============================
// 7) SEARCH DESA
// ===============================
function searchVillage() {
  const input = document.getElementById('searchDesa');
  const term = (input ? input.value : "").toLowerCase().trim();
  if (!term) return;

  if (!geoLayers['desa']) return;

  let found = false;
  geoLayers['desa'].eachLayer(l => {
    const name = ((l.feature && l.feature.properties && l.feature.properties.NAMOBJ) ? l.feature.properties.NAMOBJ : "");
    if (name.toLowerCase().includes(term)) {
      const center = l.getBounds().getCenter();
      map.flyTo(center, 14);
      showDetailPanel(l.feature.properties || {}, "Batas Desa", center.lat, center.lng);
      found = true;
    }
  });

  if (!found) {
    alert("Desa tidak ditemukan. Coba ketik nama lain.");
  }
}

// ===============================
// 8) LIVE COORDINATE (MOUSE MOVE)
// ===============================
const mouseCoordEl = document.getElementById('mouse-coord');
map.on('mousemove', function (e) {
  if (!mouseCoordEl) return;
  const lat = e.latlng.lat.toFixed(6);
  const lng = e.latlng.lng.toFixed(6);
  mouseCoordEl.innerHTML = `Lat: <b>${lat}</b> | Lng: <b>${lng}</b>`;
});
map.on('mouseout', function () {
  if (!mouseCoordEl) return;
  mouseCoordEl.innerHTML = `Lat: - | Lng: -`;
});

// ===============================
// 9) KLIK PETA → POPUP KOORDINAT + COPY
// ===============================
map.on('click', function (e) {
  const lat = e.latlng.lat.toFixed(6);
  const lng = e.latlng.lng.toFixed(6);

  const html = `
    <div class="text-center">
      <b>Koordinat Lokasi</b><br>
      <div class="mt-1">Lat: <b>${lat}</b></div>
      <div>Lng: <b>${lng}</b></div>
      <button class="btn btn-sm btn-primary w-100 mt-2" onclick="copyCoord('${lat}, ${lng}')">
        Copy Koordinat
      </button>
    </div>
  `;

  L.popup().setLatLng(e.latlng).setContent(html).openOn(map);
  console.log("Klik Koordinat:", lat, lng);
});

function copyCoord(text) {
  if (!navigator.clipboard) {
    prompt("Copy manual:", text);
    return;
  }
  navigator.clipboard.writeText(text)
    .then(() => alert("Koordinat disalin: " + text))
    .catch(() => prompt("Copy manual:", text));
}

// ===============================
// 10) LEGENDA OTOMATIS + TOGGLE ON/OFF
// ===============================
const legend = L.control({ position: "bottomright" });
let legendCollapsed = false;

legend.onAdd = function () {
  const div = L.DomUtil.create("div", "legend");
  L.DomEvent.disableClickPropagation(div);
  L.DomEvent.disableScrollPropagation(div);

  const itemsHtml = datasets.map(ds => `
    <div class="legend-item">
      <span class="legend-swatch" style="background:${ds.color}"></span>
      <span>${ds.name}</span>
    </div>
  `).join("");

  div.innerHTML = `
    <div class="legend-header">
      <span class="legend-title">Legenda</span>
      <button class="legend-toggle" id="legendToggleBtn">Hide</button>
    </div>
    <div class="legend-items" id="legendItems">${itemsHtml}</div>
  `;

  setTimeout(() => {
    const btn = div.querySelector("#legendToggleBtn");
    const items = div.querySelector("#legendItems");
    if (!btn || !items) return;

    btn.onclick = () => {
      legendCollapsed = !legendCollapsed;
      items.style.display = legendCollapsed ? "none" : "block";
      btn.textContent = legendCollapsed ? "Show" : "Hide";
    };
  }, 0);

  return div;
};

legend.addTo(map);

// ===============================
// 11) INIT
// ===============================
initBasemapGallery();
loadLayers();
