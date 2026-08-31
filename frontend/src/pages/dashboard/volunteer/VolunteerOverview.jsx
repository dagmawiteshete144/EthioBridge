import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { volunteerTaskAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import StatCard from '../../../components/common/StatCard';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import EmptyState from '../../../components/common/EmptyState';
import { Inbox, ClipboardList, LoaderCircle, CircleCheck } from 'lucide-react';

const priorityBadge = {
  High: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  Medium: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Low: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
};

export default function VolunteerOverview() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { on } = useSocket() || {};
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    return Promise.all([
      volunteerTaskAPI.getStats(),
      volunteerTaskAPI.getAvailableTasks(),
    ])
      .then(([statsRes, tasksRes]) => {
        setStats(statsRes.data.stats);
        setTasks(tasksRes.data.tasks || []);
      })
      .catch(err => console.error('Failed to fetch volunteer overview:', err));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const safeLoad = () => loadData().finally(() => { if (!cancelled) setLoading(false); });

    safeLoad();
    if (!on) return () => { cancelled = true; };

    const offStats = on('volunteer:stats-updated', safeLoad);
    return () => {
      cancelled = true;
      offStats?.();
    };
  }, [on, loadData]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-bold mb-1">{t('dashboard.welcomeVolunteer', { name: user?.fullName })}</h2>
        <p className="text-primary-100 text-sm">{t('dashboard.volunteerPortal')}</p>
        <div className="flex gap-2 mt-4 flex-wrap">
          {(user?.skills || []).map(s => <span key={s} className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">{s}</span>)}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Inbox} label={t('dashboard.availableTasks')}          value={stats?.available ?? 0} color="bg-blue-100"  iconColor="text-blue-600" />
        <StatCard icon={ClipboardList} label={t('dashboard.assignedTasks')}           value={stats?.assigned ?? 0}  color="bg-purple-100" iconColor="text-purple-600" />
        <StatCard icon={LoaderCircle} label={t('dashboard.pendingApplications')}      value={stats?.pending ?? 0}   color="bg-yellow-100" iconColor="text-yellow-600" />
        <StatCard icon={CircleCheck} label={t('dashboard.completedTasks')}           value={stats?.completed ?? 0} color="bg-navy-100"  iconColor="text-navy-700" />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">{t('dashboard.availableTasksInArea')}</h3>
          <Link to="/dashboard/volunteer/available" className="text-xs text-primary-600 hover:underline">{t('dashboard.viewAll')} →</Link>
        </div>
        {tasks.length === 0 ? (
          <EmptyState icon={Inbox} title={t('dashboard.noAvailableTasks')} description={t('dashboard.noAvailableTasksDesc')} />
        ) : (
          <div className="space-y-3">
            {tasks.slice(0, 5).map(task => (
              <div key={task._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{task.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {task.woredaName ? task.woredaName : task.subcity} {task.location ? `• ${task.location}` : ''} • {task.priority}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${priorityBadge[task.priority] || ''}`}>{task.priority}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
