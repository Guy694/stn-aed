'use client';
import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Heart, MapPin, Layers, Satellite, Map, AlertCircle, Info } from 'lucide-react';

// Fix Leaflet default icon issue in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const AED_ICON = L.divIcon({
  className: '',
  html: `<div style="width:36px;height:36px;background:linear-gradient(135deg,#ef4444,#dc2626);border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 15px rgba(239,68,68,0.5);display:flex;align-items:center;justify-content:center;">
    <div style="transform:rotate(45deg);color:white;font-size:15px;font-weight:bold;line-height:1;">♥</div>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

const CLICK_ICON = L.divIcon({
  className: '',
  html: `<div style="width:24px;height:24px;background:linear-gradient(135deg,#0ea5e9,#0284c7);border-radius:50%;border:3px solid white;box-shadow:0 4px 12px rgba(14,165,233,0.6);animation:pulse 1.5s infinite;"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Tile layer presets
const TILE_LAYERS = {
  street: {
    label: 'แผนที่ปกติ',
    icon: Map,
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  satellite: {
    label: 'ดาวเทียม',
    icon: Satellite,
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri World Imagery',
  },
};

// Geometry of polygon for district and tambon layers
function GeoLayer({ data, color, opacity, onClick }) {
  if (!data) return null;
  return (
    <GeoJSON
      key={JSON.stringify(data).slice(0, 50)}
      data={data}
      style={{
        color,
        weight: 1.5,
        fillOpacity: opacity,
        fillColor: color,
      }}
      onEachFeature={(feature, layer) => {
        const p = feature.properties;
        const label = p.dis_name || p.tam_name || '';
        layer.bindTooltip(label, {
          permanent: false,
          direction: 'center',
          className: 'leaflet-tooltip-dark',
        });
        if (onClick) layer.on('click', () => onClick(feature));
      }}
    />
  );
}

// Click handler for picking coordinates
function ClickMarker({ onPick, active }) {
  const [pos, setPos] = useState(null);
  useMapEvents({
    click(e) {
      if (!active) return;
      setPos(e.latlng);
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  if (!pos || !active) return null;
  return <Marker position={pos} icon={CLICK_ICON} />;
}

// Change tile layer dynamically
function TileLayerSwitcher({ tileKey }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }
    const cfg = TILE_LAYERS[tileKey];
    layerRef.current = L.tileLayer(cfg.url, { attribution: cfg.attribution }).addTo(map);
    return () => {
      if (layerRef.current) map.removeLayer(layerRef.current);
    };
  }, [tileKey, map]);

  return null;
}

export default function MapView({
  facilities = [],
  pickCoords = false,
  onPickCoords = null,
  showLayers = true,
}) {
  const [tileKey, setTileKey] = useState('street');
  const [showDistricts, setShowDistricts] = useState(true);
  const [showTambons, setShowTambons] = useState(false);
  const [districtData, setDistrictData] = useState(null);
  const [tambonData, setTambonData] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!showDistricts || districtData) return;
    fetch('/stn-aed/api/geo/districts')
      .then((r) => r.json())
      .then(setDistrictData)
      .catch(console.error);
  }, [showDistricts]);

  useEffect(() => {
    if (!showTambons || tambonData) return;
    fetch('/stn-aed/api/geo/tambons')
      .then((r) => r.json())
      .then(setTambonData)
      .catch(console.error);
  }, [showTambons]);

  if (!isMounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-2xl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 text-sm">กำลังโหลดแผนที่...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
      <MapContainer
        center={[6.65, 100.07]}
        zoom={11}
        className="w-full h-full"
        zoomControl={true}
      >
        {/* Base tile — managed imperatively */}
        <TileLayerSwitcher tileKey={tileKey} />

        {/* Polygon layers */}
        {showDistricts && districtData && (
          <GeoLayer data={districtData} color="#0ea5e9" opacity={0.08} />
        )}
        {showTambons && tambonData && (
          <GeoLayer data={tambonData} color="#10b981" opacity={0.1} />
        )}

        {/* Facility Markers */}
        {facilities.map((f) => (
          <Marker
            key={f.id}
            position={[parseFloat(f.lat), parseFloat(f.lon)]}
            icon={AED_ICON}
          >
            <Popup maxWidth={280}>
              <div className="min-w-[220px]">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">{f.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 border border-sky-500/20">
                      {f.typecode}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  {f.district_name && (
                    <div className="flex gap-2">
                      <span className="text-slate-500">อำเภอ:</span>
                      <span>{f.district_name}</span>
                    </div>
                  )}
                  {f.tambon && (
                    <div className="flex gap-2">
                      <span className="text-slate-500">ตำบล:</span>
                      <span>{f.tambon}</span>
                    </div>
                  )}
                  {f.address && (
                    <div className="flex gap-2">
                      <span className="text-slate-500">ที่อยู่:</span>
                      <span>{f.address}</span>
                    </div>
                  )}
                  <div className="flex gap-2 pt-1 border-t border-slate-200 mt-1">
                    <span className="text-slate-500">พิกัด:</span>
                    <span className="font-mono text-sky-600">
                      {parseFloat(f.lat).toFixed(5)}, {parseFloat(f.lon).toFixed(5)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-500">สถานะ:</span>
                    <span className={f.is_active ? 'text-emerald-400' : 'text-red-400'}>
                      {f.is_active ? '✓ ใช้งาน' : '✗ ปิดใช้งาน'}
                    </span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Coord picker */}
        {pickCoords && <ClickMarker onPick={onPickCoords} active={pickCoords} />}
      </MapContainer>

      {/* Controls overlay */}
      {showLayers && (
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
          {/* Tile switcher */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-slate-200 p-1.5 shadow-xl">
            <p className="text-xs text-slate-500 px-2 pb-1 font-medium">แผนที่</p>
            {Object.entries(TILE_LAYERS).map(([key, cfg]) => {
              const Icon = cfg.icon;
              return (
                <button
                  key={key}
                  onClick={() => setTileKey(key)}
                  className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    tileKey === key
                      ? 'bg-sky-50 text-sky-600'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Layer toggles */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-slate-200 p-1.5 shadow-xl">
            <p className="text-xs text-slate-500 px-2 pb-1 font-medium">Layer</p>
            <button
              onClick={() => setShowDistricts(!showDistricts)}
              className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                showDistricts
                  ? 'bg-sky-50 text-sky-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              อำเภอ
            </button>
            <button
              onClick={() => setShowTambons(!showTambons)}
              className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                showTambons
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              ตำบล
            </button>
          </div>
        </div>
      )}

      {/* Stats badge */}
      {facilities.length > 0 && (
        <div className="absolute bottom-4 left-4 z-[1000]">
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-xl rounded-full px-4 py-2 border border-slate-200 shadow-xl">
            <MapPin className="w-3.5 h-3.5 text-red-500" />
            <span className="text-xs text-slate-700 font-medium">
              {facilities.length} จุด AED
            </span>
          </div>
        </div>
      )}

      {/* Pick coords hint */}
      {pickCoords && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000]">
          <div className="flex items-center gap-2 bg-sky-500/90 backdrop-blur-xl rounded-full px-4 py-2 shadow-xl animate-bounce">
            <Info className="w-3.5 h-3.5 text-white" />
            <span className="text-xs text-white font-medium">คลิกบนแผนที่เพื่อเลือกพิกัด</span>
          </div>
        </div>
      )}
    </div>
  );
}
