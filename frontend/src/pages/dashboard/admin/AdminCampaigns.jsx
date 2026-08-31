import { useState, useEffect } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import { motion } from 'framer-motion';
import { Check, X, Eye, Search, Ban, TrendingUp, ShieldCheck, BarChart3 } from 'lucide-react';
import { campaignAPI } from '../../../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import EmptyState from '../../../components/common/EmptyState';
import CampaignImage from '../../../components/common/CampaignImage';

const FRAUD_META = {
  verified:     { label: 'Verified',     badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', bar: 'bg-green-500' },
  under_review: { label: 'Under Review', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', bar: 'bg-amber-500' },
  flagged:      { label: 'Flagged',      badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', bar: 'bg-red-500' },
};

const EMPTY_SUMMARY = { verified: 0, underReview: 0, flagged: 0 };

const statusBadge = (status) =>
  status === 'active' ? 'badge-active'
    : status === 'completed' ? 'badge-resolved'
    : status === 'pending' ? 'badge-pending'
    : 'badge-rejected';

export default function AdminCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showFraud, setShowFraud] = useState(false);
  const [fraudData, setFraudData] = useState(null);
  const [fraudLoading, setFraudLoading] = useState(false);
  const [fraudError, setFraudError] = useState('');
  const [showFinancial, setShowFinancial] = useState(false);
  const [financialReport, setFinancialReport] = useState(null);
  const [financialLoading, setFinancialLoading] = useState(false);
  const [financialError, setFinancialError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await campaignAPI.getAll({ limit: 100 });
      setCampaigns(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await campaignAPI.approve(id);
      toast.success('Campaign approved and is now active');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    }
  };

  const handleReject = async (id) => {
    if (!confirm('Reject this campaign? It will be closed.')) return;
    try {
      await campaignAPI.reject(id);
      toast.success('Campaign rejected and closed');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this campaign permanently?')) return;
    try {
      await campaignAPI.delete(id);
      toast.success('Campaign deleted');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleFraudDetection = async () => {
    setShowFraud(true);
    setFraudLoading(true);
    setFraudError('');
    try {
      const res = await campaignAPI.detectFraud();
      setFraudData(res.data.data || { results: [], summary: { ...EMPTY_SUMMARY }, total: 0 });
    } catch (err) {
      setFraudData(null);
      setFraudError(err.response?.data?.message || 'Failed to load fraud data');
    } finally {
      setFraudLoading(false);
    }
  };

  const handleFinancialReport = async () => {
    setShowFinancial(true);
    setFinancialLoading(true);
    setFinancialError('');
    try {
      const res = await campaignAPI.getFinancialReports();
      setFinancialReport(res.data.data || null);
    } catch (err) {
      setFinancialReport(null);
      setFinancialError(err.response?.data?.message || 'Failed to load financial report');
    } finally {
      setFinancialLoading(false);
    }
  };

  const filtered = campaigns.filter((c) => {
    if (filter === 'pending') return c.status === 'pending';
    if (filter === 'active') return c.status === 'active';
    if (filter === 'completed') return c.status === 'completed';
    return true;
  }).filter((c) =>
    !search || c.title?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  const pendingCount = campaigns.filter((c) => c.status === 'pending').length;

  return (
    <div>
      <PageHeader title="Campaign Management" subtitle={pendingCount > 0 ? <span className="text-amber-600 font-medium">{pendingCount} pending approval</span> : 'All campaigns'}>
        <button onClick={handleFraudDetection} className="btn-secondary flex items-center gap-2 text-sm">
          <ShieldCheck size={18} strokeWidth={2} /> Fraud Check
        </button>
        <button onClick={handleFinancialReport} className="btn-secondary flex items-center gap-2 text-sm">
          <TrendingUp size={18} strokeWidth={2} /> Financial Report
        </button>
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} strokeWidth={2} />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 text-sm"
          />
        </div>
      </PageHeader>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'all', label: `All (${campaigns.length})` },
          { id: 'pending', label: `Pending (${pendingCount})` },
          { id: 'active', label: `Active (${campaigns.filter(c => c.status === 'active').length})` },
          { id: 'completed', label: `Completed (${campaigns.filter(c => c.status === 'completed').length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              filter === t.id
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <th className="pb-3 font-medium">Campaign</th>
              <th className="pb-3 font-medium">Type</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium">Raised</th>
              <th className="pb-3 font-medium">Goal</th>
              <th className="pb-3 font-medium">Donors</th>
              <th className="pb-3 font-medium">Created</th>
              <th className="pb-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">No campaigns found</td>
              </tr>
            ) : filtered.map((c, i) => (
              <motion.tr
                key={c._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    <CampaignImage
                      src={c.image}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover shrink-0"
                      iconSize="w-4 h-4"
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[200px]">{c.title}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[200px]">{c.description}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    c.campaignType === 'infrastructure' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700' :
                    'bg-purple-100 dark:bg-purple-900/30 text-purple-700'
                  }`}>{c.campaignType}</span>
                </td>
                <td className="py-3 pr-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(c.status)}`}>{c.status}</span>
                </td>
                <td className="py-3 pr-4 font-medium text-gray-800 dark:text-gray-200">{c.raisedAmount?.toLocaleString()} ETB</td>
                <td className="py-3 pr-4 text-gray-500">{c.goalAmount?.toLocaleString()} ETB</td>
                <td className="py-3 pr-4 text-gray-500">{c.donors || 0}</td>
                <td className="py-3 pr-4 text-gray-400 text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                <td className="py-3">
                  <div className="flex items-center gap-1">
                    {c.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(c._id)}
                          className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600"
                          title="Approve"
                        >
                          <Check size={16} strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => handleReject(c._id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                          title="Reject"
                        >
                          <Ban size={16} strokeWidth={2} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setSelected(selected === c._id ? null : c._id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                      title="View Details"
                    >
                      <Eye size={16} strokeWidth={2} />
                    </button>
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                      title="Delete"
                    >
                      <X size={16} strokeWidth={2} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6">
            <CampaignDetail campaign={campaigns.find(c => c._id === selected)} onClose={() => setSelected(null)} onApprove={handleApprove} onReject={handleReject} onDelete={handleDelete} />
          </div>
        </div>
      )}

      {/* Fraud Detection Modal */}
      {showFraud && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowFraud(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100"><ShieldCheck className="inline mr-2 text-red-500" size={20} strokeWidth={2} />Fraud Detection</h3>
              <div className="flex items-center gap-2">
                <button onClick={handleFraudDetection} disabled={fraudLoading} className="btn-secondary text-xs py-1.5 px-3">
                  {fraudLoading ? 'Checking...' : 'Refresh'}
                </button>
                <button onClick={() => setShowFraud(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"><X size={16} strokeWidth={2} /></button>
              </div>
            </div>

            {fraudLoading ? (
              <LoadingSpinner />
            ) : fraudError ? (
              <div className="text-center py-10">
                <p className="text-red-500 mb-4">{fraudError}</p>
                <button onClick={handleFraudDetection} className="btn-primary text-sm">Try Again</button>
              </div>
            ) : !fraudData || fraudData.total === 0 ? (
              <p className="text-gray-400 text-center py-10">No donation data available to analyze yet.</p>
            ) : (
              <>
                {/* Summary */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { key: 'verified', count: fraudData.summary?.verified || 0 },
                    { key: 'under_review', count: fraudData.summary?.underReview || 0 },
                    { key: 'flagged', count: fraudData.summary?.flagged || 0 },
                  ].map((s) => (
                    <div key={s.key} className="card p-3 text-center">
                      <p className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1 ${FRAUD_META[s.key].badge}`}>{FRAUD_META[s.key].label}</p>
                      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{s.count}</p>
                    </div>
                  ))}
                </div>

                {/* Per campaign results */}
                <div className="space-y-3">
                  {fraudData.results.map((item, i) => {
                    const meta = FRAUD_META[item.status] || FRAUD_META.verified;
                    return (
                      <div key={i} className={`p-4 rounded-xl border ${item.status === 'flagged' ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10' : item.status === 'under_review' ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10' : 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10'}`}>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{item.campaign?.title || 'Unknown'}</p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.badge}`}>{meta.label}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
                          <span>Donations: {item.stats?.donations || 0}</span>
                          <span>Raised: {(item.stats?.totalRaised || 0).toLocaleString()} ETB</span>
                          <span>Risk Score: {item.riskScore || 0}/100</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                          <div className={`h-full rounded-full ${meta.bar}`} style={{ width: `${item.riskScore || 0}%` }} />
                        </div>
                        <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside space-y-0.5">
                          {item.reasons.map((reason, j) => <li key={j}>{reason}</li>)}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Financial Report Modal */}
      {showFinancial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowFinancial(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100"><TrendingUp className="inline mr-2 text-primary-500" size={20} strokeWidth={2} />Financial Report</h3>
              <div className="flex items-center gap-2">
                <button onClick={handleFinancialReport} disabled={financialLoading} className="btn-secondary text-xs py-1.5 px-3">
                  {financialLoading ? 'Loading...' : 'Refresh'}
                </button>
                <button onClick={() => setShowFinancial(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"><X size={16} strokeWidth={2} /></button>
              </div>
            </div>

            {financialLoading ? (
              <LoadingSpinner />
            ) : financialError ? (
              <div className="text-center py-10">
                <p className="text-red-500 mb-4">{financialError}</p>
                <button onClick={handleFinancialReport} className="btn-primary text-sm">Try Again</button>
              </div>
            ) : !financialReport ? (
              <EmptyState icon={<BarChart3 size={48} strokeWidth={2} />} title="No financial data available" description="No campaigns or donations have been recorded yet." />
            ) : (
              <>
                {/* Summary stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  {[
                    { label: 'Total Donations', value: financialReport.totalDonations?.toLocaleString() || '0' },
                    { label: 'Total Funds Raised', value: `${(financialReport.totalRaised || 0).toLocaleString()} ETB` },
                    { label: 'Total Campaigns', value: financialReport.totalCampaigns?.toLocaleString() || '0' },
                    { label: 'Active Campaigns', value: financialReport.activeCampaigns?.toLocaleString() || '0' },
                    { label: 'Completed Campaigns', value: financialReport.completedCampaigns?.toLocaleString() || '0' },
                    { label: 'Total Donors', value: financialReport.totalDonors?.toLocaleString() || '0' },
                    { label: 'Average Donation', value: `${(financialReport.averageDonation || 0).toLocaleString()} ETB` },
                    { label: 'Campaign Progress', value: `${financialReport.campaignProgress || 0}%` },
                  ].map((s, i) => (
                    <div key={i} className="card p-3 text-center">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{s.value}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Donation trends */}
                {financialReport.monthly?.length > 0 && (
                  <div className="mb-5">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Monthly Donations</h4>
                    <MonthlyChart data={financialReport.monthly} />
                  </div>
                )}

                {/* Recent transactions */}
                {financialReport.recentTransactions?.length > 0 && (
                  <div className="mb-5">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Recent Transactions</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs text-gray-400 border-b border-gray-100 dark:border-gray-700">
                            <th className="py-2 pr-3">Donor</th>
                            <th className="py-2 pr-3">Campaign</th>
                            <th className="py-2 pr-3">Amount</th>
                            <th className="py-2 pr-3">Method</th>
                            <th className="py-2">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {financialReport.recentTransactions.map((d) => (
                            <tr key={d._id} className="border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                              <td className="py-2 pr-3">
                                <div className="font-medium text-gray-800 dark:text-gray-200 capitalize">{d.donorName || d.donor?.fullName || 'Anonymous'}</div>
                              </td>
                              <td className="py-2 pr-3 text-gray-600 dark:text-gray-300 max-w-[180px] truncate">{d.campaign?.title || '—'}</td>
                              <td className="py-2 pr-3 font-semibold text-gray-800 dark:text-gray-200">{d.amount?.toLocaleString()} ETB</td>
                              <td className="py-2 pr-3 capitalize text-gray-500">{d.paymentMethod?.replace('_', ' ')}</td>
                              <td className="py-2 text-gray-500 whitespace-nowrap">{new Date(d.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Campaign breakdown */}
                {financialReport.campaigns?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Campaign Breakdown</h4>
                    <div className="space-y-3">
                      {financialReport.campaigns.map((c) => (
                        <div key={c._id} className="py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-sm mb-1.5">
                            <span className="text-gray-700 dark:text-gray-300 truncate">{c.title}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(c.status)}`}>{c.status}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>{(c.raisedAmount || 0).toLocaleString()} ETB of {(c.goalAmount || 0).toLocaleString()} ETB · {c.donationCount || 0} donations</span>
                            <span className="font-semibold">{c.progress || 0}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${c.status === 'completed' ? 'bg-green-500' : 'bg-primary-500'}`} style={{ width: `${c.progress || 0}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MonthlyChart({ data }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  const labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((d) => {
        const month = parseInt(String(d._id).slice(5), 10);
        return (
          <div key={d._id} className="flex-1 flex flex-col items-center gap-1" title={`${labels[month - 1] || d._id}: ${d.total.toLocaleString()} ETB (${d.count} donations)`}>
            <span className="text-[10px] text-gray-400">{d.total >= 1000 ? `${(d.total / 1000).toFixed(1)}k` : d.total}</span>
            <div className="w-full rounded-t-lg bg-gradient-to-t from-primary-400 to-primary-600" style={{ height: `${(d.total / max) * 100}%`, minHeight: 4 }} />
            <span className="text-[10px] text-gray-400">{labels[month - 1] || d._id.slice(5)}</span>
          </div>
        );
      })}
    </div>
  );
}

function CampaignDetail({ campaign, onClose, onApprove, onReject, onDelete }) {
  if (!campaign) return null;
  const progress = campaign.goalAmount > 0 ? Math.min((campaign.raisedAmount / campaign.goalAmount) * 100, 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Campaign Details</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"><X size={16} strokeWidth={2} /></button>
      </div>
      <CampaignImage
        src={campaign.image}
        alt=""
        className="w-full h-48 object-cover rounded-xl mb-4"
        iconSize="w-12 h-12"
      />
      <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-lg mb-2">{campaign.title}</h4>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{campaign.description}</p>
      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div className="card py-3 px-4 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-xs">Raised</p>
          <p className="font-bold text-gray-800 dark:text-gray-200">{campaign.raisedAmount?.toLocaleString()} ETB</p>
        </div>
        <div className="card py-3 px-4 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-xs">Goal</p>
          <p className="font-bold text-gray-800 dark:text-gray-200">{campaign.goalAmount?.toLocaleString()} ETB</p>
        </div>
        <div className="card py-3 px-4 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-xs">Donors</p>
          <p className="font-bold text-gray-800 dark:text-gray-200">{campaign.donors || 0}</p>
        </div>
        <div className="card py-3 px-4 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-xs">Type</p>
          <p className="font-bold text-gray-800 dark:text-gray-200 capitalize">{campaign.campaignType}</p>
        </div>
      </div>
      <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full mb-4 overflow-hidden">
        <div className={`h-full rounded-full ${progress >= 100 ? 'bg-green-500' : 'bg-primary-500'}`} style={{ width: `${progress}%` }} />
      </div>
      <div className="flex gap-2">
        {campaign.status === 'pending' && (
          <>
            <button onClick={() => { onApprove(campaign._id); onClose(); }} className="btn-primary flex-1 py-2 flex items-center justify-center gap-2">
              <Check size={18} strokeWidth={2} /> Approve
            </button>
            <button onClick={() => { onReject(campaign._id); onClose(); }} className="btn-danger flex-1 py-2 flex items-center justify-center gap-2">
              <Ban size={18} strokeWidth={2} /> Reject
            </button>
          </>
        )}
        <button onClick={() => { onDelete(campaign._id); onClose(); }} className="btn-danger flex-1 py-2 flex items-center justify-center gap-2">
          <X size={18} strokeWidth={2} /> Delete
        </button>
      </div>
    </div>
  );
}
