import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../../components/common/PageHeader';
import { useTranslation } from 'react-i18next';
import { notifAPI } from '../../../services/api';
import { useSocket } from '../../../context/SocketContext';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import EmptyState from '../../../components/common/EmptyState';
import Pagination from '../../../components/common/Pagination';
import { ArrowUp, Bell, ClipboardList, CircleCheck, FilePlus2, Info, Megaphone, MessageSquare, Pin, Settings, Siren, X } from 'lucide-react';

const TYPE_ICONS = {
  new_report: FilePlus2,
  report_status: ClipboardList,
  assignment: Pin,
  verification: CircleCheck,
  system: Settings,
  public_alert: Siren,
  info: Info,
  escalation: ArrowUp,
  complaint: Megaphone,
  feedback: MessageSquare,
};

// Map a notification type to the citizen settings preference that controls it.
const PREF_KEY = 'ethiobridge_notif_prefs';
const DEFAULT_PREFS = { reportUpdates: true, publicAlerts: true, feedbackResponses: true, systemUpdates: true };

const NOTIF_PREF_KEY = (type) => {
  if (type === 'public_alert') return 'publicAlerts';
  if (['report_status', 'new_report', 'assignment', 'verification', 'escalation', 'complaint'].includes(type)) return 'reportUpdates';
  if (type === 'feedback') return 'feedbackResponses';
  return 'systemUpdates';
};

const loadPrefs = () => {
  try {
    return { ...DEFAULT_PREFS, ...(JSON.parse(localStorage.getItem(PREF_KEY)) || {}) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
};

const LIMIT = 20;

export default function CitizenNotifications() {
  const { t } = useTranslation();
  const { on } = useSocket() || {};
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notifAPI.get({ page, limit: LIMIT });
      const all = res.data.notifications || [];
      const prefs = loadPrefs();
      const visible = all.filter(n => prefs[NOTIF_PREF_KEY(n.type)] !== false);
      setNotifications(visible);
      setUnread(res.data.unreadCount || 0);
      setPages(Math.max(1, Math.ceil((res.data.total || 0) / LIMIT)));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleNewNotification = useCallback((notif) => {
    if (page !== 1) return;
    const prefs = loadPrefs();
    if (prefs[NOTIF_PREF_KEY(notif.type)] === false) return;
    setNotifications(prev => {
      const exists = prev.some(n => n._id === notif._id);
      if (exists) return prev;
      return [notif, ...prev].slice(0, LIMIT);
    });
    setUnread(prev => prev + 1);
  }, [page]);

  useEffect(() => {
    if (!on) return;
    const cleanup = on('notification:new', handleNewNotification);
    return cleanup;
  }, [on, handleNewNotification]);

  const markRead = async (id) => {
    try {
      await notifAPI.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch (e) { console.error(e); }
  };

  const markAll = async () => {
    try {
      await notifAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnread(0);
      toast.success(t('toast.allNotificationsRead'));
    } catch (e) { console.error(e); }
  };

  const remove = async (id) => {
    try {
      await notifAPI.delete(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-5">
      <PageHeader title={t('common.notifications')}>
        {unread > 0 && (
          <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 font-medium">
            {unread} {t('common.unread') || 'unread'}
          </span>
        )}
        {unread > 0 && (
          <button onClick={markAll} className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">
            {t('common.markAllRead')}
          </button>
        )}
      </PageHeader>

      {loading ? (
        <LoadingSpinner />
      ) : notifications.length === 0 ? (
        <EmptyState icon={<Bell size={48} strokeWidth={2} />} title={t('common.noNotifications')} description={t('citizen.noNotifs')} />
      ) : (
        <div className="card divide-y divide-gray-100 dark:divide-gray-700">
          {notifications.map(n => {
            const TypeIcon = TYPE_ICONS[n.type] || Bell;
            return (
            <div
              key={n._id}
              onClick={() => !n.isRead && markRead(n._id)}
              className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!n.isRead ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
            >
              <TypeIcon size={18} strokeWidth={2} className="text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-medium ${!n.isRead ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>{n.title}</p>
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                {n.type === 'public_alert' && (
                  <Link
                    to="/dashboard/citizen/public-alerts"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-block mt-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {t('publicAlerts.viewDetails') || 'View alert'}
                  </Link>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); remove(n._id); }}
                className="text-gray-400 hover:text-red-500 shrink-0 text-xs p-1"
                aria-label="Delete"
                title="Delete notification"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>
            );
          })}
        </div>
      )}

      <Pagination page={page} pages={pages} onPageChange={setPage} />
    </div>
  );
}
