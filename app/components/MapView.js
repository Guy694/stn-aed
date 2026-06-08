'use client';
import { useCallback, useEffect, useState, useRef } from 'react';
import { MapContainer, Marker, Popup, GeoJSON, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Heart, MapPin, Layers, Satellite, Map, Info, Navigation } from 'lucide-react';
import { apiFetch, publicPath } from '@/app/lib/client-api';

// Fix Leaflet default icon issue in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Health facility icon ──
const FACILITY_ICON = L.icon({
  iconUrl: publicPath('/img/hospital.png'),
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -38],
});

const FACILITY_ICON_SELECTED = L.icon({
  iconUrl: publicPath('/img/hospital.png'),
  iconSize: [46, 46],
  iconAnchor: [23, 46],
  popupAnchor: [0, -48],
});

// ── AED icon ──
const AED_ICON = L.icon({
  iconUrl: publicPath('/img/aed.png'),
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -38],
});

const AED_ICON_SELECTED = L.icon({
  iconUrl: publicPath('/img/aed.png'),
  iconSize: [46, 46],
  iconAnchor: [23, 46],
  popupAnchor: [0, -48],
});

// ── Dental icon (tooth – SVG divIcon) ──
const makeDentalIcon = (size = 36, selected = false) => L.divIcon({
  className: '',
  html: `<div style="
    width:${size}px;height:${size}px;
    background:linear-gradient(135deg,#7c3aed,#6d28d9);
    border-radius:50%;
    border:${selected ? '3px solid #fff' : '2px solid rgba(255,255,255,0.8)'};
    box-shadow:0 ${selected ? '6' : '3'}px ${selected ? '18' : '10'}px rgba(124,58,237,0.5);
    display:flex;align-items:center;justify-content:center;
  "><svg xmlns='http://www.w3.org/2000/svg' width='${Math.round(size*0.55)}' height='${Math.round(size*0.55)}' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 2C8 2 5 5 5 8c0 2 .5 3.5 1 5l1 5c.3 1.5 1.5 2.5 2.5 2.5S11 19 12 17c1 2 1.5 3.5 2.5 3.5S16.7 19.5 17 18l1-5c.5-1.5 1-3 1-5 0-3-3-6-7-6z'/></svg></div>`,
  iconSize: [size, size],
  iconAnchor: [size / 2, size / 2],
  popupAnchor: [0, -(size / 2) - 4],
});
const DENTAL_ICON = makeDentalIcon(36);
const DENTAL_ICON_SELECTED = makeDentalIcon(46, true);

// ── Health Station icon (heart-pulse – SVG divIcon) ──
const makeHealthStationIcon = (size = 36, selected = false, isOpen = true) => L.divIcon({
  className: '',
  html: `<div style="
    width:${size}px;height:${size}px;
    background:linear-gradient(135deg,${isOpen ? '#0ea5e9,#0284c7' : '#64748b,#475569'});
    border-radius:${Math.round(size * 0.28)}px;
    border:${selected ? '3px solid #fff' : '2px solid rgba(255,255,255,0.8)'};
    box-shadow:0 ${selected ? '6' : '3'}px ${selected ? '18' : '10'}px rgba(14,165,233,0.5);
    display:flex;align-items:center;justify-content:center;
  "><svg xmlns='http://www.w3.org/2000/svg' width='${Math.round(size*0.55)}' height='${Math.round(size*0.55)}' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><polyline points='22 12 18 12 15 21 9 3 6 12 2 12'/></svg></div>`,
  iconSize: [size, size],
  iconAnchor: [size / 2, size / 2],
  popupAnchor: [0, -(size / 2) - 4],
});

