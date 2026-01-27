// --- LOGIKA PETA LEAFLET ---

// 1. Inisialisasi Peta (Koordinat Pusat Kota Bekasi)
var map = L.map('map').setView([-6.2383, 106.9756], 13);

// 2. Tambahkan Basemap
var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
});

var googleSat = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3'],
    attribution: 'Google Satellite'
});

// Set default basemap
osm.addTo(map);

// 3. Data Dummy GeoJSON (Area Bekasi)
var dataBekasi = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": { "nama": "Klaster Perumahan A", "status": "SHM", "luas": "1.5 Ha", "warna": "#3498db" },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [106.992, -6.225], [107.005, -6.225], 
                    [107.005, -6.235], [106.992, -6.235], 
                    [106.992, -6.225]
                ]]
            }
        },
        {
            "type": "Feature",
            "properties": { "nama": "Kawasan Niaga B", "status": "HGB", "luas": "2.1 Ha", "warna": "#e74c3c" },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [106.975, -6.235], [106.988, -6.235], 
                    [106.988, -6.245], [106.975, -6.245], 
                    [106.975, -6.235]
                ]]
            }
        },
        {
            "type": "Feature",
            "properties": { "nama": "Kantor BPN BEKASI", "status": "Pemerintah", "warna": "#2ecc71" },
            "geometry": {
                "type": "Point",
                "coordinates": [106.995, -6.241] 
            }
        }
    ]
};

// 4. Style & Popup
function style(feature) {
    return {
        fillColor: feature.properties.warna,
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}

function onEachFeature(feature, layer) {
    if (feature.properties) {
        var content = `
            <div style="text-align:center">
                <h6 style="margin:0;">${feature.properties.nama}</h6>
                <hr style="margin:5px 0;">
                <b>Status:</b> ${feature.properties.status}<br>
                ${feature.properties.luas ? `<b>Luas:</b> ${feature.properties.luas}` : ''}
            </div>
        `;
        layer.bindPopup(content);
    }
}

// 5. Load GeoJSON ke Peta
var geojsonLayer = L.geoJSON(dataBekasi, {
    style: style,
    onEachFeature: onEachFeature,
    pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, {
            radius: 8,
            fillColor: feature.properties.warna,
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        });
    }
}).addTo(map);

// 6. Kontrol Layer
var baseMaps = { "Peta Jalan": osm, "Satelit": googleSat };
var overlayMaps = { "Aset Tanah": geojsonLayer };
L.control.layers(baseMaps, overlayMaps).addTo(map);