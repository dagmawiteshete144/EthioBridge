import { useState, useEffect } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import { useTranslation } from 'react-i18next';
import { publicAPI } from '../../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899'];
const riskColor = { Low: 'text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900/30', Moderate: 'text-yellow-600 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/30', High: 'text-orange-600 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/30', Critical: 'text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-900/30' };

export default function AdminAnalytics() {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicAPI.getAnalytics()
      .then(r => { setAnalytics(r.data.analytics || {}); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const {
    infrastructureReports = 0,
    publicComplaints = 0,
    campaigns = 0,
    reportsBySubcity = [],
    subcityRiskLevelAnalytics = [],
  } = analytics || {};

  const barData = reportsBySubcity.map(s => ({
    name: s.label || s.subcity,
    publicComplaints: s.publicComplaints,
    campaigns: s.campaigns,
  }));

  const riskPie = [
    { name: t('filterOptions.low'),      value: subcityRiskLevelAnalytics.filter(r => r.riskLevel === 'Low').length },
    { name: t('filterOptions.moderate'), value: subcityRiskLevelAnalytics.filter(r => r.riskLevel === 'Moderate').length },
    { name: t('filterOptions.high'),     value: subcityRiskLevelAnalytics.filter(r => r.riskLevel === 'High').length },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <PageHeader title={t('dashboard.analyticsTitle')} />

      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{infrastructureReports}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.infraTotal')}</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{publicComplaints}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.publicComplaintsTotal', 'Total Public Complaints')}</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">{campaigns}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.campaignsTotal', 'Total Fundraising Campaigns')}</p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">{t('dashboard.reportsBySubcity', 'Reports by Subcity')}</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-stroke, #f0f0f0)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="publicComplaints" name={t('dashboard.publicComplaintsTotal', 'Public Complaints')} fill="#8b5cf6" radius={[4,4,0,0]} />
            <Bar dataKey="campaigns" name={t('dashboard.campaignsTotal', 'Campaigns')} fill="#f59e0b" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Risk Distribution + Subcity Risk Summary */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">{t('dashboard.riskDistribution')}</h3>
          {riskPie.length === 0 ? (
            <p className="text-center text-gray-400 py-12">{t('dashboard.noData', 'No data available')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={riskPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {riskPie.map((_, i) => <Cell key={i} fill={['#10b981', '#f59e0b', '#f97316'][i]} />)}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Subcity Risk Table */}
        <div className="card overflow-x-auto">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">{t('dashboard.subcityRisk', 'Subcity Risk Level Summary')}</h3>
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 dark:bg-gray-700">
              <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-400 text-xs font-medium">{t('dashboard.regionLabelShort')}</th>
              <th className="px-3 py-2 text-center text-gray-600 dark:text-gray-400 text-xs font-medium">{t('dashboard.total')}</th>
              <th className="px-3 py-2 text-center text-gray-600 dark:text-gray-400 text-xs font-medium">{t('dashboard.open', 'Open')}</th>
              <th className="px-3 py-2 text-center text-gray-600 dark:text-gray-400 text-xs font-medium">{t('dashboard.resolved', 'Resolved')}</th>
              <th className="px-3 py-2 text-center text-gray-600 dark:text-gray-400 text-xs font-medium">{t('dashboard.risk')}</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {subcityRiskLevelAnalytics.map(r => (
                <tr key={r.subcity}>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300 text-xs">{r.label || r.subcity}</td>
                  <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400 font-medium text-xs">{r.total}</td>
                  <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400 font-medium text-xs">{r.open}</td>
                  <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400 font-medium text-xs">{r.resolved}</td>
                  <td className="px-3 py-2 text-center"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${riskColor[r.riskLevel] || ''}`}>{r.riskLevel}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
