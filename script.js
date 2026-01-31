// 1. Inisialisasi Peta
const map = L.map('map', { zoomControl: false }).setView([-6.28, 106.97], 12);
L.control.zoom({ position: 'bottomright' }).addTo(map);

// 2. Konfigurasi Basemap
// 2. Konfigurasi Basemap Lengkap
const basemapOptions = [
    { 
        id: 'street', 
        name: 'OpenStreet', 
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', 
        sub: ['a','b','c'],
        thumb: 'https://a.tile.openstreetmap.org/12/2126/1865.png',
        attribution: '&copy; OpenStreetMap contributors'
    },
    { 
        id: 'satellite', 
        name: 'Satellite', 
        url: 'https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', 
        sub: ['0','1','2','3'],
        thumb: 'https://khms1.google.com/kh/v=908?x=2126&y=1865&z=12',
        attribution: '&copy; Google Maps'
    },
    { 
        id: 'hybrid', 
        name: 'Hybrid', 
        url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', 
        sub: ['0','1','2','3'],
        thumb: 'https://mt1.google.com/vt/lyrs=y&x=2126&y=1865&z=12',
        attribution: '&copy; Google Maps'
    },
    { 
        id: 'terrain', 
        name: 'Terrain', 
        url: 'https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', 
        sub: ['0','1','2','3'],
        thumb: 'https://mt1.google.com/vt/lyrs=p&x=2126&y=1865&z=12',
        attribution: '&copy; Google Maps'
    },
    { 
        id: 'dark', 
        name: 'Dark Matter', 
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', 
        sub: ['a','b','c','d'],
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
    gallery.innerHTML = ''; // Clear gallery sebelum render
    
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

// 3. Konfigurasi GIS & Layer (Semua Path diubah ke asset/)
let geoLayers = {};

async function loadLayers() {
    const datasets = [
        { id: 'desa', url: 'asset/ADMINISTRASIDESA_AR_25K.geojson', name: 'Batas Desa', color: '#2ecc71', type: 'area' },
        { id: 'jalan', url: 'asset/JALAN_LN_25K.geojson', name: 'Jaringan Jalan', color: '#e74c3c', type: 'line' },
        { id: 'sungai', url: 'asset/SUNGAI_LN_25K.geojson', name: 'Aliran Sungai', color: '#3498db', type: 'line' },
        { id: 'admin_ln', url: 'asset/ADMINISTRASI_LN_25K.geojson', name: 'Garis Administrasi', color: '#34495e', type: 'line' },
        { id: 'sekolah', url: 'asset/PENDIDIKAN_PT_25K.geojson', name: 'Sekolah', color: '#f1c40f', type: 'point' },
        { id: 'stasiun', url: 'asset/STASIUNKA_PT_25K.geojson', name: 'Stasiun KA', color: '#9b59b6', type: 'point' },
        { id: 'bangunan', url: 'asset/BANGUNAN_PT_25K.geojson', name: 'Bangunan', color: '#7f8c8d', type: 'point' }
    ];

    for (const ds of datasets) {
        try {
            const res = await fetch(ds.url);
            const data = await res.json();
            
            geoLayers[ds.id] = L.geoJSON(data, {
                style: function() {
                    return ds.type === 'area' ? { fillColor: ds.color, color: "#1b8a4a", weight: 1.5, fillOpacity: 0.3 } : { color: ds.color, weight: 2 };
                },
                pointToLayer: (feature, latlng) => {
                    return ds.type === 'point' ? L.circleMarker(latlng, { radius: 5, fillColor: ds.color, color: "#fff", weight: 1, fillOpacity: 1 }) : null;
                },
                onEachFeature: (f, l) => {
                    l.on('click', (e) => {
                        L.DomEvent.stopPropagation(e);
                        const lat = e.latlng.lat.toFixed(6);
                        const lng = e.latlng.lng.toFixed(6);
                        
                        const popupContent = `
                            <div class="custom-popup">
                                <h6 class="fw-bold text-primary mb-1">${ds.name}</h6>
                                <span class="small fw-bold">${f.properties.NAMOBJ || 'Tanpa Nama'}</span>
                                <button class="btn btn-sm btn-primary w-100 mt-2" onclick="focusObject(${lat}, ${lng})">Fokus</button>
                            </div>`;
                        l.bindPopup(popupContent).openPopup();
                        showDetailPanel(f.properties, ds.name, lat, lng);
                    });
                }
            }).addTo(map);
            
            addSidebarToggle(ds.id, ds.name, ds.color);
        } catch (e) { 
            console.warn(`Gagal memuat layer ${ds.name}:`, e); 
        }
    }
}

// 4. UI Helper Functions
function showDetailPanel(props, layerName, lat = null, lng = null) {
    const panel = document.getElementById('detail-panel');
    const content = document.getElementById('detail-content');
    panel.classList.add('active');
    
    let html = `<h6>${layerName}</h6><table class="attr-table">`;
    for (let key in props) {
        html += `<tr><td class="attr-key">${key}</td><td>${props[key] || '-'}</td></tr>`;
    }
    html += `</table>`;
    content.innerHTML = html;
}

function closeDetailPanel() { document.getElementById('detail-panel').classList.remove('active'); }

function addSidebarToggle(id, name, color) {
    const list = document.getElementById('layer-list');
    const item = document.createElement('div');
    item.className = "layer-item d-flex justify-content-between align-items-center shadow-sm";
    item.innerHTML = `
        <span><i class="fas fa-layer-group me-2" style="color:${color}"></i> ${name}</span>
        <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" checked onchange="toggleLayer('${id}')">
        </div>`;
    list.appendChild(item);
}

function toggleLayer(id) {
    if(map.hasLayer(geoLayers[id])) map.removeLayer(geoLayers[id]);
    else map.addLayer(geoLayers[id]);
}

function focusObject(lat, lng) { map.flyTo([lat, lng], 16); }

function searchVillage() {
    const term = document.getElementById('searchDesa').value.toLowerCase();
    if (!geoLayers['desa']) return;
    geoLayers['desa'].eachLayer(l => {
        if((l.feature.properties.NAMOBJ || "").toLowerCase().includes(term)) {
            const center = l.getBounds().getCenter();
            map.flyTo(center, 14);
            showDetailPanel(l.feature.properties, "Batas Desa", center.lat, center.lng);
        }
    });
}

initBasemapGallery();
loadLayers();

