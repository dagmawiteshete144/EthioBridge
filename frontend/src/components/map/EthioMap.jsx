import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import { LocateFixed, TriangleAlert } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import PlaceSearchBox from './PlaceSearchBox';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export const ADDIS_ABABA_CENTER = [8.9806, 38.7578];
export const ADDIS_ABABA_BOUNDS = [[8.82, 38.6], [9.1, 38.95]];

export const isWithinAddisAbaba = (lat, lng) => {
  const [[minLat, minLng], [maxLat, maxLng]] = ADDIS_ABABA_BOUNDS;
  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
};

const typeColors = {
  infrastructure: '#3b82f6',
  publicComplaint: '#f59e0b',
};

const createIcon = (type) =>
  L.divIcon({
    className: '',
    html: `<div style="background:${typeColors[type] || '#6b7280'};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

// Grouped analytics marker: one bubble per sub-city + woreda whose size grows
// with the number of reports and whose color reflects the dominant report type.
const createGroupIcon = (g) => {
  const dominant = g.publicComplaintCount > g.infrastructureCount ? typeColors.publicComplaint : typeColors.infrastructure;
  const size = 20 + Math.min(g.count, 24);
  return L.divIcon({
    className: '',
    html: `<div style="background:${dominant};width:${size}px;height:${size}px;border-radius:50%;border:3px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:${size >= 30 ? 12 : 10}px;line-height:1;">${g.count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const displayWoreda = (w) => (w && /woreda/i.test(w) ? w : `Woreda ${w || 'Unknown'}`);

// These helpers are defined at module scope, NOT inside a render body.
// A component defined inside another component is recreated on every render,
// which forces React to unmount and remount it each time and lets Leaflet DOM
// mutations race React's fiber commit phase (the removeChild crash).
function MapEffects({ onLocationSelect }) {
  const map = useMap();
  useEffect(() => {
    const handler = (e) => {
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    };
    map.on('click', handler);
    return () => { map.off('click', handler); };
  }, [map, onLocationSelect]);
  return null;
}

function FlyToPosition({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], 15, { duration: 1.2 });
    } else {
      map.flyTo(ADDIS_ABABA_CENTER, 12, { duration: 1.2 });
    }
  }, [position, map]);
  return null;
}

// Only flies the map when a search result has been picked, so callers that pass
// their own `center`/`zoom` are never overridden on initial render.
function FlyToSearchPosition({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], 15, { duration: 1.2 });
    }
  }, [position, map]);
  return null;
}