// User location icon — pulsing blue dot
const USER_LOCATION_ICON = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:32px;height:32px;">
      <div style="
        position:absolute;inset:0;border-radius:50%;
        background:rgba(59,130,246,0.25);
        animation:user-loc-pulse 2s ease-out infinite;
      "></div>
      <div style="
        position:absolute;top:50%;left:50%;
        transform:translate(-50%,-50%);
        width:14px;height:14px;
        background:#3b82f6;border-radius:50%;
        border:2.5px solid white;
        box-shadow:0 2px 10px rgba(59,130,246,0.6);
      "></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -20],
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
  const defaultStyle = {
    color,
    weight: 2,
    opacity: 0.9,
    fillOpacity: opacity,
    fillColor: color,
    dashArray: '6 4',
  };
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
            e.target.setStyle({
              fillOpacity: Math.min(opacity * 2.5, 0.35),
              weight: 3,
              opacity: 1,
              color,
              dashArray: undefined,
            });
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
function FlyToSelected({ facilities, aedPoints, dentalPoints, healthStations, selectedId }) {
  const map = useMap();
  useEffect(() => {
    if (!selectedId) return;
    const f = [...facilities, ...aedPoints, ...dentalPoints, ...healthStations].find((x) => x.id === selectedId);
    if (f && f.lat != null && f.lon != null) {
      map.flyTo([parseFloat(f.lat), parseFloat(f.lon)], 15, { duration: 1.2 });
    }
  }, [selectedId, facilities, aedPoints, dentalPoints, healthStations, map]);
  return null;
}

