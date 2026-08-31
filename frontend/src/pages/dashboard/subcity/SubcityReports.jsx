import { useState, useEffect } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import { subcityAPI, complaintAPI } from '../../../services/api';
import StatusBadge from '../../../components/common/StatusBadge';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import EmptyState from '../../../components/common/EmptyState';
import Pagination from '../../../components/common/Pagination';
import { toast } from 'react-toastify';
import { getCategoryLabel } from '../../../utils/categories';
import { Construction, BadgeDollarSign, MessageSquareWarning, Send, ClipboardList, Megaphone, TriangleAlert } from 'lucide-react';

const INFRA_STATUS_OPTIONS = ['Pending', 'Under Review', 'Approved', 'Assigned', 'In Progress', 'Completed', 'Citizen Verification', 'Resolved', 'Reopened', 'Received', 'Closed', 'Upgraded', 'Escalated'];
const INFRA_STATUS_FILTER = ['Pending', 'Under Review', 'Approved', 'Rejected', 'Assigned', 'In Progress', 'Completed', 'Citizen Verification', 'Resolved', 'Reopened', 'Received', 'Closed', 'Upgraded', 'Escalated'];
const CAMPAIGN_STATUS_OPTIONS = ['pending', 'active', 'completed', 'closed'];
const PUBLIC_COMPLAINT_STATUS_OPTIONS = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected'];

const TABS = [
  { id: 'infrastructure', label: 'Infrastructure', icon: Construction },
  { id: 'campaigns', label: 'Campaign / Fundraising', icon: BadgeDollarSign },
  { id: 'public-complaints', label: 'Public Complaints', icon: MessageSquareWarning },
];

// Maps a report to the department its feedback is delivered to. Uses the
// stored department/routingDepartment, and falls back to the report category.
const departmentNameFor = (report) => {
  const dept = report?.department || report?.routingDepartment || '';
  if (dept) return dept;
  const category = report?.category || '';
  if (category === 'electricity_issue') return 'Electricity';
  if (category === 'water_supply_issue') return 'Water';
  if (category === 'road_issue') return 'Transport';
  return 'General';
};

const statusSelectClass = "text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50";

