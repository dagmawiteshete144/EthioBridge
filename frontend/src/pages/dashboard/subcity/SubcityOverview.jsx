import { useState, useEffect, useCallback } from 'react';
import { subcityAPI, volunteerTaskAPI } from '../../../services/api';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import StatCard from '../../../components/common/StatCard';
import {
  ClipboardList, Clock, Loader2, CheckCircle2, HandHelping,
  FolderOpen, Hourglass, ShieldCheck, Flag,
} from 'lucide-react';

export default function SubcityOverview({ subcity }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { on } = useSocket() || {};
  const [stats, setStats] = useState(null);
  const [vStats, setVStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    return Promise.all([
      subcityAPI.getStats(),
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

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-bold mb-1">{subcity} Subcity Dashboard</h2>
        <p className="text-primary-100 text-sm">Welcome, {user?.fullName}!</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={ClipboardList} label="Total Reports" value={stats?.totalReports || 0} color="bg-blue-100" iconColor="text-blue-600" />
            <StatCard icon={Clock} label="Pending" value={stats?.pendingReports || 0} color="bg-yellow-100" iconColor="text-yellow-600" />
            <StatCard icon={Loader2} label="In Progress" value={stats?.activeReports || 0} color="bg-orange-100" iconColor="text-orange-600" />
            <StatCard icon={CheckCircle2} label="Resolved" value={stats?.resolvedReports || 0} color="bg-green-100" iconColor="text-green-600" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard icon={HandHelping} label="Volunteer Tasks" value={vStats?.totalTasks || 0} color="bg-blue-100" iconColor="text-blue-600" />
            <StatCard icon={FolderOpen} label="Open" value={vStats?.openTasks || 0} color="bg-primary-100" iconColor="text-primary-600" />
            <StatCard icon={Loader2} label="In Progress" value={vStats?.inProgress || 0} color="bg-orange-100" iconColor="text-orange-600" />
            <StatCard icon={Hourglass} label="Pending Applications" value={vStats?.pendingApplications || 0} color="bg-yellow-100" iconColor="text-yellow-600" />
            <StatCard icon={ShieldCheck} label="Awaiting Verification" value={vStats?.awaitingVerification || 0} color="bg-purple-100" iconColor="text-purple-600" />
            <StatCard icon={Flag} label="Completed Tasks" value={vStats?.closedTasks || 0} color="bg-green-100" iconColor="text-green-600" />
          </div>

          <div className="card">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">Infrastructure Reports</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total</span>
                <span className="font-semibold">{stats?.infrastructure?.total || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Pending</span>
                <span className="font-semibold text-yellow-600">{stats?.infrastructure?.pending || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Active</span>
                <span className="font-semibold text-blue-600">{stats?.infrastructure?.active || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Resolved</span>
                <span className="font-semibold text-green-600">{stats?.infrastructure?.resolved || 0}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
