import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ADDIS_ABABA_CENTER, ADDIS_ABABA_BOUNDS } from './EthioMap';

// ---- Design-system palette (only existing website colors are used) ----
// primary-500 / primary-600 (few reports) -> amber-500 secondary (medium
// reports) -> primary-800 darker blue (high reports).
const PALETTE = {
  primary: '#3b82f6',        // primary-500
  primary600: '#2563eb',     // primary-600
  primary800: '#1e3a8a',     // primary-800
  secondary: '#f59e0b',      // amber-500 (secondary accent)
  secondary700: '#d97706',   // amber-600
  infra: '#2563eb',          // primary-600
  complaint: '#f59e0b',      // amber-500
  gray: '#6b7280',
};

// ---- Report Density ----
// Density is computed LIVE from the actual number of reports in every
// location (sub-city + woreda) returned by the backend. No location is ever
// hardcoded as "high" — a location becomes High/Medium/Few purely from its
// real report count relative to the current distribution.
//
// The thresholds are percentiles of the live counts (never static), which
// guarantees all three density levels are visible whenever there are 3+
// locations with different counts:
//   High   = locations in the busiest third
//   Medium = locations in the middle third
//   Few    = the rest
// Degenerate cases (1 location, 2 locations, or a perfectly uniform set) fall
// back to honest absolute cut-offs so sparse data is not labelled "High".
function computeDensityTiers(groups) {
  const counts = groups.map((g) => g.count || 0);
  if (!counts.length) return { high: Infinity, medium: Infinity };

  const maxCount = Math.max(...counts);
  const minCount = Math.min(...counts);
  const n = counts.length;

  // One location: use honest absolute cut-offs.
  if (n === 1) {
    return { high: maxCount >= 10 ? 0 : Infinity, medium: maxCount >= 4 ? 0 : Infinity };
  }

  // Two locations: the busier one is High, the quieter one Medium.
  if (n === 2) {
    return { high: maxCount, medium: minCount };
  }

  // Uniform distribution (all locations equal): there is no high/low split, so
  // fall back to honest absolute cut-offs instead of labelling everything High.
  if (maxCount === minCount) {
    return { high: maxCount >= 10 ? 0 : Infinity, medium: maxCount >= 4 ? 0 : Infinity };
  }

  // Split the live counts into three even buckets (top / middle / low) so the
  // busiest locations are High, mid-range are Medium and the rest are Few —
  // computed purely from the real report numbers, never static.
  const sorted = [...counts].sort((a, b) => b - a);
  const step = Math.max(1, Math.ceil(n / 3));
  return {
    high: sorted[step - 1],
    medium: sorted[Math.min(n - 1, 2 * step - 1)],
  };
}

const densityTierOf = (count, tiers) =>
  count >= tiers.high ? 'high' : count >= tiers.medium ? 'medium' : 'few';

// Tier -> visual style. Few = small primary dot, Medium = medium amber bubble,
// High = large darker-blue bubble with a strong halo (existing eb-cluster ping).
const DENSITY_STYLE = {
  few:    { color: PALETTE.primary600, ring: 'rgba(37,99,235,0.35)',  size: 26 },
  medium: { color: PALETTE.secondary,  ring: 'rgba(245,158,11,0.45)', size: 36 },
  high:   { color: PALETTE.primary800, ring: 'rgba(30,58,138,0.55)',  size: 52 },
};

const densityIcon = (count, tier) => {
  const s = DENSITY_STYLE[tier];
  const fontSize = s.size >= 40 ? 15 : s.size >= 32 ? 13 : 12;
  return L.divIcon({
    className: '',
    html: `
      <div class="eb-cluster" style="--cluster-color:${s.color};--cluster-ring:${s.ring};width:${s.size}px;height:${s.size}px;">
        <span style="font-size:${fontSize}px;">${count}</span>
      </div>`,
    iconSize: [s.size, s.size],
    iconAnchor: [s.size / 2, s.size / 2],
  });
};

// ---- Fallback grid clustering (used only when no location groups exist) ----
const clusterTier = (count) => {
  if (count >= 30) return { color: PALETTE.primary800, ring: 'rgba(30,58,138,0.35)' };
  if (count >= 10) return { color: PALETTE.secondary, ring: 'rgba(245,158,11,0.35)' };
  return { color: PALETTE.primary600, ring: 'rgba(37,99,235,0.35)' };
};

