import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { alertAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import PageHeader from '../../../components/common/PageHeader';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import EmptyState from '../../../components/common/EmptyState';
import Pagination from '../../../components/common/Pagination';
import { toast } from 'react-toastify';
import {
  ALERT_CATEGORY_OPTIONS,
  ALERT_PRIORITIES,
  ALERT_PRIORITY_STYLES,
  getAlertCategory,
  getAlertPriority,
  alertLocationLabel,
  alertIssuerLabel,
} from '../../../utils/alertConstants';

const LIMIT = 10;

export default function PublicAlerts() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { on } = useSocket() || {};

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filters, setFilters] = useState({ category: '', priority: '', unreadOnly: false });
  const [expanded, setExpanded] = useState(null);

  const locationLabel = [user?.woredaName, user?.subcity].filter(Boolean).join(' · ') || 'Addis Ababa';

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: LIMIT };
      if (filters.category) params.category = filters.category;
      if (filters.priority) params.priority = filters.priority;
      if (filters.unreadOnly) params.unreadOnly = 'true';
      const res = await alertAPI.getCitizen(params);
      setAlerts(res.data?.data?.alerts || []);
      setPages(res.data?.data?.pages || 1);
      setTotal(res.data?.data?.total || 0);
      setUnreadCount(res.data?.data?.unreadCount || 0);
    } catch (e) {
      console.error('Failed to load your alerts:', e);
      setError(e.response?.data?.message || t('publicAlerts.loadError'));
    } finally {
      setLoading(false);
    }
  }, [page, filters, t]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  // Live refresh when an alert is published/updated/deleted.
  useEffect(() => {
    if (!on) return;
    const offNew = on('alert:new', () => { setPage(1); fetchAlerts(); });
    const offUpdated = on('alert:updated', fetchAlerts);
    const offDeleted = on('alert:deleted', fetchAlerts);
    return () => { offNew?.(); offUpdated?.(); offDeleted?.(); };
  }, [on, fetchAlerts]);

  const handleFilter = (key, value) => {
    setFilters(p => ({ ...p, [key]: value }));
    setPage(1);
  };

  const markRead = async (alert) => {
    if (alert.isRead) return;
    try {
      await alertAPI.markRead(alert._id);
      setAlerts(prev => prev.map(a => a._id === alert._id ? { ...a, isRead: true } : a));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Failed to mark alert as read:', e);
    }
  };

  const markAll = async () => {
    try {
      await alertAPI.markAllRead();
      setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
      setUnreadCount(0);
      toast.success(t('publicAlerts.allMarkedRead'));
    } catch (e) {
      toast.error(e.response?.data?.message || t('publicAlerts.loadError'));
    }
  };

  const toggleExpand = (alert) => {
    if (expanded === alert._id) {
      setExpanded(null);
      return;
    }
    setExpanded(alert._id);
    markRead(alert);
  };

  const expiresLabel = (alert) => {
    if (!alert.expiresAt) return null;
    const expiresAt = new Date(alert.expiresAt);
    if (Number.isNaN(expiresAt.getTime())) return null;
    if (alert.status === 'expired') return `${t('publicAlerts.expired')} ${expiresAt.toLocaleDateString()}`;
    return `${t('publicAlerts.expires')} ${expiresAt.toLocaleDateString()}`;
  };

  return (
    <div className="space-y-5">
      <PageHeader title={t('publicAlerts.title')} subtitle={t('publicAlerts.subtitle') + ` — ${locationLabel}`}>
        {unreadCount > 0 && (
          <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 font-medium">
            {unreadCount} {t('publicAlerts.unread')}
          </span>
        )}
        {unreadCount > 0 && (
          <button onClick={markAll} className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">
            {t('publicAlerts.markAllRead')}
          </button>
        )}
      </PageHeader>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-3">
          <select
            value={filters.category}
            onChange={e => handleFilter('category', e.target.value)}
            className="input-field w-auto text-sm"
          >
            <option value="">{t('publicAlerts.allCategories')}</option>
            {ALERT_CATEGORY_OPTIONS.map(c => (
              <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
            ))}
          </select>
          <select
            value={filters.priority}
            onChange={e => handleFilter('priority', e.target.value)}
            className="input-field w-auto text-sm"
          >
            <option value="">{t('publicAlerts.allPriorities')}</option>
            {ALERT_PRIORITIES.map(p => (
              <option key={p.v} value={p.v}>{p.icon} {p.v}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.unreadOnly}
              onChange={e => handleFilter('unreadOnly', e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            {t('publicAlerts.showUnreadOnly')}
          </label>
          {(filters.category || filters.priority || filters.unreadOnly) && (
            <button
              onClick={() => { setFilters({ category: '', priority: '', unreadOnly: false }); setPage(1); }}
              className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              {t('common.clearFilters') || 'Clear filters'}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <EmptyState icon="⚠️" title={t('publicAlerts.loadError')} description={error} />
      ) : alerts.length === 0 ? (
        <EmptyState icon="📢" title={t('publicAlerts.noAlerts')} description={t('publicAlerts.noAlertsDesc')} />
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => {
            const cat = getAlertCategory(alert.category);
            const priority = getAlertPriority(alert);
            const isOpen = expanded === alert._id;
            const exp = expiresLabel(alert);
            return (
              <div
                key={alert._id}
                className={`card p-4 cursor-pointer transition-shadow hover:shadow-md ${!alert.isRead ? 'border-l-4 border-l-primary-500' : ''}`}
                onClick={() => toggleExpand(alert)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      {!alert.isRead && <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0" title={t('publicAlerts.unreadLabel')} />}
                      <span className="text-lg">{cat.icon}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ALERT_PRIORITY_STYLES[priority] || ''}`}>{priority}</span>
                      <span className="text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">{cat.label}</span>
                      {alert.status === 'expired' && (
                        <span className="text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">{t('publicAlerts.expired')}</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 leading-snug">{alert.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{alert.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500 flex-wrap">
                      <span>🏛️ {alertIssuerLabel(alert)}</span>
                      <span>📍 {alertLocationLabel(alert) || 'Addis Ababa'}</span>
                      <span>📅 {new Date(alert.publishedAt || alert.createdAt).toLocaleDateString()}</span>
                      {exp && <span>{exp}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-gray-400 text-xs">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{alert.description}</p>
                    {alert.image && (
                      <img src={alert.image} alt={alert.title} className="w-full max-h-72 object-cover rounded-xl" />
                    )}
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        to={`/alerts/${alert._id}`}
                        onClick={e => e.stopPropagation()}
                        className="btn-primary text-sm py-2 px-4 rounded-lg"
                      >
                        {t('publicAlerts.viewDetails')}
                      </Link>
                      {alert.location && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">📍 {alert.location}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Pagination page={page} pages={pages} onPageChange={setPage} />
    </div>
  );
}
