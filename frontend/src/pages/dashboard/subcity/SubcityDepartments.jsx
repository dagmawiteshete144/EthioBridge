import { useState, useEffect } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import { Routes, Route, Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { subcityAPI, infraAPI } from '../../../services/api';
import { toast } from 'react-toastify';
import { Droplets, Bus, Zap, Scale, Shield, FolderOpen, Video, MessageSquareText } from 'lucide-react';

const DEPARTMENTS = [
  { id: 'Water', icon: Droplets, description: 'Escalated complaints and infrastructure reports from the woreda — water supply and sanitation' },
  { id: 'Transport', icon: Bus, description: 'Escalated complaints and infrastructure reports from the woreda — roads and public transport' },
  { id: 'Electricity', icon: Zap, description: 'Escalated complaints and infrastructure reports from the woreda — electricity supply and power lines' },
  { id: 'Ethics and Anti-Corruption', icon: Scale, description: 'Complaints upgraded from the woreda — ethics, integrity, and anti-corruption' },
  { id: 'Peace and Security', icon: Shield, description: 'Complaints upgraded from the woreda — community peace and public safety' },
];

const STATUS_STYLES = {
  'Upgraded': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  'Escalated': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'Under Review': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'Assigned': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  'In Progress': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'Completed': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  'Citizen Verification': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  'Resolved': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'Rejected': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  'Reopened': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
};

const RISK_STYLES = {
  'Low': 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'Medium': 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  'High': 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const COMPLAINT_STATUSES = ['Upgraded', 'Under Review', 'In Progress', 'Resolved', 'Rejected'];
const INFRA_STATUSES = ['Escalated', 'Under Review', 'Assigned', 'In Progress', 'Completed', 'Citizen Verification', 'Resolved', 'Rejected'];
const ALLOWED_STATUSES = [...new Set([...COMPLAINT_STATUSES, ...INFRA_STATUSES])];

function DepartmentList({ subcity }) {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    subcityAPI.getComplaintStats().then(res => setStats(res.data.departments || [])).catch(() => {});
  }, []);

  return (
    <div>
      <PageHeader title="Departments" subtitle="Complaints and infrastructure reports escalated from the Woreda (Level 0) to this Subcity (Level 1)" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DEPARTMENTS.map(dept => {
          const ds = stats.find(d => d.department === dept.id);
          return (
            <Link key={dept.id} to={dept.id}
              className="card p-5 hover:shadow-md transition-shadow block">
              <dept.icon size={28} strokeWidth={2} className="text-primary-600 dark:text-primary-400 mb-3" />
              <h3 className="font-bold text-gray-900 dark:text-gray-100">{dept.id}</h3>
              <p className="text-sm text-gray-500 mt-1">{dept.description}</p>
              <div className="flex gap-4 mt-3 text-sm">
                <span className="text-gray-600 dark:text-gray-300">Total: <strong>{ds?.total || 0}</strong></span>
                <span className="text-green-600">Resolved: <strong>{ds?.resolved || 0}</strong></span>
                <span className="text-yellow-600">Pending: <strong>{ds?.pending || 0}</strong></span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function DepartmentDetail({ subcity }) {
  const { deptId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const base = location.pathname.split('/').slice(0, 4).join('/');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [openFeedback, setOpenFeedback] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [sending, setSending] = useState(false);
  const [details, setDetails] = useState(null);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = { department: deptId, limit: 20 };
      if (filter) params.status = filter;
      const res = await subcityAPI.getComplaints(params);
      setReports(res.data.complaints || []);
      setTotalPages(res.data.pages || 1);
      setTotal(res.data.total || 0);
    } catch (err) {
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComplaints(); }, [deptId, filter, page]);

  const handleStatusUpdate = async (item, status) => {
    if (status === item.status) return;
    try {
      if (item.source === 'complaint') {
        await subcityAPI.updateComplaintStatus(item._id, { status });
      } else {
        await subcityAPI.updateReportStatus(item._id, { status });
      }
      toast.success('Status updated');
      fetchComplaints();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleFeedback = async (item) => {
    if (!feedbackText.trim()) { toast.error('Please write feedback first'); return; }
    setSending(true);
    try {
      if (item.source === 'complaint') {
        await subcityAPI.addComplaintFeedback(item._id, { text: feedbackText.trim() });
      } else {
        const text = feedbackText.trim();
        await Promise.all([
          // Post to the report so the message appears on the citizen's Track Report page.
          infraAPI.addComment(item._id, { text }),
          subcityAPI.addDepartmentFeedback({
            department: item.routingDepartment || item.department || 'General',
            text,
            recipient: 'citizen',
            citizenId: item.submittedBy?._id || item.submittedBy || null,
          }),
        ]);
      }
      toast.success('Feedback sent to the citizen');
      setFeedbackText('');
      setOpenFeedback(null);
      fetchComplaints();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send feedback');
    } finally {
      setSending(false);
    }
  };

  const dept = DEPARTMENTS.find(d => d.id === deptId);

  const citizenOf = (item) => {
    if (item.source === 'complaint') return item.fullName;
    return item.submittedBy?.fullName || item.reporterName || 'Guest citizen';
  };

  const filesOf = (item) => {
    if (item.source === 'complaint') {
      return { photos: item.images || [], videos: item.videoUrl ? [item.videoUrl] : [] };
    }
    return { photos: item.photos || [], videos: item.videos || [] };
  };

  const timelineOf = (item) => item.timeline || [];

  return (
    <div>
      <button onClick={() => navigate(`${base}/departments`)}
        className="text-sm text-primary-600 hover:underline mb-4">&larr; Back to Departments</button>
      <div className="flex items-center gap-3 mb-6">
        {dept && <dept.icon size={28} strokeWidth={2} className="text-primary-600 dark:text-primary-400" />}
        <div>
          <h2 className="page-title">{deptId} Department</h2>
          <p className="page-subtitle">
            Escalated complaints and infrastructure reports in {subcity} Subcity (Level 1)
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}
          className="input-field max-w-[180px]">
          <option value="">All Status</option>
          {ALLOWED_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <p className="text-sm text-gray-500 mb-4">{total} escalated report(s)</p>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : reports.length === 0 ? (
        <div className="card p-12 text-center text-gray-400"><FolderOpen size={48} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" /><p>No escalated reports for this department</p></div>
      ) : (
        <div className="space-y-3">
          {reports.map(item => {
            const isComplaint = item.source === 'complaint';
            const files = filesOf(item);
            return (
              <div key={item._id} className="card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[item.status] || 'bg-gray-100'}`}>{item.status}</span>
                      <span className="text-xs text-gray-400">{item.reportId}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">Level 1</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${isComplaint ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                        {isComplaint ? 'Complaint' : 'Infrastructure'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{item.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      From Woreda: {item.woreda} • Citizen: {citizenOf(item)}
                      {item.riskLevel ? ` • ${item.riskLevel}` : ''}
                    </p>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                    <div className="flex gap-3 mt-2 text-xs text-gray-400">
                      <span>{isComplaint ? item.department : item.routingDepartment || item.department}</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      {files.photos.length > 0 && <span>{files.photos.length} photo(s)</span>}
                      {files.videos.length > 0 && <Video size={16} className="inline" />}
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex flex-col gap-2 items-end">
                    <button
                      type="button"
                      onClick={() => setDetails(details === item._id ? null : item._id)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      {details === item._id ? 'Hide' : 'View'} History
                    </button>
                    <select
                      value={item.status}
                      onChange={e => handleStatusUpdate(item, e.target.value)}
                      disabled={['Resolved', 'Completed', 'Closed'].includes(item.status)}
                      title={['Resolved', 'Completed', 'Closed'].includes(item.status) ? 'This report is locked' : 'Update status'}
                      className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                    >
                      {[...new Set([item.status, ...(isComplaint ? COMPLAINT_STATUSES : INFRA_STATUSES)])].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => { setOpenFeedback(openFeedback === item._id ? null : item._id); setFeedbackText(''); }}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      <MessageSquareText size={14} />
                      Feedback
                    </button>
                  </div>
                </div>

                {details === item._id && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">Escalation History</p>
                    {timelineOf(item).length === 0 ? (
                      <p className="text-xs text-gray-400">No history recorded.</p>
                    ) : (
                      <div className="space-y-2">
                        {timelineOf(item).map((ev, idx) => (
                          <div key={idx} className="flex gap-2 text-xs">
                            <span className="w-2 h-2 rounded-full mt-1 shrink-0 bg-primary-400" />
                            <div>
                              <span className="font-medium text-gray-700 dark:text-gray-200 capitalize">
                                {String(ev.action || ev.status || 'Update').replace(/_/g, ' ')}
                              </span>
                              {ev.note && <span className="text-gray-500 dark:text-gray-400"> — {ev.note}</span>}
                              {!ev.note && ev.description && <span className="text-gray-500 dark:text-gray-400"> — {ev.description}</span>}
                              <p className="text-gray-400 dark:text-gray-500">
                                {ev.performedByName && <span className="mr-1">{ev.performedByName}</span>}
                                {new Date(ev.updatedAt || ev.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {(item.comments?.length > 0 || openFeedback === item._id) && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    {item.comments?.length > 0 && (
                      <div className="space-y-2 mb-3">
                        {item.comments.map((cm, idx) => (
                          <div key={idx} className="bg-gray-50 dark:bg-gray-800/60 rounded-lg p-2.5 text-xs">
                            <p className="text-gray-700 dark:text-gray-300">{cm.text}</p>
                            <p className="text-gray-400 mt-1">
                              {cm.authorName || 'Citizen'} • {cm.authorRole === 'citizen' ? 'Citizen' : 'Subcity'} • {new Date(cm.createdAt || Date.now()).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                    {openFeedback === item._id && (
                      <div className="flex gap-2">
                        <textarea
                          rows={2}
                          value={feedbackText}
                          onChange={e => setFeedbackText(e.target.value)}
                          placeholder="Write feedback for the citizen about this report..."
                          className="input-field flex-1 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleFeedback(item)}
                          disabled={sending}
                          className="btn-primary px-3 py-1.5 text-xs self-start disabled:opacity-50"
                        >
                          {sending ? 'Sending...' : 'Send'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-50">Previous</button>
          <span className="flex items-center text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}

export default function SubcityDepartments({ subcity }) {
  return (
    <Routes>
      <Route index element={<DepartmentList subcity={subcity} />} />
      <Route path=":deptId" element={<DepartmentDetail subcity={subcity} />} />
    </Routes>
  );
}
