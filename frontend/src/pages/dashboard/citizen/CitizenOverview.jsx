import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, Clock, Wrench, CheckCircle2, Bell, Inbox, Landmark, Megaphone } from 'lucide-react';
import { infraAPI, complaintReportAPI, notifAPI, alertAPI, feedbackAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import StatCard from '../../../components/common/StatCard';
import StatusBadge from '../../../components/common/StatusBadge';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { getAlertPriority, ALERT_PRIORITY_STYLES, getAlertCategory } from '../../../utils/alertConstants';
import { EmojiIcon } from '../../../utils/iconMap.jsx';

const AWAITING_REVIEW_STATUSES = ['Pending', 'Submitted', 'Under Review'];
const IN_PROGRESS_STATUSES = ['In Progress', 'Active', 'Assigned', 'Upgraded', 'Completed', 'Citizen Verification'];

export default function CitizenOverview() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, inProgress: 0, resolved: 0, awaitingReview: 0 });
  const [recent, setRecent] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [ir, cr, notifs, alertRes, feedbackRes] = await Promise.all([
          infraAPI.getMy({ limit: 4 }),
          complaintReportAPI.getMy({ limit: 4 }),
          notifAPI.get({ limit: 5 }),
          alertAPI.getCitizen({ limit: 4 }),
          feedbackAPI.getMine(),
        ]);

        const allReports = [
          ...ir.data.reports.map(r => ({ ...r, _type: 'Infrastructure' })),
          ...(cr.data.data?.complaints || []).map(r => ({ ...r, _type: 'Complaint' })),
        ];

        const total = ir.data.total + (cr.data.data?.total || 0);
        const awaitingReview = allReports.filter(r => AWAITING_REVIEW_STATUSES.includes(r.status)).length;
        const inProgress = allReports.filter(r => IN_PROGRESS_STATUSES.includes(r.status)).length;
        const resolved = allReports.filter(r => r.status === 'Resolved').length;

        setStats({ total, inProgress, resolved, awaitingReview });
        setRecent(allReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5));
        setNotifications(notifs.data.notifications);
        setAlerts(alertRes.data?.data?.alerts || []);
        setResponses((feedbackRes.data?.feedback || []).filter(f => f.direction === 'received').slice(0, 3));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner />;

  const locationLabel = [user?.woredaName, user?.subcity].filter(Boolean).join(' · ') || 'Addis Ababa';

  const categoryOf = (r) => r.category || r.department || null;
  const woredaOf = (r) => r.woredaName || r.woreda || null;
  const subcityOf = (r) => r.subcity || null;

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 sm:p-7 text-white">
        <h2 className="text-xl sm:text-2xl font-bold">{t('citizen.welcomeBack')}, {user?.fullName}!</h2>
        <p className="text-primary-100 text-sm mt-1">{t('citizen.welcomeSubtitle')}</p>
        <p className="text-primary-100/80 text-xs mt-2 inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-white/70" /> {locationLabel}
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label={t('citizen.totalSubmitted')} value={stats.total} color="bg-blue-100" iconColor="text-blue-600" />
        <StatCard icon={Clock} label={t('citizen.awaitingReview')} value={stats.awaitingReview} color="bg-purple-100" iconColor="text-purple-600" />
        <StatCard icon={Wrench} label={t('citizen.inProgress')} value={stats.inProgress} color="bg-orange-100" iconColor="text-orange-600" />
        <StatCard icon={CheckCircle2} label={t('citizen.resolved')} value={stats.resolved} color="bg-green-100" iconColor="text-green-600" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Reports */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">{t('citizen.recentReports')}</h3>
            <Link to="/dashboard/citizen/my-reports" className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">{t('common.viewAll')}</Link>
          </div>
          {recent.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Inbox size={40} strokeWidth={2} className="mx-auto mb-2" />
              <p className="text-sm">{t('citizen.noReports')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map(r => (
                <Link
                  key={r._id}
                  to="/dashboard/citizen/my-reports"
                  className="block p-3.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate min-w-0">{r.title}</p>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <span>{r._type}</span>
                    {categoryOf(r) && <span className="capitalize">{String(categoryOf(r)).replace(/_/g, ' ')}</span>}
                    {subcityOf(r) && <span>{subcityOf(r)}</span>}
                    {woredaOf(r) && <span>Woreda {woredaOf(r)}</span>}
                    <span className="ml-auto text-gray-400 dark:text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Latest Public Alerts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100"><Megaphone size={20} strokeWidth={2} className="inline-block mr-1.5 align-[-3px]" />{t('publicAlerts.latestAlerts')}</h3>
            <Link to="/dashboard/citizen/public-alerts" className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">{t('publicAlerts.viewAllAlerts')}</Link>
          </div>
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Megaphone size={40} strokeWidth={2} className="mx-auto mb-2" />
              <p className="text-sm">{t('publicAlerts.noAlerts')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map(alert => {
                const priority = getAlertPriority(alert);
                const cat = getAlertCategory(alert.category);
                return (
                  <Link
                    key={alert._id}
                    to="/dashboard/citizen/public-alerts"
                    className="block p-3.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <EmojiIcon emoji={cat.icon} size={16} />
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate flex-1 min-w-0">{alert.title}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ALERT_PRIORITY_STYLES[priority] || ''}`}>{priority}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(alert.publishedAt || alert.createdAt).toLocaleDateString()}
                      {alert.woreda ? ` · Woreda ${alert.woreda}` : alert.subcity ? ` · ${alert.subcity}` : ''}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Official Responses */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100"><Landmark size={20} strokeWidth={2} className="inline-block mr-1.5 align-[-3px]" />{t('citizen.officialResponses')}</h3>
            <Link to="/dashboard/citizen/feedback" className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">{t('common.viewAll')}</Link>
          </div>
          {responses.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Landmark size={40} strokeWidth={2} className="mx-auto mb-2" />
              <p className="text-sm">{t('citizen.noOfficialResponses')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {responses.map(f => (
                <div key={f._id} className="p-3.5 rounded-xl border-l-4 border-primary-400 bg-primary-50/50 dark:bg-primary-900/10">
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{f.text}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {f.authorName ? `${f.authorName}` : f.authorRole || 'Official'}
                    {f.department ? ` · ${f.department}` : ''} · {new Date(f.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Notifications */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">{t('citizen.recentNotifs')}</h3>
          </div>
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Bell size={40} strokeWidth={2} className="mx-auto mb-2" />
              <p className="text-sm">{t('citizen.noNotifs')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map(n => (
                <div key={n._id} className={`p-3.5 rounded-xl border-l-4 ${n.isRead ? 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600' : 'bg-primary-50 dark:bg-primary-900/20 border-primary-400'}`}>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{n.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