function InfraTab({ subcity }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [msgReport, setMsgReport] = useState(null);
  const [msgText, setMsgText] = useState('');
  const [msgRecipient, setMsgRecipient] = useState('citizen');
  const [sending, setSending] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, type: 'infrastructure' };
      if (search) params.search = search;
      if (status) params.status = status;
      const res = await subcityAPI.getReports(params);
      setReports(res.data.reports);
      setPages(res.data.pages || 1);
    } catch (err) {
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page, search, status]);

  const handleStatusUpdate = async (id, newStatus) => {
    setReports(prev => prev.map(r => (r._id === id ? { ...r, status: newStatus } : r)));
    try {
      await subcityAPI.updateReportStatus(id, { status: newStatus });
      toast.success('Status updated');
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
      fetchReports();
    }
  };

  const handleSendMessage = async () => {
    if (!msgText.trim()) { toast.error('Please write a message first'); return; }
    const citizenId = msgReport.submittedBy?._id || msgReport.submittedBy || null;
    if (msgRecipient === 'citizen' && !citizenId) {
      toast.error('This report has no registered citizen to message');
      return;
    }
    setSending(true);
    try {
      await subcityAPI.addDepartmentFeedback({
        department: departmentNameFor(msgReport),
        text: msgText.trim(),
        recipient: msgRecipient,
        citizenId,
      });
      toast.success('Message sent');
      setMsgText('');
      setMsgReport(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search reports..."
          className="input-field flex-1 min-w-[180px]"
        />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="input-field w-auto">
          <option value="">All Status</option>
          {INFRA_STATUS_FILTER.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner /> : reports.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No reports found" description="No infrastructure reports match the current filters." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 dark:bg-gray-700 text-left">
              <th className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">Report</th>
              <th className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">Woreda</th>
              <th className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">Category</th>
              <th className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">Date</th>
              <th className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">Status</th>
              <th className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {reports.map(r => (
                <tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800 dark:text-gray-200 max-w-[220px] truncate">{r.title}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{r.reportId || r.trackingNumber}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{r.woreda}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{getCategoryLabel(r.category)}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 items-center">
                      <select
                        value={r.status}
                        onChange={e => handleStatusUpdate(r._id, e.target.value)}
                        disabled={['Completed', 'Resolved', 'Closed'].includes(r.status)}
                        title={['Completed', 'Resolved', 'Closed'].includes(r.status) ? 'This report is locked' : 'Update status'}
                        className={statusSelectClass}
                      >
                        {[...new Set([r.status, ...INFRA_STATUS_OPTIONS])].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button
                        type="button"
                        onClick={() => { setMsgReport(r); setMsgText(''); }}
                        className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40 px-2 py-1 rounded-lg"
                      >
                        Write Message
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={pages} onPageChange={setPage} />

      {msgReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl dark:bg-gray-800 shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg mb-1 text-gray-800 dark:text-gray-200">Write Message</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{msgReport.title}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Send message to</label>
                <select value={msgRecipient} onChange={e => setMsgRecipient(e.target.value)} className="input-field">
                  <option value="citizen">Citizen</option>
                  <option value="city">City Administration</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Department: {departmentNameFor(msgReport)}{msgReport.submittedBy?._id ? ` • To citizen: ${msgReport.submittedBy?.fullName || 'the report submitter'}` : ''}
                </p>
              </div>
              <textarea
                rows={3}
                value={msgText}
                onChange={e => setMsgText(e.target.value)}
                placeholder="Write your message for this report..."
                className="input-field w-full"
              />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setMsgReport(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSendMessage} disabled={sending} className="btn-primary flex-1 inline-flex items-center justify-center gap-1.5 disabled:opacity-50">
                <Send size={15} />{sending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CampaignsTab({ subcity }) {
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 200 };
      if (search) params.search = search;
      if (status) params.status = status;
      const res = await subcityAPI.getCampaigns(params);
      setCampaigns(res.data.campaigns || []);
      setStats(res.data.stats || null);
      setPages(res.data.pages || 1);
    } catch (err) {
      toast.error('Failed to fetch campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [page, search, status]);

  const handleStatusUpdate = async (id, newStatus) => {
    setCampaigns(prev => prev.map(c => (c._id === id ? { ...c, status: newStatus } : c)));
    try {
      await subcityAPI.updateCampaignStatus(id, { status: newStatus });
      toast.success('Status updated');
      fetchCampaigns();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
      fetchCampaigns();
    }
  };

  return (
    <div className="space-y-4">
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card p-4">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.activeCampaigns || 0}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Active Campaigns</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{(stats.totalRaised || 0).toLocaleString()} ETB</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Raised</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{(stats.totalDonors || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Donors</p>
          </div>
          <div className="card p-4">
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.totalDonors ? Math.round((stats.totalRaised || 0) / stats.totalDonors).toLocaleString() : '0'} ETB
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Avg. Contribution</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search campaigns..."
          className="input-field flex-1 min-w-[180px]"
        />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="input-field w-auto">
          <option value="">All Status</option>
          {CAMPAIGN_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner /> : campaigns.length === 0 ? (
        <EmptyState icon={Megaphone} title="No campaigns found" description={`No campaigns found for ${subcity} Subcity.`} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 dark:bg-gray-700 text-left">
              <th className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">Campaign</th>
              <th className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">Woreda</th>
              <th className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">Raised</th>
              <th className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">Goal</th>
              <th className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">Donors</th>
              <th className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">Status</th>
              <th className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {campaigns.map(c => (
                <tr key={c._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800 dark:text-gray-200 max-w-[220px] truncate">{c.title}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{c.campaignType}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{c.location?.woreda || c.location?.subcity || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{(c.raisedAmount || 0).toLocaleString()} ETB</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{(c.goalAmount || 0).toLocaleString()} ETB</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{c.donors || 0}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3">
                    <select
                      value={c.status}
                      onChange={e => handleStatusUpdate(c._id, e.target.value)}
                      disabled={['completed', 'closed'].includes(c.status)}
                      title={['completed', 'closed'].includes(c.status) ? 'This campaign is locked' : 'Update status'}
                      className={statusSelectClass}
                    >
                      {CAMPAIGN_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={pages} onPageChange={setPage} />
    </div>
  );
}

function PublicComplaintsTab({ subcity }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [msgFor, setMsgFor] = useState(null);
  const [msgText, setMsgText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (status) params.status = status;
      const res = await subcityAPI.getPublicComplaints(params);
      setComplaints(res.data.complaints || []);
      setPages(res.data.pages || 1);
    } catch (err) {
      toast.error('Failed to fetch public complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [page, search, status]);

  const handleStatusUpdate = async (id, newStatus) => {
    setComplaints(prev => prev.map(c => (c._id === id ? { ...c, status: newStatus } : c)));
    try {
      await complaintAPI.updateStatus(id, { status: newStatus });
      toast.success('Status updated');
      fetchComplaints();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
      fetchComplaints();
    }
  };

  const handleSendMessage = async (id) => {
    if (!msgText.trim()) { toast.error('Write a message first'); return; }
    setSendingMsg(true);
    try {
      await complaintAPI.addMessage(id, { text: msgText.trim() });
      toast.success('Message sent. The citizen can see it on the Track page.');
      setMsgText('');
      setMsgFor(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSendingMsg(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search complaints..."
          className="input-field flex-1 min-w-[180px]"
        />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="input-field w-auto">
          <option value="">All Status</option>
          {PUBLIC_COMPLAINT_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner /> : complaints.length === 0 ? (
        <EmptyState icon={TriangleAlert} title="No complaints found" description={`No public complaints found for ${subcity} Subcity.`} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 dark:bg-gray-700 text-left">
              <th className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">Complaint</th>
              <th className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">Category</th>
              <th className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">Priority</th>
              <th className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">Woreda</th>
              <th className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">Date</th>
              <th className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">Status</th>
              <th className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {complaints.map(c => (
                <tr key={c._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800 dark:text-gray-200 max-w-[220px] truncate">{c.title}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{c.trackingNumber}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{c.category}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{c.priority}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{c.woredaName || c.district}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={c.status}
                        onChange={e => handleStatusUpdate(c._id, e.target.value)}
                        disabled={['Resolved'].includes(c.status)}
                        title={['Resolved'].includes(c.status) ? 'This complaint is resolved' : 'Update status'}
                        className={statusSelectClass}
                      >
                        {PUBLIC_COMPLAINT_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button
                        onClick={() => { setMsgFor(msgFor === c._id ? null : c._id); setMsgText(''); }}
                        className={`p-1.5 rounded-lg border transition-colors ${msgFor === c._id ? 'bg-primary-500 text-white border-primary-500' : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        title="Send a message to the citizen"
                      >
                        <MessageSquareWarning size={15} />
                      </button>
                    </div>
                    {msgFor === c._id && (
                      <div className="flex gap-2 mt-2">
                        <input
                          value={msgText}
                          onChange={e => setMsgText(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(c._id); }}
                          placeholder="Write a message to the citizen..."
                          className="input-field text-xs py-1 px-2 flex-1 min-w-[160px]"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSendMessage(c._id)}
                          disabled={sendingMsg}
                          className="btn-primary text-xs py-1 px-3 inline-flex items-center gap-1"
                        >
                          <Send size={13} /> {sendingMsg ? 'Sending...' : 'Send'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={pages} onPageChange={setPage} />
    </div>
  );
}

export default function SubcityReports({ subcity }) {
  const [tab, setTab] = useState('infrastructure');

  return (
    <div className="space-y-5">
      <PageHeader title="Reports" />

      <div className="flex flex-wrap gap-3">
        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`px-4 py-2 text-sm font-medium inline-flex items-center gap-1.5 ${tab === t.id ? 'bg-primary-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
                <Icon size={15} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === 'infrastructure' && <InfraTab subcity={subcity} />}
      {tab === 'campaigns' && <CampaignsTab subcity={subcity} />}
      {tab === 'public-complaints' && <PublicComplaintsTab subcity={subcity} />}
    </div>
  );
}
