import { useState, useEffect } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ban, ChartColumn, Check, ExternalLink, Eye, HandHeart, Heart, List, Megaphone, Pencil, Plus, Trash2, Trophy, Users } from 'lucide-react';
import { campaignAPI } from '../../../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import CampaignImage from '../../../components/common/CampaignImage';
import CreateCampaign from './CreateCampaign';

const statusClass = (status) =>
  status === 'active' ? 'badge-active'
    : status === 'pending' ? 'badge-pending'
    : status === 'completed' ? 'badge-resolved'
    : 'badge-rejected';

export default function CampaignManager({ basePath, title = 'Fundraising Campaigns', subtitle = 'Manage, publish and monitor your campaigns' }) {
  const [tab, setTab] = useState('campaigns');
  const [creating, setCreating] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [donations, setDonations] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [perCampaign, setPerCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDonations, setLoadingDonations] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const loadCampaigns = async () => {
    try {
      const [cRes, aRes] = await Promise.all([
        campaignAPI.getMy({ limit: 100 }),
        campaignAPI.getStats(),
      ]);
      setCampaigns(cRes.data.data || []);
      setAnalytics(aRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadDonations = async () => {
    setLoadingDonations(true);
    try {
      const res = await campaignAPI.getDonationHistory({ limit: 100 });
      setDonations(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load donations');
    } finally {
      setLoadingDonations(false);
    }
  };

  useEffect(() => {
    if (tab === 'donations') loadDonations();
    if (tab === 'analytics' && selectedCampaign) loadCampaignAnalytics(selectedCampaign);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, selectedCampaign]);

  const loadCampaignAnalytics = async (id) => {
    try {
      const res = await campaignAPI.getCampaignAnalytics(id);
      setPerCampaign(res.data.data);
    } catch (err) {
      toast.error('Failed to load analytics');
    }
  };

  const runAction = async (id, action) => {
    setActionId(id);
    try {
      if (action === 'publish') {
        await campaignAPI.publish(id);
        toast.success('Campaign published! It is now live on the public pages.');
      } else if (action === 'close') {
        await campaignAPI.close(id);
        toast.success('Campaign closed. New donations are disabled.');
      } else if (action === 'delete') {
        if (!confirm('Delete this campaign permanently? Donations are kept for records.')) return;
        await campaignAPI.delete(id);
        toast.success('Campaign deleted');
      }
      await loadCampaigns();
      if (selectedCampaign === id) setSelectedCampaign(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionId(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  // Create/Edit form is rendered inline inside the fundraising page.
  if (creating) {
    return (
      <CreateCampaign
        basePath={basePath}
        editCampaignId={creating.id}
        onDone={() => { setCreating(null); loadCampaigns(); }}
      />
    );
  }

  const stats = analytics || {};
  const statCards = [
    { icon: List, label: 'Total', value: stats.totalCampaigns || 0, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' },
    { icon: Check, label: 'Active', value: stats.activeCampaigns || 0, color: 'bg-green-100 dark:bg-green-900/20 text-green-600' },
    { icon: Heart, label: 'Raised', value: `${(stats.totalRaised || 0).toLocaleString()} ETB`, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' },
    { icon: Users, label: 'Donors', value: stats.totalDonors || 0, color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' },
  ];

  const tabs = [
    { id: 'campaigns', label: `Campaigns (${campaigns.length})`, icon: List },
    { id: 'donations', label: 'Donations', icon: HandHeart },
    { id: 'analytics', label: 'Analytics', icon: ChartColumn },
  ];

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle}>
        <button
          onClick={() => setCreating({ mode: 'create' })}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Create Campaign
        </button>
      </PageHeader>

      {/* Stats */}
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

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                tab === t.id ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ===== CAMPAIGNS ===== */}
      {tab === 'campaigns' && (
        <div className="space-y-3">
          {campaigns.length === 0 ? (
            <div className="text-center py-16 card">
              <Megaphone className="w-12 h-12 mb-4 mx-auto text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400 mb-1">No campaigns yet.</p>
              <button onClick={() => setCreating({ mode: 'create' })} className="btn-primary mt-3 text-sm py-2.5 px-6">Create your first campaign</button>
            </div>
          ) : campaigns.map((c, i) => (
            <motion.div
              key={c._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="card flex flex-col lg:flex-row items-start lg:items-center gap-4"
            >
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
              <div className="flex flex-wrap gap-2 shrink-0">
                {c.status === 'pending' && (
                  <button onClick={() => runAction(c._id, 'publish')} disabled={actionId === c._id} className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Publish
                  </button>
                )}
                {c.status === 'active' && (
                  <button onClick={() => runAction(c._id, 'close')} disabled={actionId === c._id} className="bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs font-semibold py-2 px-3 rounded-lg flex items-center gap-1.5">
                    <Ban className="w-4 h-4" /> Close
                  </button>
                )}
                {c.status === 'active' && (
                  <Link to={`/fundraising/${c._id}`} title="View on public site" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                )}
                <button onClick={() => setCreating({ mode: 'edit', id: c._id })} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500" title="Edit">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => setSelectedCampaign(c._id)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500" title="Donations & Analytics">
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={() => runAction(c._id, 'delete')} disabled={actionId === c._id} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ===== DONATIONS ===== */}
      {tab === 'donations' && (
        <div className="card overflow-hidden">
          {loadingDonations ? (
            <LoadingSpinner />
          ) : donations.length === 0 ? (
            <div className="text-center py-16">
              <HandHeart className="w-9 h-9 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No donations received yet. Share your campaign to start receiving support!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-100 dark:border-gray-700">
                    <th className="py-3 px-4">Donor</th>
                    <th className="py-3 px-4">Campaign</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((d) => (
                    <tr key={d._id} className="border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-800 dark:text-gray-200 capitalize">{d.donorName || 'Anonymous'}</div>
                        {d.donor?.email && <div className="text-xs text-gray-400">{d.donor.email}</div>}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300 max-w-[220px] truncate">{d.campaign?.title || '—'}</td>
                      <td className="py-3 px-4 font-bold text-gray-800 dark:text-gray-200">{d.amount?.toLocaleString()} ETB</td>
                      <td className="py-3 px-4 capitalize text-gray-500">{d.paymentMethod?.replace('_', ' ')}</td>
                      <td className="py-3 px-4 text-gray-500">{new Date(d.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        {d.receiptNumber ? (
                          <Link to={`/fundraising`} className="text-primary-600 text-xs font-medium">View</Link>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===== ANALYTICS ===== */}
      {tab === 'analytics' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Campaign</label>
            <select value={selectedCampaign || ''} onChange={(e) => setSelectedCampaign(e.target.value)} className="input-field text-sm max-w-md">
              <option value="">Select a campaign...</option>
              {campaigns.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>
          </div>

          {selectedCampaign && perCampaign ? (
            <>
              <div className="grid sm:grid-cols-4 gap-4">
                {[
                  { label: 'Goal', value: `${perCampaign.campaign.goalAmount.toLocaleString()} ETB` },
                  { label: 'Raised', value: `${perCampaign.campaign.raisedAmount.toLocaleString()} ETB` },
                  { label: 'Remaining', value: `${perCampaign.campaign.remaining.toLocaleString()} ETB` },
                  { label: 'Progress', value: `${perCampaign.campaign.progress}%` },
                ].map((s, i) => (
                  <div key={i} className="card text-center">
                    <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2"><ChartColumn className="w-4 h-4" /> Monthly Donations</h3>
                  {perCampaign.monthly.length === 0 ? (
                    <p className="text-sm text-gray-400 py-6 text-center">No donation data yet.</p>
                  ) : (
                    <MonthlyChart data={perCampaign.monthly} />
                  )}
                </div>
                <div className="card">
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2"><Trophy className="w-4 h-4" /> By Payment Method</h3>
                  {perCampaign.byMethod.length === 0 ? (
                    <p className="text-sm text-gray-400 py-6 text-center">No donation data yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {perCampaign.byMethod.map((m) => (
                        <li key={m._id} className="flex items-center justify-between text-sm">
                          <span className="capitalize text-gray-600 dark:text-gray-300">{m._id.replace('_', ' ')}</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{m.total.toLocaleString()} ETB <span className="text-xs text-gray-400">({m.count})</span></span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="card text-center py-16">
              <ChartColumn className="w-9 h-9 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Select a campaign to view its analytics.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MonthlyChart({ data }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  return (
    <div className="flex items-end gap-2 h-40">
      {data.map((d) => (
        <div key={d._id} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-gray-400">{d.total >= 1000 ? `${(d.total / 1000).toFixed(1)}k` : d.total}</span>
          <div className="w-full rounded-t-lg bg-gradient-to-t from-primary-400 to-primary-600" style={{ height: `${(d.total / max) * 100}%`, minHeight: 4 }} />
          <span className="text-[10px] text-gray-400">{d._id.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}
