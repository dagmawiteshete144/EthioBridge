import { useEffect, useRef, useState } from 'react';
import { Search, X, TriangleAlert } from 'lucide-react';
import { isWithinAddisAbaba } from './EthioMap';
import { locationAPI } from '../../services/api';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const SEARCH_DEBOUNCE_MS = 400;

// Approximate center coordinates for the three supported Addis Ababa subcities.
// They are used by the local (database-backed) fallback so a search for
// "Yeka", "Bole" or "Lemmi Kura" — plus every woreda in the database — works
// even when the external Nominatim geocoder is unreachable or has no entry for
// the spelling used on this site (e.g. "Lemmi Kura" is not in Nominatim).
const SUBCITY_COORDS = {
  Bole: [8.9823, 38.8384],
  Yeka: [9.0488, 38.8283],
  'Lemmi Kura': [9.0167, 38.872],
};

const normalize = (s = '') => String(s).toLowerCase().trim();

const subcityCoords = (name) => {
  const key = Object.keys(SUBCITY_COORDS).find((k) => normalize(k) === normalize(name));
  return key ? SUBCITY_COORDS[key] : SUBCITY_COORDS.Bole;
};

/**
 * Reusable city / place search box for Addis Ababa.
 *
 * Subcities and woredas are loaded live from the database and matched locally
 * so the three supported subcities always appear in results. OpenStreetMap
 * Nominatim (no API key required) is still queried as a supplementary source
 * for streets and landmarks. `onSelect({ lat, lng, displayName })` fires only
 * when the picked place is inside Addis Ababa; out-of-city results show an
 * inline error.
 */
export default function PlaceSearchBox({
  value,
  onChange,
  onSelect,
  placeholder = 'Search a city, subcity or landmark',
  className = '',
}) {
  const [localPlaces, setLocalPlaces] = useState([]);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const boxRef = useRef(null);
  const seqRef = useRef(0);

  // Close the suggestion dropdown when clicking anywhere outside the search box.
  useEffect(() => {
    const onOutsideClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, []);

  // Load the supported subcities and their woredas from the database so the
  // search never depends solely on the external geocoder.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await locationAPI.getSubcities();
        const subcities = res.data.subcities || [];
        if (cancelled) return;
        const places = subcities.map((s) => {
          const coords = subcityCoords(s.name);
          return {
            place_id: `local-subcity-${s._id}`,
            name: s.name,
            subcity: s.name,
            lat: coords[0],
            lon: coords[1],
            display_name: `${s.name}, Addis Ababa, Ethiopia`,
          };
        });
        for (const s of subcities) {
          try {
            const wr = await locationAPI.getWoredasBySubcity(s._id);
            const woredas = wr.data.woredas || [];
            const coords = subcityCoords(s.name);
            for (const w of woredas) {
              const wname = w.woredaName || w.name;
              places.push({
                place_id: `local-woreda-${w._id}`,
                name: wname,
                subcity: s.name,
                lat: coords[0],
                lon: coords[1],
                display_name: `${wname}, ${s.name}, Addis Ababa, Ethiopia`,
              });
            }
          } catch { /* skip woredas that fail to load */ }
        }
        if (!cancelled) setLocalPlaces(places);
      } catch { /* keep localPlaces empty — Nominatim still works on its own */ }
    })();
    return () => { cancelled = true; };
  }, []);

  // Debounced search: match known subcities/woredas locally first, then enrich
  // with OpenStreetMap Nominatim for streets and landmarks.
  useEffect(() => {
    if (!value || value.trim().length < 2) {
      setResults([]);
      setOpen(false);
      setSearching(false);
      setError('');
      return;
    }

    const query = value.trim();
    const q = normalize(query);
    const localMatches = localPlaces.filter(
      (p) => normalize(p.name).includes(q) || normalize(p.subcity || '').includes(q)
    );

    const seq = ++seqRef.current;
    const controller = new AbortController();

    const finish = (remoteResults) => {
      if (seq !== seqRef.current) return;
      const seen = new Set(localMatches.map((p) => normalize(p.display_name)));
      const combined = [
        ...localMatches,
        ...remoteResults.filter((p) => {
          const key = normalize(p.display_name || p.name);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }),
      ];
      setResults(combined);
      setOpen(true);
      setError('');
    };

    const timer = setTimeout(async () => {
      setSearching(true);
      setError('');
      try {
        const url = `${NOMINATIM_URL}?format=jsonv2&limit=6&countrycodes=et&q=${encodeURIComponent(query)}`;
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { 'Accept-Language': 'en' },
        });
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        if (seq !== seqRef.current) return;
        if (data.length === 0 && localMatches.length === 0) {
          setResults([]);
          setOpen(true);
          setError('');
        } else {
          finish(data);
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        if (seq !== seqRef.current) return;
        // The external geocoder failed — fall back to the database results so
        // the supported subcities and woredas are still searchable.
        if (localMatches.length > 0) {
          finish([]);
        } else {
          setResults([]);
          setError('City search is unavailable right now. Try again later.');
        }
      } finally {
        if (seq === seqRef.current) setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, localPlaces]);

  const handlePick = (place) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    if (!isWithinAddisAbaba(lat, lng)) {
      setError('This place is outside Addis Ababa. Only locations inside the city are accepted.');
      setOpen(false);
      return;
    }
    setError('');
    setOpen(false);
    onSelect({ lat, lng, displayName: place.display_name });
  };

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" strokeWidth={2} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }}
          placeholder={placeholder}
          aria-label={placeholder}
          className="input-field pl-9 pr-9 text-sm"
        />
        {searching ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        ) : value ? (
          <button
            type="button"
            onClick={() => { onChange(''); setResults([]); setOpen(false); setError(''); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        ) : null}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-56 overflow-y-auto">
          {results.map((p) => (
            <li key={p.place_id}>
              <button
                type="button"
                onClick={() => handlePick(p)}
                className="w-full text-left px-3 py-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
              >
                <span className="block text-sm text-gray-800 dark:text-gray-100 truncate">{p.display_name.split(',')[0]}</span>
                <span className="block text-xs text-gray-400 dark:text-gray-500 truncate">{p.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && !searching && value.trim().length >= 2 && results.length === 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
          No places found. Try a different name.
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1"><TriangleAlert size={14} strokeWidth={2} className="shrink-0" /> {error}</p>
      )}
    </div>
  );
}
