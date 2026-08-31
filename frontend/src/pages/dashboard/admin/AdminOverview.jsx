import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users, UserRound, Landmark, MapPinned, Building2, HandHelping,
  Construction, Hammer, CheckCircle2, Clock, MessageSquareWarning,
  Mail, ClipboardList, ScrollText, Newspaper, TrendingUp, FolderOpen,
} from 'lucide-react';
import { adminAPI, locationAPI } from '../../../services/api';
import StatCard from '../../../components/common/StatCard';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

export default function AdminOverview() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminAPI.getStats().then(r => r.data.stats),
      locationAPI.getAllSubcities().then(r => r.data.subcities || []),
      locationAPI.getAllWoredas().then(r => r.data.woredas || []),
    ]).then(([stats, subcities, woredas]) => {
      setStats({ ...stats, subcities: subcities.length, woredas: woredas.length });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-blue-500 dark:from-primary-900 dark:via-primary-800 dark:to-primary-700 rounded-2xl px-6 sm:px-8 py-10 sm:py-12 text-center text-white shadow-lg shadow-primary-900/15">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">{t('admin.title')}</h2>
        <p className="mt-3 sm:mt-4 text-sm sm:text-base font-light text-blue-100/90 max-w-2xl mx-auto leading-relaxed">{t('admin.desc')}</p>
      </div>

      {stats && (
        <>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{t('admin.citizens')}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard icon={Users}               label={t('admin.totalUsers')}   value={stats.users.total}      color="bg-blue-100"   iconColor="text-blue-600" />
              <StatCard icon={UserRound}           label={t('admin.citizens')}      value={stats.users.citizens}   color="bg-purple-100" iconColor="text-purple-600" />
              <StatCard icon={Landmark}            label={t('admin.govOrgs')}      value={stats.users.govOrgs}    color="bg-yellow-100" iconColor="text-yellow-600" />
              <StatCard icon={MapPinned}           label={t('admin.woreda')}       value={stats.woredas}          color="bg-teal-100"   iconColor="text-teal-600" />
              <StatCard icon={Building2}           label={t('admin.subcity')}      value={stats.subcities}        color="bg-primary-100" iconColor="text-primary-600" />
              <StatCard icon={HandHelping}         label={t('admin.volunteers')}    value={stats.users.volunteers} color="bg-pink-100"   iconColor="text-pink-600" />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{t('admin.reportMgmt')}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard icon={Construction}      label={t('adminStats.infraTotal')}     value={stats.infrastructure.total}    color="bg-blue-100"   iconColor="text-blue-600" />
              <StatCard icon={Hammer}            label={t('adminStats.infraActive')}    value={stats.infrastructure.active}   color="bg-orange-100" iconColor="text-orange-600" />
              <StatCard icon={CheckCircle2}      label={t('adminStats.infraResolved')}  value={stats.infrastructure.resolved} color="bg-green-100"  iconColor="text-green-600" />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{t('admin.aggregates')}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard icon={Clock}                label={t('adminStats.pendingReports')}     value={stats.pendingReports}    color="bg-amber-100"  iconColor="text-amber-600" />
              <StatCard icon={CheckCircle2}         label={t('adminStats.resolvedReports')}    value={stats.resolvedReports}   color="bg-green-100"  iconColor="text-green-600" />
              <StatCard icon={MessageSquareWarning} label={t('adminStats.publicComplaints')}  value={stats.publicComplaints}  color="bg-rose-100"   iconColor="text-rose-600" />
            </div>
          </div>
        </>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { to:'/dashboard/admin/users',      icon:Users,          label: t('admin.manageUsers'),       color:'bg-blue-50' },
          { to:'/dashboard/admin/contact-messages', icon:Mail,      label: 'Contact Messages',   color:'bg-amber-50' },
          { to:'/dashboard/admin/reports',    icon:ClipboardList, label: t('admin.allReports'),        color:'bg-red-50' },
          { to:'/dashboard/admin/activity',   icon:ScrollText,    label: t('admin.activityLog'),       color:'bg-indigo-50' },
          { to:'/dashboard/admin/departments',icon:Landmark,      label: t('admin.deptManagement'),    color:'bg-teal-50' },
          { to:'/dashboard/admin/news',       icon:Newspaper,     label: t('admin.newsTitle'),         color:'bg-green-50' },
          { to:'/dashboard/admin/analytics',  icon:TrendingUp,    label: t('dashboard.analyticsTitle'),color:'bg-purple-50' },
          { to:'/dashboard/admin/categories', icon:FolderOpen,    label: t('dashboard.categoryManagement'), color:'bg-gray-50' },
        ].map(a => (
          <Link key={a.label} to={a.to} className={`${a.color} dark:bg-gray-700 rounded-xl p-4 text-center hover:shadow-md transition-shadow`}>
            <a.icon size={24} strokeWidth={2} className="mx-auto mb-1" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{a.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
