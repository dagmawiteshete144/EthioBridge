import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { deptAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import StatCard from '../../../components/common/StatCard';
import { ClipboardList, Hourglass, RefreshCw, CircleCheck, Check, CircleX, MapPin } from 'lucide-react';

export default function DepartmentOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await deptAPI.getStats();
        setStats(res.data.stats);
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-bold mb-1">{user?.department || 'Department'} Dashboard</h2>
        <p className="text-primary-100 text-sm">Welcome, {user?.fullName}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ClipboardList} label="Total Reports" value={stats?.total || 0} color="bg-blue-100" iconColor="text-blue-600" />
        <StatCard icon={Hourglass} label="Pending" value={stats?.pending || 0} color="bg-yellow-100" iconColor="text-yellow-600" />
        <StatCard icon={RefreshCw} label="In Progress" value={stats?.inProgress || 0} color="bg-orange-100" iconColor="text-orange-600" />
        <StatCard icon={CircleCheck} label="Resolved" value={stats?.resolved || 0} color="bg-green-100" iconColor="text-green-600" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={MapPin} label="Assigned" value={stats?.assigned || 0} color="bg-indigo-100" iconColor="text-indigo-600" />
        <StatCard icon={Check} label="Completed" value={stats?.completed || 0} color="bg-teal-100" iconColor="text-teal-600" />
        <StatCard icon={CircleX} label="Rejected" value={stats?.rejected || 0} color="bg-red-100" iconColor="text-red-600" />
      </div>

      <div className="card">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickActionLink to="/department/dashboard/reports" icon={ClipboardList} label="View All Reports" />
          <QuickActionLink to="/department/dashboard/reports?status=Pending" icon={Hourglass} label="Pending Reports" />
          <QuickActionLink to="/department/dashboard/reports?status=Assigned" icon={MapPin} label="Assigned to Me" />
          <QuickActionLink to="/department/dashboard/reports?status=In%20Progress" icon={RefreshCw} label="In Progress" />
        </div>
      </div>
    </div>
  );
}

function QuickActionLink({ to, icon: Icon, label }) {
  return (
    <Link to={to} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-center transition-colors">
      <div className="text-2xl mb-1"><Icon className="w-6 h-6 mx-auto" /></div>
      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</p>
    </Link>
  );
}
