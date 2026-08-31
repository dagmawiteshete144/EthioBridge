import { useState, useEffect } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import { subcityAPI } from '../../../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899'];
const RISK_COLORS = { Low: '#10b981', Medium: '#f59e0b', High: '#f97316', Critical: '#ef4444' };

export default function SubcityAnalytics({ subcity }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    subcityAPI.getAnalytics()
      .then(r => { setAnalytics(r.data.analytics || {}); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const {
    summary = {
      totalInfrastructure: 0,
      totalComplaints: 0,
      totalPublicComplaints: 0,
      totalCampaigns: 0,
      totalRaised: 0,
      totalGoal: 0,
      totalDonors: 0,
      activeCampaigns: 0,
      completedCampaigns: 0,
      pendingCampaigns: 0,
      avgContribution: 0,
      total: 0,
      resolved: 0,
      pending: 0,
      inProgress: 0,
      resolutionRate: 0,
    },
    byWoreda = [],
    statusDistribution = [],
    categoryDistribution = [],
    publicComplaintCategoryDistribution = [],
    priorityDistribution = [],
    campaignTypeDistribution = [],
    departmentPerformance = [],
    monthlyTrend = [],
    riskDistribution = [],
  } = analytics || {};

  const woredaData = byWoreda.map(w => ({
    name: w.woreda.length > 14 ? w.woreda.slice(0, 12) + '…' : w.woreda,
    woreda: w.woreda,
    Infrastructure: w.infra,
    Complaints: w.complaints,
    'Public Complaints': w.publicComplaints,
    Campaigns: w.campaigns,
    total: w.total,
  }));

  const statusData = statusDistribution.map(s => ({ name: s.status, count: s.count }));
  const categoryData = categoryDistribution.map(c => ({ name: c.category, count: c.count }));
  const pcCategoryData = publicComplaintCategoryDistribution.map(c => ({ name: c.category, count: c.count }));
  const priorityData = priorityDistribution.map(p => ({ name: p.priority, value: p.count }));
  const campaignTypeData = campaignTypeDistribution.map(c => ({ name: c.campaignType, count: c.count })).filter(d => d.count > 0);
  const riskData = riskDistribution.map(r => ({ name: r.riskLevel, value: r.count })).filter(d => d.value > 0);
  const trendData = monthlyTrend.map(m => ({
    name: m.month.slice(5),
    Infrastructure: m.infra,
    Complaints: m.complaints,
    'Public Complaints': m.publicComplaints,
    Campaigns: m.campaigns,
  }));

  const fundingPct = summary.totalGoal ? Math.min(100, Math.round((summary.totalRaised / summary.totalGoal) * 100)) : 0;

  return (
    <div className="space-y-6">
      <PageHeader title={`${subcity} Analytics`} subtitle={`Performance analysis for the ${subcity} Subcity, including a per-woreda breakdown`} />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{summary.total}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Reports</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{summary.resolved}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Resolved</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{summary.pending}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Pending</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{summary.inProgress}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">In Progress</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">{summary.resolutionRate}%</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Resolution Rate</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.totalInfrastructure}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Infrastructure</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{summary.totalComplaints}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Upgraded Complaints</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.totalPublicComplaints}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Public Complaints</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{summary.totalCampaigns}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Campaigns</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{summary.totalRaised.toLocaleString()} ETB</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total Raised</p>
        </div>
      </div>

      {/* Website statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="card p-4 border-l-4 border-l-blue-500">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.activeCampaigns}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Active Campaigns</p>
        </div>
        <div className="card p-4 border-l-4 border-l-green-500">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.totalRaised.toLocaleString()} ETB</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Donations</p>
        </div>
        <div className="card p-4 border-l-4 border-l-purple-500">
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{summary.totalDonors.toLocaleString()}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Donors</p>
        </div>
        <div className="card p-4 border-l-4 border-l-amber-500">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{summary.avgContribution.toLocaleString()} ETB</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avg. Contribution</p>
        </div>
        <div className="card p-4 border-l-4 border-l-teal-500">
          <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{summary.completedCampaigns}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Completed Campaigns</p>
        </div>
      </div>

      {/* Reports by Woreda */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Reports by Woreda</h3>
        {woredaData.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={woredaData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-stroke, #f0f0f0)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Infrastructure" fill="#3b82f6" stackId="a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Complaints" fill="#f59e0b" stackId="a" />
              <Bar dataKey="Public Complaints" fill="#ef4444" stackId="a" />
              <Bar dataKey="Campaigns" fill="#10b981" stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Status Distribution</h3>
          {statusData.length === 0 ? (
            <p className="text-center text-gray-400 py-12">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={statusData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-stroke, #f0f0f0)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Distribution */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Infrastructure Categories</h3>
          {categoryData.length === 0 ? (
            <p className="text-center text-gray-400 py-12">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={categoryData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Public Complaint Categories */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Public Complaint Categories</h3>
          {pcCategoryData.length === 0 ? (
            <p className="text-center text-gray-400 py-12">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pcCategoryData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pcCategoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Public Complaint Priority */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Public Complaint Priorities</h3>
          {priorityData.length === 0 ? (
            <p className="text-center text-gray-400 py-12">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={priorityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {priorityData.map((d, i) => <Cell key={i} fill={RISK_COLORS[d.name] || COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Monthly Trend (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-stroke, #f0f0f0)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Infrastructure" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Complaints" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Public Complaints" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Campaigns" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Distribution */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Complaint Risk Levels</h3>
          {riskData.length === 0 ? (
            <p className="text-center text-gray-400 py-12">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={riskData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {riskData.map((d, i) => <Cell key={i} fill={RISK_COLORS[d.name] || COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Campaign Types */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Campaign Types</h3>
          {campaignTypeData.length === 0 ? (
            <p className="text-center text-gray-400 py-12">No data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={campaignTypeData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {campaignTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Fundraising Progress */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Fundraising Progress</h3>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Total Raised</span>
              <span className="font-semibold text-teal-600 dark:text-teal-400">{summary.totalRaised.toLocaleString()} ETB</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Total Goal</span>
              <span className="font-semibold">{summary.totalGoal.toLocaleString()} ETB</span>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Progress</span>
                <span>{fundingPct}%</span>
              </div>
              <div className="h-2.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${fundingPct}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Department Performance Table */}
      <div className="card overflow-x-auto">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Department Performance</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700">
              <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-400 text-xs font-medium">Department</th>
              <th className="px-3 py-2 text-center text-gray-600 dark:text-gray-400 text-xs font-medium">Total</th>
              <th className="px-3 py-2 text-center text-gray-600 dark:text-gray-400 text-xs font-medium">Resolved</th>
              <th className="px-3 py-2 text-center text-gray-600 dark:text-gray-400 text-xs font-medium">Pending</th>
              <th className="px-3 py-2 text-center text-gray-600 dark:text-gray-400 text-xs font-medium">Resolution Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {departmentPerformance.map(d => (
              <tr key={d.department}>
                <td className="px-3 py-2 text-gray-700 dark:text-gray-300 text-xs">{d.department}</td>
                <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400 font-medium text-xs">{d.total}</td>
                <td className="px-3 py-2 text-center text-green-600 font-medium text-xs">{d.resolved}</td>
                <td className="px-3 py-2 text-center text-yellow-600 font-medium text-xs">{d.pending}</td>
                <td className="px-3 py-2 text-center text-xs">
                  <span className={`px-2 py-0.5 rounded-full font-medium ${d.total ? (d.resolved / d.total >= 0.5 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300') : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                    {d.total ? Math.round((d.resolved / d.total) * 100) : 0}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Woreda Performance Table */}
      <div className="card overflow-x-auto">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Woreda Performance</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700">
              <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-400 text-xs font-medium">Woreda</th>
              <th className="px-3 py-2 text-center text-gray-600 dark:text-gray-400 text-xs font-medium">Infrastructure</th>
              <th className="px-3 py-2 text-center text-gray-600 dark:text-gray-400 text-xs font-medium">Complaints</th>
              <th className="px-3 py-2 text-center text-gray-600 dark:text-gray-400 text-xs font-medium">Public</th>
              <th className="px-3 py-2 text-center text-gray-600 dark:text-gray-400 text-xs font-medium">Campaigns</th>
              <th className="px-3 py-2 text-center text-gray-600 dark:text-gray-400 text-xs font-medium">Total</th>
              <th className="px-3 py-2 text-center text-gray-600 dark:text-gray-400 text-xs font-medium">Resolved</th>
              <th className="px-3 py-2 text-center text-gray-600 dark:text-gray-400 text-xs font-medium">Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
            {byWoreda.map(w => (
              <tr key={w.woreda}>
                <td className="px-3 py-2 text-gray-700 dark:text-gray-300 text-xs">{w.woreda}</td>
                <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400 text-xs">{w.infra}</td>
                <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400 text-xs">{w.complaints}</td>
                <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400 text-xs">{w.publicComplaints}</td>
                <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400 text-xs">{w.campaigns}</td>
                <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-400 font-medium text-xs">{w.total}</td>
                <td className="px-3 py-2 text-center text-green-600 font-medium text-xs">{w.resolved}</td>
                <td className="px-3 py-2 text-center text-xs">
                  <span className={`px-2 py-0.5 rounded-full font-medium ${w.resolutionRate >= 50 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : w.resolutionRate > 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                    {w.resolutionRate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