export default function EthioMap({ markers = [], groups = [], center = ADDIS_ABABA_CENTER, zoom = 13, height = '400px', searchable = false }) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchPosition, setSearchPosition] = useState(null);
  // Defensive filter: only Addis Ababa markers are ever rendered. Coordinates
  // outside the city bounds are dropped so they can never appear on the map.
  const addisMarkers = markers.filter(m =>
    isWithinAddisAbaba(Number(m.latitude), Number(m.longitude))
  );
  const hasGroups = groups.length > 0;
  return (
    <div>
      {searchable && (
        <PlaceSearchBox
          value={searchQuery}
          onChange={(v) => { setSearchQuery(v); if (!v) setSearchPosition(null); }}
          onSelect={({ lat, lng }) => setSearchPosition({ lat, lng })}
          placeholder="Search a city, subcity or landmark"
          className="mb-2"
        />
      )}
      <div style={{ height }} className="w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
      <MapContainer
        center={center}
        zoom={zoom}
        minZoom={11}
        maxBounds={ADDIS_ABABA_BOUNDS}
        maxBoundsViscosity={1.0}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {searchable && <FlyToSearchPosition position={searchPosition} />}
        {hasGroups ? (
          groups.map((g, i) => (
            <Marker key={i} position={[g.latitude, g.longitude]} icon={createGroupIcon(g)}>
              <Popup>
                <div className="text-sm min-w-[13rem]">
                  <p className="font-bold text-gray-900 dark:text-gray-100">{g.subcity} Sub-city</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">{displayWoreda(g.woreda)}</p>
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-2 space-y-1">
                    <p className="flex items-center justify-between font-semibold text-gray-900 dark:text-gray-100">
                      <span>Reports</span><span>{g.count}</span>
                    </p>
                    <p className="flex items-center justify-between text-blue-600 dark:text-blue-400">
                      <span>Infrastructure</span><span>{g.infrastructureCount}</span>
                    </p>
                    <p className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                      <span>Public Complaints</span><span>{g.publicComplaintCount}</span>
                    </p>
                  </div>
                  {Object.keys(g.statuses).length > 0 && (
                    <div className="border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
                      {Object.entries(g.statuses).map(([s, c]) => (
                        <p key={s} className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span className="capitalize">{s}</span><span>{c}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))
        ) : (
          addisMarkers.map((m, i) => (
            <Marker key={i} position={[m.latitude, m.longitude]} icon={createIcon(m.type)}>
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{m.title || m.fullName}</p>
                  <p className="text-gray-600">{m.region || m.lastKnownRegion}</p>
                  <p className="capitalize text-xs text-gray-500 mt-1">{m.type?.replace('_', ' ')}</p>
                  {m.status && <p className="text-xs mt-1">{t('dashboard.mapStatus')}: <strong>{m.status}</strong></p>}
                </div>
              </Popup>
            </Marker>
          ))
        )}
      </MapContainer>
    </div>
    </div>
  );
}

// Click-to-pin picker locked to Addis Ababa. Includes a "Use My Current
// Location" button that requests GPS permission and centers the map on the
// user's exact position (validated to be inside Addis Ababa).
export function LocationPicker({ onLocationSelect, position }) {
  const { t } = useTranslation();
  const [gpsStatus, setGpsStatus] = useState('idle'); // idle | locating | error
  const [gpsError, setGpsError] = useState('');
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const handleUseMyLocation = () => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('error');
      setGpsError('GPS is not supported by this browser');
      return;
    }
    setGpsStatus('locating');
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // The GPS response can arrive after the picker has unmounted (user
        // navigated away while the prompt was open). Ignore it so React never
        // mutates DOM that is already being torn down.
        if (!isMounted.current) return;
        const { latitude, longitude } = pos.coords;
        if (!isWithinAddisAbaba(latitude, longitude)) {
          setGpsStatus('error');
          setGpsError('Your current location is outside Addis Ababa. Please select a location inside Addis Ababa.');
          return;
        }
        onLocationSelect({ lat: latitude, lng: longitude });
        setGpsStatus('idle');
      },
      (err) => {
        if (!isMounted.current) return;
        setGpsStatus('error');
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('Location permission was denied. Allow location access to use your current location.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGpsError('Your current location could not be determined. Try again.');
        } else if (err.code === err.TIMEOUT) {
          setGpsError('Timed out waiting for your location. Try again.');
        } else {
          setGpsError('Unable to get your location. Try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  return (
    <div>
      <div className="w-full rounded-xl overflow-hidden border border-gray-200" style={{ height: '300px' }}>
        <MapContainer
          center={ADDIS_ABABA_CENTER}
          zoom={12}
          minZoom={10}
          maxBounds={ADDIS_ABABA_BOUNDS}
          maxBoundsViscosity={1.0}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEffects onLocationSelect={onLocationSelect} />
          <FlyToPosition position={position} />
          {position && <Marker position={[position.lat, position.lng]} />}
        </MapContainer>
      </div>
      <div className="mt-2">
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={gpsStatus === 'locating'}
          className="btn-primary px-3 py-1.5 text-xs disabled:opacity-60"
        >
          {gpsStatus === 'locating' ? (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Getting location...
            </span>
          ) : (
            <span className="flex items-center gap-1.5"><LocateFixed className="w-3.5 h-3.5" /> Use My Current Location</span>
          )}
        </button>
      </div>
      {gpsStatus === 'error' && gpsError && (
        <p className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1"><TriangleAlert size={14} strokeWidth={2} className="shrink-0" /> {gpsError}</p>
      )}
      <p className="text-xs text-gray-500 mt-1">{t('dashboard.clickMapToSelect')}</p>
    </div>
  );
}

// GPS-driven picker for the citizen Create Report flow. It is locked to Addis
// Ababa and does NOT place a pin on click — the marker always reflects the real
// GPS position captured via the browser's geolocation API.
export function GpsLocationPicker({ position, height = '300px' }) {
  return (
    <div className="w-full rounded-xl overflow-hidden border border-gray-200" style={{ height }}>
      <MapContainer
        center={ADDIS_ABABA_CENTER}
        zoom={12}
        minZoom={10}
        maxBounds={ADDIS_ABABA_BOUNDS}
        maxBoundsViscosity={1.0}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyToPosition position={position} />
        {position && <Marker position={[position.lat, position.lng]} />}
      </MapContainer>
    </div>
  );
}
