'use client';
import { useEffect, useState, useRef } from 'react';
import { MapContainer, Marker, Popup, GeoJSON, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Heart, MapPin, Layers, Satellite, Map, Info } from 'lucide-react';

// Fix Leaflet default icon issue in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Health facility icon ──
const FACILITY_ICON = L.icon({
  iconUrl: '/stn-aed/img/hospital.png',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -38],
});

const FACILITY_ICON_SELECTED = L.icon({
  iconUrl: '/stn-aed/img/hospital.png',
  iconSize: [46, 46],
  iconAnchor: [23, 46],
  popupAnchor: [0, -48],
});

// ── AED icon ──
const AED_ICON = L.icon({
  iconUrl: '/stn-aed/img/aed.png',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -38],
});

const AED_ICON_SELECTED = L.icon({
  iconUrl: '/stn-aed/img/aed.png',
  iconSize: [46, 46],
  iconAnchor: [23, 46],
  popupAnchor: [0, -48],
});

const CLICK_ICON = L.divIcon({
  className: '',
  html: `<div style="width:24px;height:24px;background:linear-gradient(135deg,#0ea5e9,#0284c7);border-radius:50%;border:3px solid white;box-shadow:0 4px 12px rgba(14,165,233,0.6);"></div>`,
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

function GeoLayer({ data, color, opacity }) {
  if (!data) return null;
  const defaultStyle = { color, weight: 1.5, fillOpacity: opacity, fillColor: color };
  return (
    <GeoJSON
      key={color}
      data={data}
      style={defaultStyle}
      onEachFeature={(feature, layer) => {
        const p = feature.properties;
        const label = p.tam_name || p.dis_name || '';
        if (label) {
          layer.bindTooltip(label, {
            permanent: false,
            direction: 'center',
            className: 'leaflet-tooltip-dark',
          });
        }
        layer.on({
          mouseover(e) {
            e.target.setStyle({ fillOpacity: Math.min(opacity * 5, 0.45), weight: 2.5, color });
            e.target.bringToFront();
          },
          mouseout(e) {
            e.target.setStyle(defaultStyle);
          },
        });
      }}
    />
  );
}

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

// Fly to selected marker
function FlyToSelected({ facilities, aedPoints, selectedId }) {
  const map = useMap();
  useEffect(() => {
    if (!selectedId) return;
    const f = [...facilities, ...aedPoints].find((x) => x.id === selectedId);
    if (f && f.lat != null && f.lon != null) {
      map.flyTo([parseFloat(f.lat), parseFloat(f.lon)], 15, { duration: 1.2 });
    }
  }, [selectedId, facilities, aedPoints, map]);
  return null;
}

// Custom zoom control using useMap
function ZoomControl() {
  const map = useMap();
  return (
    <div className="absolute bottom-8 right-4 z-[1000] flex flex-col gap-1">
      <button
        onClick={() => map.zoomIn()}
        className="w-9 h-9 bg-white/90 backdrop-blur-xl rounded-t-xl border border-slate-200 shadow-lg flex items-center justify-center text-slate-700 hover:bg-white hover:text-slate-900 transition-all text-xl font-bold leading-none select-none"
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="w-9 h-9 bg-white/90 backdrop-blur-xl rounded-b-xl border-x border-b border-slate-200 shadow-lg flex items-center justify-center text-slate-700 hover:bg-white hover:text-slate-900 transition-all text-2xl font-bold leading-none select-none"
        aria-label="Zoom out"
      >
        −
      </button>
    </div>
  );
}

export default function MapView({
  facilities = [],
  aedPoints = [],
  pickCoords = false,
  onPickCoords = null,
  selectedId = null,
  tileKey = 'street',
  showDistricts = true,
  showTambons = false,
}) {
  const [districtData, setDistrictData] = useState(null);
  const [tambonData, setTambonData] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!showDistricts || districtData) return;
    fetch('/stn-aed/api/geo/districts')
      .then((r) => { if (!r.ok) throw new Error('districts fetch failed'); return r.json(); })
      .then((d) => { if (d?.type === 'FeatureCollection') setDistrictData(d); })
      .catch(console.error);
  }, [showDistricts, districtData]);

  useEffect(() => {
    if (!showTambons || tambonData) return;
    fetch('/stn-aed/api/geo/tambons')
      .then((r) => { if (!r.ok) throw new Error('tambons fetch failed'); return r.json(); })
      .then((d) => { if (d?.type === 'FeatureCollection') setTambonData(d); })
      .catch(console.error);
  }, [showTambons, tambonData]);

  if (!isMounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 text-sm">กำลังโหลดแผนที่...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      <MapContainer
        center={[6.65, 100.07]}
        zoom={11}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayerSwitcher tileKey={tileKey} />

        {selectedId && (
          <FlyToSelected facilities={facilities} aedPoints={aedPoints} selectedId={selectedId} />
        )}

        {showDistricts && districtData && (
          <GeoLayer data={districtData} color="#0ea5e9" opacity={0.07} />
        )}
        {showTambons && tambonData && (
          <GeoLayer data={tambonData} color="#10b981" opacity={0.1} />
        )}

        {/* Health facility markers (green cross icon) */}
        {facilities.filter((f) => f.lat != null && f.lon != null).map((f) => (
          <Marker
            key={`fac-${f.id}`}
            position={[parseFloat(f.lat), parseFloat(f.lon)]}
            icon={f.id === selectedId ? FACILITY_ICON_SELECTED : FACILITY_ICON}
          >
            <Popup maxWidth={280} className="aed-popup">
              <div className="min-w-[220px] p-1">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center flex-shrink-0 shadow-md">
                    <span style={{ color: 'white', fontSize: '16px', fontWeight: '900', lineHeight: 1 }}>✚</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">{f.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-200 font-medium">
                        {f.typecode}
                      </span>
                      <span className={`flex items-center gap-1 text-xs font-medium ${f.is_active ? 'text-emerald-600' : 'text-red-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${f.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {f.is_active ? 'ใช้งานได้' : 'ปิดใช้งาน'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 rounded-xl p-3">
                  {f.district_name && (
                    <div className="flex gap-2">
                      <span className="text-slate-400 w-12 flex-shrink-0">อำเภอ</span>
                      <span className="font-medium text-slate-700">{f.district_name}</span>
                    </div>
                  )}
                  {f.tambon && (
                    <div className="flex gap-2">
                      <span className="text-slate-400 w-12 flex-shrink-0">ตำบล</span>
                      <span className="font-medium text-slate-700">{f.tambon}</span>
                    </div>
                  )}
                  {f.address && (
                    <div className="flex gap-2">
                      <span className="text-slate-400 w-12 flex-shrink-0">ที่อยู่</span>
                      <span className="font-medium text-slate-700">{f.address}</span>
                    </div>
                  )}
                  <div className="flex gap-2 pt-1 border-t border-slate-200 mt-1">
                    <span className="text-slate-400 w-12 flex-shrink-0">พิกัด</span>
                    <span className="font-mono text-emerald-600 text-xs">
                      {parseFloat(f.lat).toFixed(5)}, {parseFloat(f.lon).toFixed(5)}
                    </span>
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${parseFloat(f.lat)},${parseFloat(f.lon)}&travelmode=driving`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white mt-3 flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-xs font-semibold hover:from-emerald-400 hover:to-teal-500 transition-all shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                  </svg>
                  นำทาง
                </a>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* AED point markers (red heart icon) */}
        {aedPoints.filter((f) => f.lat != null && f.lon != null).map((f) => (
          <Marker
            key={`aed-${f.id}`}
            position={[parseFloat(f.lat), parseFloat(f.lon)]}
            icon={f.id === selectedId ? AED_ICON_SELECTED : AED_ICON}
          >
            <Popup maxWidth={300} className="aed-popup">
              <div className="min-w-[240px] p-1">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center flex-shrink-0 shadow-md">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">{f.location_name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      {f.manager_typecode && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-700 border border-sky-200 font-medium">
                          {f.manager_typecode}
                        </span>
                      )}
                      <span className={`flex items-center gap-1 text-xs font-medium ${f.is_active ? 'text-emerald-600' : 'text-red-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${f.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {f.is_active ? 'ใช้งานได้' : 'ปิดใช้งาน'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 rounded-xl p-3">
                  {f.district_name && (
                    <div className="flex gap-2">
                      <span className="text-slate-400 w-12 flex-shrink-0">อำเภอ</span>
                      <span className="font-medium text-slate-700">{f.district_name}</span>
                    </div>
                  )}
                  {f.tambon_name && (
                    <div className="flex gap-2">
                      <span className="text-slate-400 w-12 flex-shrink-0">ตำบล</span>
                      <span className="font-medium text-slate-700">{f.tambon_name}</span>
                    </div>
                  )}
                  {f.manager_name && (
                    <div className="flex gap-2">
                      <span className="text-slate-400 w-12 flex-shrink-0">ดูแลโดย</span>
                      <span className="font-medium text-slate-700">{f.manager_name}</span>
                    </div>
                  )}
                  <div className="flex gap-2 pt-1 border-t border-slate-200 mt-1">
                    <span className="text-slate-400 w-12 flex-shrink-0">พิกัด</span>
                    <span className="font-mono text-sky-600 text-xs">
                      {parseFloat(f.lat).toFixed(5)}, {parseFloat(f.lon).toFixed(5)}
                    </span>
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${parseFloat(f.lat)},${parseFloat(f.lon)}&travelmode=driving`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white mt-3 flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-xs font-semibold hover:from-red-400 hover:to-rose-500 transition-all shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                  </svg>
                  นำทาง
                </a>
              </div>
            </Popup>
          </Marker>
        ))}

        {pickCoords && <ClickMarker onPick={onPickCoords} active={pickCoords} />}

        <ZoomControl />
      </MapContainer>

      {/* Stats badge */}
      {(facilities.length > 0 || aedPoints.length > 0) && (
        <div className="absolute bottom-4 left-4 z-[1000]">
          <div className="flex items-center gap-2.5 bg-white/90 backdrop-blur-xl rounded-full px-4 py-2 border border-slate-200 shadow-xl">
            {facilities.length > 0 && (
              <>
                <span className="w-3 h-3 rounded bg-emerald-500 flex-shrink-0" />
                <span className="text-xs text-slate-700 font-semibold">{facilities.length} หน่วยบริการ</span>
              </>
            )}
            {facilities.length > 0 && aedPoints.length > 0 && (
              <span className="w-px h-4 bg-slate-300" />
            )}
            {aedPoints.length > 0 && (
              <>
                <Heart className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                <span className="text-xs text-slate-700 font-semibold">{aedPoints.length} จุด AED</span>
              </>
            )}
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

