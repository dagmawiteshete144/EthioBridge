import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { alertAPI, locationAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { Megaphone, CircleCheck, Landmark, MapPin, CalendarDays } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import {
  ALERT_SEVERITY_STYLES,
  ALERT_CATEGORY_OPTIONS,
  ALERT_SEVERITIES,
  getAlertCategory,
  alertLocationLabel,
  alertIssuerLabel,
} from '../../utils/alertConstants';

const SEVERITY_ORDER = { Critical: 0, Warning: 1, Info: 2 };

const EMPTY_FILTERS = { category: '', severity: '', subcity: '' };

export default function AlertList() {
  const { on } = useSocket() || {};
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [subcities, setSubcities] = useState([]);
  const fetchingRef = useRef(false);

  const fetchAlerts = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const params = { page, limit: 9 };
      if (filters.category) params.category = filters.category;
      if (filters.severity) params.severity = filters.severity;
      if (filters.subcity) {
        params.subcity = filters.subcity;
      } else if (user?.role === 'citizen' && user.subcity) {
        params.subcity = user.subcity;
        if (user.woredaName) params.woreda = user.woredaName;
      }
      const res = await alertAPI.getActive(params);
      setAlerts(res.data?.data?.alerts || []);
      setPages(res.data?.data?.pages || 1);
      setTotal(res.data?.data?.total || 0);
    } catch (e) {
      console.error('Failed to load alerts:', e);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [page, filters, user?.role, user?.subcity, user?.woredaName]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  useEffect(() => {
    let cancelled = false;
    locationAPI.getSubcities()
      .then(res => { if (!cancelled) setSubcities(res.data?.subcities || []); })
      .catch(e => console.error('Failed to load subcities:', e));
    return () => { cancelled = true; };
  }, []);

  const handleFilterChange = (name, value) => {
    setFilters(p => ({ ...p, [name]: value }));
    setPage(1);
  };

  useEffect(() => {
    if (!on) return;
    const offNew = on('alert:new', () => { setPage(1); fetchAlerts(); });
    const offUpdated = on('alert:updated', fetchAlerts);
    const offDeleted = on('alert:deleted', fetchAlerts);
    return () => { offNew?.(); offUpdated?.(); offDeleted?.(); };
  }, [on, fetchAlerts]);

  const sorted = [...alerts].sort((a, b) =>
    (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9)
  );

  return (
    <div className="py-12 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3"><Megaphone className="inline-block mr-2" size={30} strokeWidth={2} /> Public Alerts</h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Real-time public notices, weather updates, and service advisories issued by government authorities.
          </p>
          {total > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">{total} active alert{total === 1 ? '' : 's'}</p>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <select
            value={filters.category}
            onChange={e => handleFilterChange('category', e.target.value)}
            className="input-field w-auto min-w-[150px] text-sm"
          >
            <option value="">All Categories</option>
            {ALERT_CATEGORY_OPTIONS.map(c => (
              <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
            ))}
          </select>
          <select
            value={filters.severity}
            onChange={e => handleFilterChange('severity', e.target.value)}
            className="input-field w-auto min-w-[140px] text-sm"
          >
            <option value="">All Severities</option>
            {ALERT_SEVERITIES.map(s => (
              <option key={s.v} value={s.v}>{s.icon} {s.v}</option>
            ))}
          </select>
          <select
            value={filters.subcity}
            onChange={e => handleFilterChange('subcity', e.target.value)}
            className="input-field w-auto min-w-[150px] text-sm"
          >
            <option value="">All Subcities</option>
            {subcities.map(s => (
              <option key={s._id} value={s.name}>{s.name}</option>
            ))}
          </select>
          {(filters.category || filters.severity || filters.subcity) && (
            <button
              onClick={() => { setFilters({ ...EMPTY_FILTERS }); setPage(1); }}
              className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={<CircleCheck size={48} strokeWidth={2} />}
            title={filters.category || filters.severity || filters.subcity ? 'No matching alerts' : 'No active alerts'}
            description={filters.category || filters.severity || filters.subcity
              ? 'No active alerts match your filters. Try clearing a filter to see more results.'
              : 'There are no active public alerts right now. Check back soon for updates.'}
          />
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {sorted.map(alert => {
                const cat = getAlertCategory(alert.category);
                return (
                  <Link key={alert._id} to={`/alerts/${alert._id}`} className="card hover:shadow-lg transition-shadow group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl">
                        {cat.icon}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ALERT_SEVERITY_STYLES[alert.severity] || ''}`}>
                          {alert.severity}
                        </span>
                        <span className="text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                          {cat.label}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1 line-clamp-2 group-hover:text-primary-600 transition-colors">
                      {alert.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 mb-3">
                      {alert.description}
                    </p>
                    <div className="mt-auto space-y-1 text-xs text-gray-400 dark:text-gray-500">
                      <p className="truncate"><Landmark className="inline mr-1.5" size={14} strokeWidth={2} />{alertIssuerLabel(alert)}</p>
                      <p className="truncate"><MapPin className="inline mr-1.5" size={14} strokeWidth={2} />{alertLocationLabel(alert) || 'Addis Ababa'}</p>
                      <p><CalendarDays className="inline mr-1.5" size={14} strokeWidth={2} />{new Date(alert.publishedAt || alert.createdAt).toLocaleDateString()}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="mt-8">
              <Pagination page={page} pages={pages} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