// Inject keyframe for user-location pulse once
const USER_LOC_STYLE_ID = 'user-loc-keyframe';
function InjectUserLocStyle() {
  useEffect(() => {
    if (document.getElementById(USER_LOC_STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = USER_LOC_STYLE_ID;
    s.textContent = `@keyframes user-loc-pulse{0%{transform:scale(0.5);opacity:0.8}80%{transform:scale(2.4);opacity:0}100%{transform:scale(2.4);opacity:0}}`;
    document.head.appendChild(s);
  }, []);
  return null;
}

// User location marker
function UserLocationMarker({ position }) {
  if (!position) return null;
  return (
    <Marker position={[position.lat, position.lng]} icon={USER_LOCATION_ICON} zIndexOffset={1000}>
      <Popup maxWidth={200} className="aed-popup">
        <div className="p-1">
          <p className="font-bold text-sm text-slate-900 mb-1">ตำแหน่งของคุณ</p>
          {position.accuracy && (
            <p className="text-xs text-slate-500">ความแม่นยำ ±{Math.round(position.accuracy)} เมตร</p>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

// Combined zoom + locate controls
function MapControls({ onLocate }) {
  const map = useMap();
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState(false);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setGeoError(true);
      setTimeout(() => setGeoError(false), 3000);
      return;
    }
    setLocating(true);
    setGeoError(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        onLocate({ lat, lng, accuracy });
        map.flyTo([lat, lng], 16, { duration: 1.5 });
        setLocating(false);
      },
      () => {
        setLocating(false);
        setGeoError(true);
        setTimeout(() => setGeoError(false), 3000);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <>
      {geoError && (
        <div className="absolute bottom-[200px] right-4 z-[1000] bg-red-500/90 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-xl shadow-lg whitespace-nowrap">
          ไม่สามารถระบุตำแหน่งได้
        </div>
      )}
      <div className="absolute bottom-8 right-4 z-[1000] flex flex-col gap-1">
        <button
          onClick={handleLocate}
          disabled={locating}
          className="w-9 h-9 bg-white/90 backdrop-blur-xl rounded-xl border border-slate-200 shadow-lg flex items-center justify-center text-sky-600 hover:bg-sky-50 hover:text-sky-700 transition-all disabled:opacity-60 select-none"
          title="แสดงตำแหน่งของฉัน"
          aria-label="แสดงตำแหน่งของฉัน"
        >
          {locating ? (
            <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={() => map.zoomIn()}
          className="w-9 h-9 bg-white/90 backdrop-blur-xl rounded-t-xl border border-slate-200 shadow-lg flex items-center justify-center text-slate-700 hover:bg-white hover:text-slate-900 transition-all text-xl font-bold leading-none select-none mt-1"
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
    </>
  );
}

export default function MapView({
  facilities = [],
  aedPoints = [],
  dentalPoints = [],
  healthStations = [],
  pickCoords = false,
  onPickCoords = null,
  onReportAED = null,
  selectedId = null,
  tileKey = 'street',
  showDistricts = true,
  showTambons = false,
}) {
  const [districtData, setDistrictData] = useState(null);
  const [tambonData, setTambonData] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [boundaryStatus, setBoundaryStatus] = useState({
    districts: showDistricts ? 'loading' : 'idle',
    tambons: showTambons ? 'loading' : 'idle',
  });
  const queueBoundaryLayerStatus = useCallback((layer, status) => {
    queueMicrotask(() => {
      setBoundaryStatus((prev) => (
        prev[layer] === status ? prev : { ...prev, [layer]: status }
      ));
    });
  }, []);

  useEffect(() => {
    if (!showDistricts) {
      queueBoundaryLayerStatus('districts', 'idle');
      return;
    }
    if (districtData) {
      queueBoundaryLayerStatus('districts', 'ready');
      return;
    }
    queueBoundaryLayerStatus('districts', 'loading');
    apiFetch('/api/geo/districts')
      .then((r) => { if (!r.ok) throw new Error('districts fetch failed'); return r.json(); })
      .then((d) => {
        if (d?.type === 'FeatureCollection') {
          setDistrictData(d);
          queueBoundaryLayerStatus('districts', 'ready');
          return;
        }
        queueBoundaryLayerStatus('districts', 'error');
      })
      .catch((error) => {
        queueBoundaryLayerStatus('districts', 'error');
        console.warn('District boundary layer unavailable:', error?.message || error);
      });
  }, [showDistricts, districtData, queueBoundaryLayerStatus]);

  useEffect(() => {
    if (!showTambons) {
      queueBoundaryLayerStatus('tambons', 'idle');
      return;
    }
    if (tambonData) {
      queueBoundaryLayerStatus('tambons', 'ready');
      return;
    }
    queueBoundaryLayerStatus('tambons', 'loading');
    apiFetch('/api/geo/tambons')
      .then((r) => { if (!r.ok) throw new Error('tambons fetch failed'); return r.json(); })
      .then((d) => {
        if (d?.type === 'FeatureCollection') {
          setTambonData(d);
          queueBoundaryLayerStatus('tambons', 'ready');
          return;
        }
        queueBoundaryLayerStatus('tambons', 'error');
      })
      .catch((error) => {
        queueBoundaryLayerStatus('tambons', 'error');
        console.warn('Tambon boundary layer unavailable:', error?.message || error);
      });
  }, [showTambons, tambonData, queueBoundaryLayerStatus]);

  const showBoundaryLoading =
    (showDistricts && boundaryStatus.districts === 'loading') ||
    (showTambons && boundaryStatus.tambons === 'loading');

  const showBoundaryError =
    (showDistricts && boundaryStatus.districts === 'error') ||
    (showTambons && boundaryStatus.tambons === 'error');

  return (
    <div className="relative w-full h-full overflow-hidden">
      {showBoundaryLoading && (
        <div className="pointer-events-none absolute left-4 top-4 z-[1000] rounded-2xl border border-sky-200 bg-white/90 px-3 py-2 text-xs font-medium text-slate-700 shadow-lg backdrop-blur-xl">
          กำลังโหลดขอบเขตแผนที่...
        </div>
      )}
      {showBoundaryError && (
        <div className="pointer-events-none absolute left-4 top-4 z-[1000] rounded-2xl border border-amber-200 bg-amber-50/95 px-3 py-2 text-xs font-medium text-amber-800 shadow-lg backdrop-blur-xl">
          โหลดขอบเขตแผนที่ไม่สำเร็จ
        </div>
      )}
      <MapContainer
        center={[6.65, 100.07]}
        zoom={11}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayerSwitcher tileKey={tileKey} />
        <InjectUserLocStyle />

        {selectedId && (
          <FlyToSelected
            facilities={facilities} aedPoints={aedPoints}
            dentalPoints={dentalPoints} healthStations={healthStations}
            selectedId={selectedId}
          />
        )}

        {showDistricts && districtData && (
          <GeoLayer data={districtData} color="#0ea5e9" opacity={0.12} />
        )}
        {showTambons && tambonData && (
          <GeoLayer data={tambonData} color="#10b981" opacity={0.08} />
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
                {onReportAED && (
                  <button
                    type="button"
                    onClick={() => onReportAED(f)}
                    className="mt-2 flex items-center justify-center gap-2 w-full py-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-all"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    แจ้งปัญหา / ของเสียหาย
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Dental unit markers (purple circle tooth icon) */}
        {dentalPoints.filter((f) => f.lat != null && f.lon != null).map((f) => (
          <Marker
            key={`dental-${f.id}`}
            position={[parseFloat(f.lat), parseFloat(f.lon)]}
            icon={f.id === selectedId ? DENTAL_ICON_SELECTED : DENTAL_ICON}
          >
            <Popup maxWidth={300} className="aed-popup">
              <div className="min-w-[240px] p-1">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8 2 5 5 5 8c0 2 .5 3.5 1 5l1 5c.3 1.5 1.5 2.5 2.5 2.5S11 19 12 17c1 2 1.5 3.5 2.5 3.5S16.7 19.5 17 18l1-5c.5-1.5 1-3 1-5 0-3-3-6-7-6z"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">{f.facility_name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 font-medium">ทันตกรรม</span>
                      <span className={`flex items-center gap-1 text-xs font-medium ${f.status ? 'text-emerald-600' : 'text-slate-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${f.status ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {f.status ? 'เปิดบริการ' : 'ปิดบริการ'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 rounded-xl p-3">
                  {f.district_name && (
                    <div className="flex gap-2"><span className="text-slate-400 w-20 flex-shrink-0">อำเภอ</span><span className="font-medium text-slate-700">{f.district_name}</span></div>
                  )}
                  {f.dental_services && (
                    <div className="flex gap-2"><span className="text-slate-400 w-20 flex-shrink-0">บริการ</span><span className="font-medium text-slate-700">{f.dental_services}</span></div>
                  )}
                  {f.dental_unit_count > 0 && (
                    <div className="flex gap-2"><span className="text-slate-400 w-20 flex-shrink-0">จำนวนยูนิต</span><span className="font-medium text-slate-700">{f.dental_unit_count} ยูนิต{f.ready_unit_count != null ? ` (พร้อม ${f.ready_unit_count})` : ''}</span></div>
                  )}
                  {f.service_days && (
                    <div className="flex gap-2"><span className="text-slate-400 w-20 flex-shrink-0">วันบริการ</span><span className="font-medium text-slate-700">{f.service_days}</span></div>
                  )}
                  {f.rotating_dental_staff_names && (
                    <div className="flex gap-2"><span className="text-slate-400 w-20 flex-shrink-0">ทันตบุคลากร</span><span className="font-medium text-slate-700">{f.rotating_dental_staff_names}</span></div>
                  )}
                  {f.repair_unit_count > 0 && (
                    <div className="flex gap-2"><span className="text-amber-500 w-20 flex-shrink-0">รอซ่อม</span><span className="font-medium text-amber-700">{f.repair_unit_count} ยูนิต</span></div>
                  )}
                  {f.broken_unit_count > 0 && (
                    <div className="flex gap-2"><span className="text-red-500 w-20 flex-shrink-0">ชำรุด</span><span className="font-medium text-red-700">{f.broken_unit_count} ยูนิต</span></div>
                  )}
                </div>
                {f.lat != null && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${parseFloat(f.lat)},${parseFloat(f.lon)}&travelmode=driving`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white mt-3 flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-violet-600 text-xs font-semibold hover:bg-violet-700 transition-all shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                    นำทาง
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Health Station markers (sky rounded square icon) */}
        {healthStations.filter((f) => f.lat != null && f.lon != null).map((f) => (
          <Marker
            key={`hs-${f.id}`}
            position={[parseFloat(f.lat), parseFloat(f.lon)]}
            icon={f.id === selectedId
              ? makeHealthStationIcon(46, true, f.is_open)
              : makeHealthStationIcon(36, false, f.is_open)}
          >
            <Popup maxWidth={300} className="aed-popup">
              <div className="min-w-[240px] p-1">
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${f.is_open ? 'bg-gradient-to-br from-sky-400 to-sky-600' : 'bg-gradient-to-br from-slate-400 to-slate-600'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">{f.station_name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${f.station_type === 'rphst' ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-sky-50 text-sky-700 border-sky-200'}`}>
                        {f.station_type === 'rphst' ? 'ใน รพ.สต.' : 'จุดชุมชน'}
                      </span>
                      <span className={`flex items-center gap-1 text-xs font-medium ${f.is_open ? 'text-emerald-600' : 'text-slate-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${f.is_open ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {f.is_open ? 'เปิดให้บริการ' : 'ปิดชั่วคราว'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 rounded-xl p-3">
                  {f.target_area && (
                    <div className="flex gap-2"><span className="text-slate-400 w-20 flex-shrink-0">พื้นที่</span><span className="font-medium text-slate-700">{f.target_area}</span></div>
                  )}
                  {f.district_name && (
                    <div className="flex gap-2"><span className="text-slate-400 w-20 flex-shrink-0">อำเภอ</span><span className="font-medium text-slate-700">{f.district_name}</span></div>
                  )}
                  {f.open_hours && (
                    <div className="flex gap-2"><span className="text-slate-400 w-20 flex-shrink-0">เวลา</span><span className="font-medium text-slate-700">{f.open_hours}</span></div>
                  )}
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-[11px] text-slate-500 font-semibold mb-1.5">อุปกรณ์</p>
                    <div className="flex flex-wrap gap-1">
                      {f.has_scale ? <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]">⚖️ ชั่ง/วัดสูง</span> : null}
                      {f.has_bp_monitor ? <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]">💉 วัดความดัน</span> : null}
                      {f.has_dtx ? <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]">🩸 เจาะ DTX</span> : null}
                      {f.has_waist_tape ? <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]">📏 สายรอบเอว</span> : null}
                      {!f.has_scale && !f.has_bp_monitor && !f.has_dtx && !f.has_waist_tape && <span className="text-slate-400 text-[10px]">ไม่มีข้อมูล</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <span className="text-slate-400 w-20 flex-shrink-0">สื่อ/เอกสาร</span>
                    <span className={`text-[10px] font-medium ${f.has_educational_materials ? 'text-emerald-600' : 'text-slate-400'}`}>{f.has_educational_materials ? '✓ มี' : '✗ ไม่มี'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-400 w-20 flex-shrink-0">อสม.ประจำ</span>
                    <span className={`text-[10px] font-medium ${f.has_aom_assigned ? 'text-emerald-600' : 'text-amber-600'}`}>{f.has_aom_assigned ? '✓ มี อสม.ประจำ' : '✗ ไม่มีประจำ'}</span>
                  </div>
                  {f.portable_equipment ? (
                    <div className="flex gap-2"><span className="text-slate-400 w-20 flex-shrink-0">อุปกรณ์</span><span className="text-[10px] text-amber-600">ขนไป-กลับ (ไม่ประจำ)</span></div>
                  ) : null}
                  {f.aom_schedule && (
                    <div className="flex gap-2 pt-1 border-t border-slate-200 mt-1"><span className="text-slate-400 w-20 flex-shrink-0">ตาราง อสม.</span><span className="font-medium text-slate-700">{f.aom_schedule}</span></div>
                  )}
                </div>
                {f.lat != null && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${parseFloat(f.lat)},${parseFloat(f.lon)}&travelmode=driving`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white mt-3 flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-gradient-to-r from-sky-400 to-sky-600 text-xs font-semibold hover:from-sky-300 hover:to-sky-500 transition-all shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                    นำทาง
                  </a>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {pickCoords && <ClickMarker onPick={onPickCoords} active={pickCoords} />}

        <UserLocationMarker position={userLocation} />
        <MapControls onLocate={setUserLocation} />
      </MapContainer>

      {/* Stats badge */}
      {(facilities.length > 0 || aedPoints.length > 0 || dentalPoints.length > 0 || healthStations.length > 0) && (
        <div className="absolute bottom-4 left-4 z-[1000]">
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-xl rounded-full px-3 py-1.5 border border-slate-200 shadow-xl flex-wrap">
            {facilities.length > 0 && (
              <>
                <span className="w-3 h-3 rounded bg-emerald-500 flex-shrink-0" />
                <span className="text-xs text-emerald-800 font-semibold">{facilities.length} หน่วยบริการ</span>
              </>
            )}
            {aedPoints.length > 0 && (
              <>
                <span className="w-px h-4 bg-slate-300" />
                <Heart className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                <span className="text-xs text-red-700 font-semibold">{aedPoints.length} AED</span>
              </>
            )}
            {dentalPoints.length > 0 && (
              <>
                <span className="w-px h-4 bg-slate-300" />
                <span className="w-3 h-3 rounded-full bg-violet-600 flex-shrink-0" />
                <span className="text-xs text-violet-800 font-semibold">{dentalPoints.length} ทันตกรรม</span>
              </>
            )}
            {healthStations.length > 0 && (
              <>
                <span className="w-px h-4 bg-slate-300" />
                <span className="w-3 h-3 rounded bg-sky-500 flex-shrink-0" />
                <span className="text-xs text-sky-800 font-semibold">{healthStations.length} Health Station</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Pick coords hint */}
      {pickCoords && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000]">
          <div className="flex items-center gap-2 bg-sky-600 rounded-full px-4 py-2 shadow-xl">
            <Info className="w-3.5 h-3.5 text-white" />
            <span className="text-xs text-white font-medium">คลิกบนแผนที่เพื่อเลือกพิกัด</span>
          </div>
        </div>
      )}
    </div>
  );
}
