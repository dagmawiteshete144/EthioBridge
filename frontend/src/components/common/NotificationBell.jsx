import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Bell, FilePlus2, ClipboardList, Pin, BadgeCheck, Settings, BellRing,
  Info, ArrowUpRight, MessageSquare, Heart, Megaphone, Users,
} from 'lucide-react';
import { notifAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

export default function NotificationBell() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { on } = useSocket() || {};
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  const fetchNotifs = async () => {
    try {
      const res = await notifAPI.get({ limit: 10 });
      setNotifications(res.data.notifications);
      setUnread(res.data.unreadCount);
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNewNotification = useCallback((notif) => {
    setNotifications(prev => {
      const exists = prev.some(n => n._id === notif._id);
      if (exists) return prev;
      return [notif, ...prev].slice(0, 10);
    });
    setUnread(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (!on) return;
    const cleanup = on('notification:new', handleNewNotification);
    return cleanup;
  }, [on, handleNewNotification]);

  const markRead = async (id) => {
    await notifAPI.markRead(id);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  const markAll = async () => {
    await notifAPI.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnread(0);
    toast.success(t('toast.allNotificationsRead'));
  };

  const typeIcons = {
    new_report: FilePlus2,
    report_status: ClipboardList,
    assignment: Pin,
    verification: BadgeCheck,
    system: Settings,
    public_alert: BellRing,
    info: Info,
    escalation: ArrowUpRight,
    complaint: MessageSquare,
    donation_received: Heart,
    campaign_approval: Megaphone,
    volunteer_task: Users,
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
        aria-label={t('common.notifications')}
      >
        <Bell size={20} strokeWidth={2} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-40 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">{t('common.notifications')}</h3>
              {unread > 0 && (
                <button onClick={markAll} className="text-xs text-primary-600 dark:text-primary-400 hover:underline">{t('common.markAllRead')}</button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">{t('common.noNotifications')}</div>
              ) : notifications.map((n) => {
                const Icon = typeIcons[n.type] || Bell;
                return (
                  <div
                    key={n._id}
                    onClick={() => !n.isRead && markRead(n._id)}
                    className={`px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!n.isRead ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-primary-600 dark:text-primary-400 shrink-0 mt-0.5">
                        <Icon size={16} strokeWidth={2} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium ${!n.isRead ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>{n.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                      </div>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-1.5" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {user?.role === 'citizen' && (
              <Link
                to="/dashboard/citizen/notifications"
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-center text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 border-t border-gray-100 dark:border-gray-700"
              >
                {t('common.viewAll') || 'View all'}
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
