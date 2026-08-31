import { useState, useEffect, useCallback } from 'react';
import { woredaAPI, volunteerTaskAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import StatCard from '../../../components/common/StatCard';
import { ClipboardList, Hourglass, RefreshCw, CircleCheck, Inbox, Flag, MapPin } from 'lucide-react';

const formatSubcityName = (value) => String(value || '')
  .toLowerCase()
  .replace(/_/g, ' ')
  .split(' ')
  .filter(Boolean)
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');

const DEPARTMENT_CARDS = [
  { dept: 'Electricity', label: 'Electricity' },
  { dept: 'Ethics and Anti-Corruption', label: 'Corruption' },
  { dept: 'Peace and Security', label: 'Peace & Security' },
  { dept: 'Water', label: 'Water' },
  { dept: 'Transport', label: 'Transport' },
];

export default function WoredaOverview() {
  const { user } = useAuth();
  const { on } = useSocket() || {};
  const [stats, setStats] = useState(null);
  const [vStats, setVStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    return Promise.all([
      woredaAPI.getStats(),
      volunteerTaskAPI.getOrgStats(),
    ])
      .then(([reportRes, vRes]) => {
        setStats(reportRes.data.stats);
        setVStats(vRes.data.stats);
      })
      .catch(err => console.error('Failed to fetch stats:', err));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const safeLoad = () => loadData().finally(() => { if (!cancelled) setLoading(false); });

    safeLoad();
    if (!on) return () => { cancelled = true; };

    const offApp = on('volunteer:application', loadData);
    const offStarted = on('volunteer:started', loadData);
    const offProgress = on('volunteer:progress', loadData);
    const offCompletion = on('volunteer:completion', loadData);
    return () => {
      cancelled = true;
      offApp?.();
      offStarted?.();
      offProgress?.();
      offCompletion?.();
    };
  }, [on, loadData]);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-bold mb-1">Woreda Dashboard</h2>
        <p className="text-primary-100 text-sm">
          <MapPin className="inline mr-1 align-[-2px]" size={14} strokeWidth={2} />
          {formatSubcityName(user?.subcity)}{user?.subcity && user?.woredaName ? ' · ' : ''}{user?.woredaName}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ClipboardList} label="Total Reports" value={stats?.totalReports || 0} color="bg-blue-100" iconColor="text-blue-600" />
        <StatCard icon={Hourglass} label="Pending" value={stats?.pendingReports || 0} color="bg-yellow-100" iconColor="text-yellow-600" />
        <StatCard icon={RefreshCw} label="In Progress" value={stats?.inProgressReports || 0} color="bg-orange-100" iconColor="text-orange-600" />
        <StatCard icon={CircleCheck} label="Resolved" value={stats?.resolvedReports || 0} color="bg-green-100" iconColor="text-green-600" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={ClipboardList} label="Volunteer Tasks" value={vStats?.totalTasks || 0} color="bg-blue-100" iconColor="text-blue-600" />
        <StatCard icon={Inbox} label="Open" value={vStats?.openTasks || 0} color="bg-primary-100" iconColor="text-primary-600" />
        <StatCard icon={RefreshCw} label="In Progress" value={vStats?.inProgress || 0} color="bg-orange-100" iconColor="text-orange-600" />
        <StatCard icon={Hourglass} label="Pending Applications" value={vStats?.pendingApplications || 0} color="bg-yellow-100" iconColor="text-yellow-600" />
        <StatCard icon={CircleCheck} label="Awaiting Verification" value={vStats?.awaitingVerification || 0} color="bg-purple-100" iconColor="text-purple-600" />
        <StatCard icon={Flag} label="Completed Tasks" value={vStats?.closedTasks || 0} color="bg-green-100" iconColor="text-green-600" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {DEPARTMENT_CARDS.map(({ dept, label }) => {
          const ds = stats?.departmentStats?.find(d => d.department === dept);
          return (
            <div key={dept} className="card p-4 text-center">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{ds?.total || 0}</p>
              <p className="text-xs text-gray-500">
                {ds?.resolved || 0} resolved / {ds?.pending || 0} pending
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