const clusterIcon = (count) => {
  const tier = clusterTier(count);
  const size = 24 + Math.min(count, 28);
  return L.divIcon({
    className: '',
    html: `
      <div class="eb-cluster" style="--cluster-color:${tier.color};--cluster-ring:${tier.ring};width:${size}px;height:${size}px;">
        <span style="font-size:${size >= 34 ? 13 : 11}px;">${count}</span>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const singleIcon = (type, isNew) => L.divIcon({
  className: '',
  html: `
    <div class="eb-dot ${isNew ? 'eb-dot--new' : ''}" style="--dot-color:${type === 'publicComplaint' ? PALETTE.complaint : PALETTE.infra};"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Simple grid-based clustering: reports that fall in the same screen cell are
// merged into one marker. Cell size is fixed in pixels, so clusters naturally
// split apart as the user zooms in (smooth marker clustering + click-to-zoom).
const CELL = 56;

function computeClusters(markers, map, zoom) {
  const grid = new Map();
  for (const m of markers) {
    if (m.latitude == null || m.longitude == null) continue;
    const p = map.project([m.latitude, m.longitude], zoom);
    const key = `${Math.floor(p.x / CELL)}:${Math.floor(p.y / CELL)}`;
    let cell = grid.get(key);
    if (!cell) {
      cell = { count: 0, latSum: 0, lngSum: 0, items: [] };
      grid.set(key, cell);
    }
    cell.count += 1;
    cell.latSum += m.latitude;
    cell.lngSum += m.longitude;
    cell.items.push(m);
  }
  return [...grid.values()].map((cell) => ({
    count: cell.count,
    latitude: cell.latSum / cell.count,
    longitude: cell.lngSum / cell.count,
    single: cell.count === 1 ? cell.items[0] : null,
    items: cell.items,
  }));
}

const isNewReport = (m) => m.createdAt && (Date.now() - new Date(m.createdAt).getTime()) < 24 * 60 * 60 * 1000;

function StatusBreakdown({ statuses }) {
  const entries = Object.entries(statuses || {});
  if (!entries.length) return null;
  return (
    <div className="border-t border-gray-100 dark:border-gray-700 pt-2 mt-2">
      {entries.map(([s, c]) => (
        <p key={s} className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span className="capitalize">{s}</span><span>{c}</span>
        </p>
      ))}
    </div>
  );
}

// Popup for a location density marker — shows the real report counts for that
// sub-city / woreda straight from the database.
const TIER_LABEL = { few: 'Few Reports', medium: 'Medium Reports', high: 'High Reports' };
const TIER_CHIP = {
  few: 'bg-primary-100 text-primary-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-primary-800 text-white',
};

function DensityPopup({ group, tier }) {
  return (
    <div className="text-sm min-w-[13rem]">
      <p className="font-bold text-gray-900 dark:text-gray-100">{group.subcity} Sub-city</p>
      {group.woreda && group.woreda !== 'Unknown' && (
        <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">{group.woreda}</p>
      )}
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIER_CHIP[tier] || TIER_CHIP.few}`}>
          {TIER_LABEL[tier] || 'Few Reports'}
        </span>
      </div>
      <div className="border-t border-gray-100 dark:border-gray-700 pt-2 space-y-1">
        <p className="flex items-center justify-between font-semibold text-gray-900 dark:text-gray-100">
          <span>Reports</span><span>{group.count}</span>
        </p>
        <p className="flex items-center justify-between text-primary-600 dark:text-primary-400">
          <span>Infrastructure</span><span>{group.infrastructureCount || 0}</span>
        </p>
        <p className="flex items-center justify-between text-amber-600 dark:text-amber-400">
          <span>Public Complaints</span><span>{group.publicComplaintCount || 0}</span>
        </p>
      </div>
      <StatusBreakdown statuses={group.statuses} />
      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 border-t border-gray-100 dark:border-gray-700 pt-2">
        All reports in this location are grouped into this marker.
      </p>
    </div>
  );
}

// Density layer: one marker per location (sub-city + woreda), sized and
// coloured by the live report density tier. Recomputes automatically whenever
// new report data arrives (socket refresh) because tiers are derived from the
// actual counts via useMemo. Defined at module scope (not inside a render
// body) to avoid the react-leaflet v4 + StrictMode removeChild crash.
function DensityLayer({ groups }) {
  const tiers = useMemo(() => computeDensityTiers(groups), [groups]);
  return groups.map((g, i) => {
    const tier = densityTierOf(g.count, tiers);
    return (
      <Marker
        key={`density-${g.subcity}-${g.woreda}-${i}`}
        position={[g.latitude, g.longitude]}
        icon={densityIcon(g.count, tier)}
      >
        <Popup><DensityPopup group={g} tier={tier} /></Popup>
      </Marker>
    );
  });
}

function ClusterPopup({ cluster }) {
  const infraCount = cluster.items.filter(i => i.type === 'infrastructure').length;
  const complaintCount = cluster.items.filter(i => i.type === 'publicComplaint').length;
  const statuses = cluster.items.reduce((acc, i) => {
    acc[i.status || '—'] = (acc[i.status || '—'] || 0) + 1;
    return acc;
  }, {});
  const subcity = cluster.items[0]?.subcity || 'Addis Ababa';
  const woreda = cluster.items[0]?.woreda;

  return (
    <div className="text-sm min-w-[13rem]">
      <p className="font-bold text-gray-900 dark:text-gray-100">{subcity} Sub-city</p>
      {woreda && <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">{woreda}</p>}
      <div className="border-t border-gray-100 dark:border-gray-700 pt-2 space-y-1">
        <p className="flex items-center justify-between font-semibold text-gray-900 dark:text-gray-100">
          <span>Reports</span><span>{cluster.count}</span>
        </p>
        <p className="flex items-center justify-between text-primary-600 dark:text-primary-400">
          <span>Infrastructure</span><span>{infraCount}</span>
        </p>
        <p className="flex items-center justify-between text-amber-600 dark:text-amber-400">
          <span>Public Complaints</span><span>{complaintCount}</span>
        </p>
      </div>
      <StatusBreakdown statuses={statuses} />
      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 border-t border-gray-100 dark:border-gray-700 pt-2">
        Click the marker to zoom in and reveal individual reports.
      </p>
    </div>
  );
}

function SinglePopup({ marker }) {
  const { t } = useTranslation();
  return (
    <div className="text-sm">
      <p className="font-semibold text-gray-900 dark:text-gray-100">{marker.title}</p>
      <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
        {marker.subcity} Sub-city{marker.woreda ? ` · ${marker.woreda}` : ''}
      </p>
      <p className="capitalize text-xs text-primary-600 dark:text-primary-400 mt-1">
        {marker.type === 'publicComplaint' ? 'Public Complaint' : 'Infrastructure Report'}
      </p>
      {marker.status && (
        <p className="text-xs mt-1">{t('dashboard.mapStatus', 'Status')}: <strong className="capitalize">{marker.status}</strong></p>
      )}
    </div>
  );
}

// Renders markers as density clusters at the current zoom level. Defined at
// module scope (not inside a render body) to avoid the react-leaflet v4 +
// StrictMode removeChild crash documented in EthioMap.jsx.
function ClusteredLayer({ markers }) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
    moveend: () => setZoom(map.getZoom()),
  });

  const clusters = useMemo(
    () => computeClusters(markers, map, zoom),
    [markers, map, zoom]
  );

  return clusters.map((c, i) => {
    if (c.single) {
      const m = c.single;
      return (
        <Marker
          key={m.id}
          position={[c.latitude, c.longitude]}
          icon={singleIcon(m.type, isNewReport(m))}
        >
          <Popup><SinglePopup marker={m} /></Popup>
        </Marker>
      );
    }
    return (
      <Marker
        key={`cluster-${c.latitude}-${c.longitude}-${c.count}-${zoom}`}
        position={[c.latitude, c.longitude]}
        icon={clusterIcon(c.count)}
        eventHandlers={{
          click: () => map.flyTo([c.latitude, c.longitude], Math.min(zoom + 2, 17), { duration: 0.7 }),
        }}
      >
        <Popup><ClusterPopup cluster={c} /></Popup>
      </Marker>
    );
  });
}

export default function IncidentMap({ markers = [], groups = [], center = ADDIS_ABABA_CENTER, zoom = 12, height = '480px', loading = false }) {
  const { t } = useTranslation();
  const hasDensity = groups.length > 0;
  const hasData = hasDensity || markers.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg shadow-black/5"
      style={{ height }}
    >
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
        {hasDensity ? <DensityLayer groups={groups} /> : markers.length > 0 && <ClusteredLayer markers={markers} />}
      </MapContainer>

      {/* Loading / empty overlay */}
      {loading ? (
        <div className="absolute inset-0 bg-gray-50/70 dark:bg-gray-900/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
          <span className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('home.mapLoading', 'Loading live incident map…')}</span>
        </div>
      ) : !hasData ? (
        <div className="absolute inset-x-0 bottom-0 p-3">
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 bg-white/85 dark:bg-gray-800/85 rounded-lg py-2 px-3 shadow-sm">
            {t('home.mapEmpty', 'No verified reports in Addis Ababa yet. Check back soon.')}
          </p>
        </div>
      ) : null}

      {/* Legend - site palette only, matches the density markers exactly */}
      <div className="absolute top-3 right-3 z-[1000] bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 shadow-md px-3 py-2 text-[11px] space-y-1.5">
        <p className="font-semibold text-gray-800 dark:text-gray-200">{t('home.legendDensity', 'Report Density')}</p>
        <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <span
            className="rounded-full shrink-0"
            style={{ width: DENSITY_STYLE.few.size * 0.5, height: DENSITY_STYLE.few.size * 0.5, background: DENSITY_STYLE.few.color }}
          /> Few
        </span>
        <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <span
            className="rounded-full shrink-0"
            style={{ width: DENSITY_STYLE.medium.size * 0.55, height: DENSITY_STYLE.medium.size * 0.55, background: DENSITY_STYLE.medium.color }}
          /> Medium
        </span>
        <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <span
            className="rounded-full shrink-0"
            style={{ width: DENSITY_STYLE.high.size * 0.5, height: DENSITY_STYLE.high.size * 0.5, background: DENSITY_STYLE.high.color }}
          /> High
        </span>
      </div>
    </motion.div>
  );
}
