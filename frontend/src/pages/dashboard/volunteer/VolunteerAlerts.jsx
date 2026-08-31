import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { alertAPI } from '../../../services/api';
import { useSocket } from '../../../context/SocketContext';
import PageHeader from '../../../components/common/PageHeader';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import EmptyState from '../../../components/common/EmptyState';
import Pagination from '../../../components/common/Pagination';
import { CircleCheck, Landmark, MapPin, CalendarDays, Megaphone } from 'lucide-react';
import {
  ALERT_SEVERITY_STYLES,
  ALERT_CATEGORY_OPTIONS,
  ALERT_SEVERITIES,
  getAlertCategory,
  alertLocationLabel,
  alertIssuerLabel,
} from '../../../utils/alertConstants';

const SEVERITY_ORDER = { Critical: 0, Warning: 1, Info: 2 };

const EMPTY_FILTERS = { category: '', severity: '' };

export default function VolunteerAlerts() {
  const { t } = useTranslation();
  const { on } = useSocket() || {};
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const fetchingRef = useRef(false);

  const fetchAlerts = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const params = { page, limit: 9 };
      if (filters.category) params.category = filters.category;
      if (filters.severity) params.severity = filters.severity;
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
  }, [page, filters]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  useEffect(() => {
    if (!on) return;
    const offNew = on('alert:new', () => { setPage(1); fetchAlerts(); });
    const offUpdated = on('alert:updated', fetchAlerts);
    const offDeleted = on('alert:deleted', fetchAlerts);
    return () => { offNew?.(); offUpdated?.(); offDeleted?.(); };
  }, [on, fetchAlerts]);

  const handleFilterChange = (name, value) => {
    setFilters(p => ({ ...p, [name]: value }));
    setPage(1);
  };

  const sorted = [...alerts].sort((a, b) =>
    (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9)
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('dashboard.publicAlerts')}
        subtitle={t('dashboard.publicAlertsSubtitle')}
      >
        {total > 0 && (
          <span className="text-xs font-medium bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 px-3 py-1.5 rounded-full">
            {total} active alert{total === 1 ? '' : 's'}
          </span>
        )}
      </PageHeader>

      <div className="flex flex-wrap gap-3">
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
        {(filters.category || filters.severity) && (
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
          title={filters.category || filters.severity ? 'No matching alerts' : 'No active alerts'}
          description={filters.category || filters.severity
            ? 'No active alerts match your filters. Try clearing a filter to see more results.'
            : 'There are no active public alerts right now. Check back soon for updates.'}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sorted.map(alert => {
              const cat = getAlertCategory(alert.category);
              return (
                <Link key={alert._id} to={`/alerts/${alert._id}`} className="card hover:shadow-lg transition-shadow group flex flex-col">
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
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 dark:text-primary-400 mt-3">
                    <Megaphone size={13} strokeWidth={2} /> View Alert
                  </span>
                </Link>
              );
            })}
          </div>
          <div>
            <Pagination page={page} pages={pages} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}
