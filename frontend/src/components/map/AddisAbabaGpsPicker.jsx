import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { LocateFixed, TriangleAlert, MapPinCheck } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ADDIS_ABABA_CENTER, ADDIS_ABABA_BOUNDS, isWithinAddisAbaba } from './EthioMap';
import PlaceSearchBox from './PlaceSearchBox';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const GPS_TIMEOUT_MS = 15000;

// Both helpers live at module scope. Defining them inside the render body would
// give them a new identity on every render, making React unmount/remount them
// each time and letting Leaflet DOM mutations race the React commit phase.
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

// Click-to-pin restricted to Addis Ababa. Clicks outside the city boundary are
// ignored so a marker can never be placed outside the allowed area.
function MapClickHandler({ onLocationSelect }) {
  const map = useMap();
  useEffect(() => {
    const handler = (e) => {
      const { lat, lng } = e.latlng;
      if (!isWithinAddisAbaba(lat, lng)) return;
      onLocationSelect({ lat, lng, capturedAt: null });
    };
    map.on('click', handler);
    return () => { map.off('click', handler); };
  }, [map, onLocationSelect]);
  return null;
}

/**
 * GPS picker locked to Addis Ababa.
 *
 * - "Use My Current Location" requests the browser GPS permission, detects the
 *   user's exact coordinates, places the marker at that spot and centers the map.
 * - Clicking the map pins a location, but only inside Addis Ababa.
 * - `onLocationSelect({ lat, lng, capturedAt })` is called with every pin so the
 *   parent can save the coordinates with the complaint.
 */
export default function AddisAbabaGpsPicker({
  position,
  onLocationSelect,
  onClear,
  error,
  height,
}) {
  const [gpsStatus, setGpsStatus] = useState('idle'); // idle | locating | error
  const [gpsError, setGpsError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const handleSelectPlace = ({ lat, lng, displayName }) => {
    setSearchQuery(displayName.split(',').slice(0, 2).join(','));
    onLocationSelect({ lat, lng, capturedAt: null });
  };

  const handleRemoveLocation = () => {
    setSearchQuery('');
    onClear();
  };

  const handleUseMyLocation = () => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('error');
      setGpsError('GPS is not supported by this browser.');
      return;
    }
    setGpsStatus('locating');
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // The GPS response can arrive after the picker has unmounted (user
        // navigated away while the permission prompt was open). Ignore it so we
        // never call setState or onLocationSelect during map teardown.
        if (!isMounted.current) return;
        const { latitude, longitude } = pos.coords;
        if (!isWithinAddisAbaba(latitude, longitude)) {
          setGpsStatus('error');
          setGpsError('Your current location is outside Addis Ababa. This form only accepts complaints inside Addis Ababa.');
          return;
        }
        setGpsStatus('idle');
        onLocationSelect({ lat: latitude, lng: longitude, capturedAt: new Date().toISOString() });
      },
      (err) => {
        if (!isMounted.current) return;
        setGpsStatus('error');
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('Location permission was denied. Allow location access to submit your complaint.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGpsError('Your current location could not be determined. Try again.');
        } else if (err.code === err.TIMEOUT) {
          setGpsError('Timed out waiting for your location. Try again.');
        } else {
          setGpsError('Unable to get your location. Try again.');
        }
      },
      { enableHighAccuracy: true, timeout: GPS_TIMEOUT_MS, maximumAge: 0 }
    );
  };

  return (
    <div>
      {/* ── Search a subcity, street or landmark ── */}
      <PlaceSearchBox
        value={searchQuery}
        onChange={setSearchQuery}
        onSelect={handleSelectPlace}
        placeholder="Search a subcity, street or landmark in Addis Ababa"
        className="mb-2"
      />

      <div
        className={`w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 ${height ? '' : 'h-56 sm:h-72'}`}
        style={height ? { height } : undefined}
      >
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
          <MapClickHandler onLocationSelect={onLocationSelect} />
          <FlyToPosition position={position} />
          {position && <Marker position={[position.lat, position.lng]} />}
        </MapContainer>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={gpsStatus === 'locating'}
          className="btn-primary px-4 py-2 text-sm disabled:opacity-60"
        >
          {gpsStatus === 'locating' ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Getting location...
            </span>
          ) : (
            <span className="flex items-center gap-2"><LocateFixed className="w-4 h-4" /> Use My Current Location</span>
          )}
        </button>
        {position && (
          <button
            type="button"
            onClick={handleRemoveLocation}
            className="text-xs text-red-500 hover:text-red-700 font-medium"
          >
            Remove location
          </button>
        )}
      </div>

      {position && (
        <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-xs text-green-700 dark:text-green-300">
          <p className="inline-flex items-center gap-1.5"><MapPinCheck className="w-3.5 h-3.5" /> Location pinned: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}</p>
        </div>
      )}

      {gpsStatus === 'error' && gpsError && (
        <p className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1"><TriangleAlert size={14} strokeWidth={2} className="shrink-0" /> {gpsError}</p>
      )}

      {error && (
        <p className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1"><TriangleAlert size={14} strokeWidth={2} className="shrink-0" /> {error}</p>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Search for a subcity or street, tap the map to pin the exact complaint location, or use your current GPS position.
        Only locations inside Addis Ababa are accepted.
      </p>
    </div>
  );
}
