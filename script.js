// 1. Inisialisasi Peta
const map = L.map('map', { zoomControl: false }).setView([-6.28, 106.97], 12);
L.control.zoom({ position: 'bottomright' }).addTo(map);

// 2. Konfigurasi Basemap
const basemapOptions = [
    { id: 'street', name: 'OpenStreet', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', thumb: 'https://a.tile.openstreetmap.org/12/2126/1865.png' },
    { id: 'dark', name: 'Dark Matter', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', thumb: 'https://a.basemaps.cartocdn.com/dark_all/12/2126/1865.png' },
    { id: 'light', name: 'Positron', url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', thumb: 'https://a.basemaps.cartocdn.com/light_all/12/2126/1865.png' },
    { id: 'sat', name: 'Satellite', url: 'http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', thumb: 'https://khms1.google.com/kh/v=908?x=2126&y=1865&z=12' },
    { id: 'hybrid', name: 'Hybrid', url: 'http://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', thumb: 'https://mt1.google.com/vt/lyrs=y&x=2126&y=1865&z=12' },
    { id: 'terrain', name: 'Terrain', url: 'http://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', thumb: 'https://mt1.google.com/vt/lyrs=p&x=2126&y=1865&z=12' }
];

let currentLayer = L.tileLayer(basemapOptions[0].url).addTo(map);

function initBasemapGallery() {
    const gallery = document.getElementById('basemap-gallery');
    basemapOptions.forEach(bm => {
        const col = document.createElement('div');
        col.className = `col-4 basemap-card ${bm.id === 'street' ? 'active' : ''}`;
        col.id = `bm-${bm.id}`;
        col.innerHTML = `<img src="${bm.thumb}"><span>${bm.name}</span>`;
        col.onclick = () => {
            document.querySelectorAll('.basemap-card').forEach(el => el.classList.remove('active'));
            col.classList.add('active');
            map.removeLayer(currentLayer);
            currentLayer = L.tileLayer(bm.url, { subdomains:['mt0','mt1','mt2','mt3'] }).addTo(map);
        };
        gallery.appendChild(col);
    });
}

// 3. Konfigurasi GIS & Layer
const styles = {
    desa: { fillColor: "#2ecc71", color: "#1b8a4a", weight: 1.5, fillOpacity: 0.3 },
    jalan: { color: "#e74c3c", weight: 2 },
    sungai: { color: "#3498db", weight: 2 }
};

let geoLayers = {};

async function loadLayers() {
    const datasets = [
        { id: 'desa', url: 'asset/ADMINISTRASIDESA_AR_25K.geojson', style: styles.desa, name: 'Wilayah Desa' },
        { id: 'jalan', url: 'asset/JALAN_LN_25K.geojson', style: styles.jalan, name: 'Jaringan Jalan' },
        { id: 'sungai', url: 'asset/SUNGAI_LN_25K.geojson', style: styles.sungai, name: 'Aliran Sungai' },
        { id: 'sekolah', url: 'asset/PENDIDIKAN_PT_25K.geojson', name: 'Fasilitas Pendidikan', type: 'point', color: '#f1c40f' }
    ];

    for (const ds of datasets) {
        try {
            const res = await fetch(ds.url);
            const data = await res.json();
            
            geoLayers[ds.id] = L.geoJSON(data, {
                style: ds.style || null,
                pointToLayer: (feature, latlng) => {
                    return ds.type === 'point' ? L.circleMarker(latlng, { radius: 5, fillColor: ds.color, color: "#fff", weight: 1, fillOpacity: 1 }) : null;
                },
                onEachFeature: (f, l) => {
                    l.on('click', (e) => {
                        L.DomEvent.stopPropagation(e);
                        const lat = e.latlng.lat.toFixed(6);
                        const lng = e.latlng.lng.toFixed(6);
                        
                        // Popup Konten
                        const popupContent = `
                            <div class="custom-popup">
                                <h6 class="fw-bold text-primary mb-1">${ds.name}</h6>
                                <div class="d-flex align-items-center mb-1">
                                    <i class="fas fa-map-marker-alt text-danger me-2"></i>
                                    <span class="small fw-bold">${f.properties.NAMOBJ || 'Tanpa Nama'}</span>
                                </div>
                                <div class="d-flex align-items-center">
                                    <i class="fas fa-crosshairs text-secondary me-2"></i>
                                    <span class="x-small text-muted">${lat}, ${lng}</span>
                                </div>
                                <button class="btn btn-sm btn-primary w-100 mt-2" onclick="focusObject(${lat}, ${lng})">Fokus</button>
                            </div>`;
                        l.bindPopup(popupContent).openPopup();
                        
                        // Update Panel Detail
                        showDetailPanel(f.properties, ds.name, lat, lng);
                    });
                }
            }).addTo(map);
            
            addSidebarToggle(ds.id, ds.name, ds.style?.color || ds.color);
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
    
    let html = '';
    if (lat && lng) {
        html += `
            <div class="mb-3 p-2 bg-light rounded border">
                <small class="fw-bold text-uppercase d-block mb-1 text-muted">Koordinat</small>
                <code class="text-primary">${lat}, ${lng}</code>
            </div>`;
    }
    
    html += `<h6 class="fw-bold text-primary mb-3">${layerName}</h6><table class="attr-table">`;
    for (let key in props) {
        html += `<tr><td class="attr-key">${key}</td><td>${props[key] || '-'}</td></tr>`;
    }
    html += `</table>`;
    content.innerHTML = html;
}

function closeDetailPanel() { 
    document.getElementById('detail-panel').classList.remove('active'); 
}

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

function focusObject(lat, lng) {
    map.flyTo([lat, lng], 16);
}

function searchVillage() {
    const term = document.getElementById('searchDesa').value.toLowerCase();
    if (!geoLayers['desa']) return;

    geoLayers['desa'].eachLayer(l => {
        const name = (l.feature.properties.NAMOBJ || "").toLowerCase();
        if(name.includes(term)) {
            const center = l.getBounds().getCenter();
            map.flyTo(center, 14);
            showDetailPanel(l.feature.properties, "Wilayah Desa", center.lat.toFixed(6), center.lng.toFixed(6));
        }
    });
}

// Jalankan Fungsi
initBasemapGallery();
loadLayers();
