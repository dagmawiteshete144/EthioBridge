import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../../components/common/PageHeader';
import { subcityAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import CampaignImage from '../../../components/common/CampaignImage';
import { List, Check, Heart, Users, Plus, ExternalLink, XCircle, Trophy, RefreshCw } from 'lucide-react';

const STATUS_OPTIONS = ['pending', 'active', 'completed', 'closed'];

const statusClass = (status) =>
  status === 'active' ? 'badge-active'
    : status === 'pending' ? 'badge-pending'
    : status === 'completed' ? 'badge-resolved'
    : 'badge-rejected';

export default function SubcityCampaigns({ basePath }) {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [actionId, setActionId] = useState(null);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filter) params.status = filter;
      const res = await subcityAPI.getCampaigns(params);
      setCampaigns(res.data.campaigns || []);
      setStats(res.data.stats || null);
      setPages(res.data.pages || 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const updateStatus = async (id, status) => {
    if (status === 'closed' && !window.confirm('Close this campaign? New donations will be disabled.')) return;
    setActionId(id);
    try {
      await subcityAPI.updateCampaignStatus(id, { status });
      toast.success(`Campaign status set to ${status}`);
      fetchCampaigns();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update campaign status');
    } finally {
      setActionId(null);
    }
  };

  const statCards = [
    { icon: List, label: 'Total', value: stats?.totalCampaigns || 0, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' },
    { icon: Check, label: 'Active', value: stats?.activeCampaigns || 0, color: 'bg-green-100 dark:bg-green-900/20 text-green-600' },
    { icon: Heart, label: 'Raised', value: `${(stats?.totalRaised || 0).toLocaleString()} ETB`, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' },
    { icon: Users, label: 'Donors', value: stats?.totalDonors || 0, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' },
  ];

  return (
    <div>
      <PageHeader
        title={`${user?.subcity ? `${user.subcity} ` : ''}Campaign Management`}
        subtitle="Review and manage all fundraising campaigns in your subcity"
      >
        <Link to={`${basePath}/create-campaign`} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Create Campaign
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="card text-center">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center text-lg mx-auto mb-2`}><Icon className="w-5 h-5" /></div>
              <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }} className="input-field w-auto text-sm">
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : campaigns.length === 0 ? (
        <div className="card text-center py-16">
          <List className="w-12 h-12 mb-4 mx-auto text-gray-400" />
          <p className="text-gray-500 dark:text-gray-400 mb-1">No campaigns found in your subcity.</p>
          <Link to={`${basePath}/create-campaign`} className="btn-primary mt-3 text-sm py-2.5 px-6 inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create your first campaign
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => (
            <div key={c._id} className="card flex flex-col lg:flex-row items-start lg:items-center gap-4">
              <CampaignImage
                src={c.image}
                alt=""
                className="w-16 h-16 rounded-xl object-cover shrink-0"
                iconSize="w-6 h-6"
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 truncate">{c.title}</h3>
                  <span className={`${statusClass(c.status)} text-xs`}>{c.status}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-gray-400 mt-1">
                  <span className="capitalize px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700">{c.campaignType}</span>
                  {c.subType && <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700">{c.subType}</span>}
                  {c.location?.subcity && <span>{c.location.subcity}</span>}
                  {c.location?.woreda && <span>· {c.location.woreda}</span>}
                  <span>{c.donors || 0} donors</span>
                </div>
                <div className="w-full max-w-xs h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${c.status === 'completed' ? 'bg-green-500' : 'bg-primary-500'}`}
                    style={{ width: `${c.goalAmount > 0 ? Math.min((c.raisedAmount / c.goalAmount) * 100, 100) : 0}%` }}
                  />
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-gray-800 dark:text-gray-200">{c.raisedAmount?.toLocaleString()} ETB</p>
                <p className="text-xs text-gray-400">of {c.goalAmount?.toLocaleString()} ETB</p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0 items-center">
                {c.status === 'pending' && (
                  <button onClick={() => updateStatus(c._id, 'active')} disabled={actionId === c._id} className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center gap-1.5 disabled:opacity-50">
                    <Check className="w-4 h-4" /> Approve
                  </button>
                )}
                {c.status === 'active' && (
                  <>
                    <button onClick={() => updateStatus(c._id, 'completed')} disabled={actionId === c._id} className="bg-green-100 hover:bg-green-200 text-green-700 text-xs font-semibold py-2 px-3 rounded-lg flex items-center gap-1.5 disabled:opacity-50">
                      <Trophy className="w-4 h-4" /> Completed
                    </button>
                    <button onClick={() => updateStatus(c._id, 'closed')} disabled={actionId === c._id} className="bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs font-semibold py-2 px-3 rounded-lg flex items-center gap-1.5 disabled:opacity-50">
                      <XCircle className="w-4 h-4" /> Close
                    </button>
                  </>
                )}
                {['completed', 'closed'].includes(c.status) && (
                  <button onClick={() => updateStatus(c._id, 'active')} disabled={actionId === c._id} className="bg-green-100 hover:bg-green-200 text-green-700 text-xs font-semibold py-2 px-3 rounded-lg flex items-center gap-1.5 disabled:opacity-50">
                    <RefreshCw className="w-4 h-4" /> Reactivate
                  </button>
                )}
                {c.status === 'active' && (
                  <Link to={`/fundraising/${c._id}`} title="View on public site" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-50">Previous</button>
          <span className="flex items-center text-sm text-gray-500">Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}
