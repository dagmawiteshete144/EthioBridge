import { useState, useEffect } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import { Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { woredaAPI, infraAPI } from '../../../services/api';
import { toast } from 'react-toastify';
import { getCategoryLabel } from '../../../utils/categories';
import {
  Droplets, Bus, Scale, Bird, Zap, ClipboardList, ArrowUp,
  MessageCircle, FileText, X, Send, Paperclip, Image as ImageIcon, Film, MapPin,
} from 'lucide-react';

const DEPARTMENTS = [
  { id: 'Water', icon: Droplets, description: 'Water supply, sanitation, and drainage reports handled at the woreda' },
  { id: 'Transport', icon: Bus, description: 'Roads, public transport, and traffic reports handled at the woreda' },
  { id: 'Electricity', icon: Zap, description: 'Power supply, blackouts, and electrical infrastructure reports handled at the woreda' },
  { id: 'Ethics and Anti-Corruption', icon: Scale, description: 'Ethics, integrity, and anti-corruption complaints and reports' },
  { id: 'Peace and Security', icon: Bird, description: 'Community peace, safety, and public security complaints' },
];

const STATUS_STYLES = {
  'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  'Submitted': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  'Under Review': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  'Assigned': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  'In Progress': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'Completed': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  'Citizen Verification': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  'Resolved': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'Rejected': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  'Upgraded': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  'Escalated': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'Reopened': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
};

// Statuses a Woreda officer can set from the department view.
const COMPLAINT_STATUS_OPTIONS = ['Pending', 'Submitted', 'Under Review', 'In Progress', 'Resolved', 'Rejected'];
const INFRA_STATUS_OPTIONS = ['Under Review', 'Assigned', 'In Progress', 'Completed', 'Resolved', 'Rejected'];

const isLocked = (report) =>
  report.status === 'Resolved' || report.status === 'Completed' || report.status === 'Closed';

const filesOf = (report) => {
  if (report.source === 'complaint') {
    return {
      photos: report.images || [],
      videos: report.videoUrl ? [report.videoUrl] : [],
      afterPhotos: [],
      afterVideos: [],
    };
  }
  return {
    photos: report.photos || [],
    videos: report.videos || [],
    afterPhotos: report.afterPhotos || [],
    afterVideos: report.afterVideos || [],
  };
};

function DepartmentList() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    woredaAPI.getStats().then(res => setStats(res.data.stats)).catch(() => {});
  }, []);

  return (
    <div>
      <PageHeader title="Departments" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DEPARTMENTS.map(dept => {
          const ds = stats?.departmentStats?.find(d => d.department === dept.id);
          return (
            <Link key={dept.id} to={dept.id}
              className="card p-5 hover:shadow-md transition-shadow block">
              <div className="text-3xl mb-3"><dept.icon className="w-8 h-8" /></div>
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

function ReportDetailModal({ report, onClose, onChanged, focusMessage = false }) {
  const [status, setStatus] = useState(report.status);
  const [note, setNote] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [escalating, setEscalating] = useState(false);

  const isComplaint = report.source === 'complaint';
  const statusOptions = [...new Set([report.status, ...(isComplaint ? COMPLAINT_STATUS_OPTIONS : INFRA_STATUS_OPTIONS)])];
  const files = filesOf(report);
  const comments = report.comments || [];
  const citizen = isComplaint ? report.fullName : report.submittedBy?.fullName;

  const handleStatusUpdate = async () => {
    if (status === report.status) return;
    if (!window.confirm(`Update this report's status to "${status}"?`)) return;
    setSavingStatus(true);
    try {
      if (isComplaint) {
        await woredaAPI.updateComplaintStatus(report._id, { status, note: note.trim() });
      } else {
        await infraAPI.updateStatus(report._id, { status, note: note.trim() });
      }
      toast.success('Report status updated');
      setNote('');
      onChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    setSendingMessage(true);
    try {
      if (isComplaint) {
        await woredaAPI.addComplaintComment(report._id, { text: message.trim() });
      } else {
        await infraAPI.addComment(report._id, { text: message.trim() });
      }
      setMessage('');
      toast.success('Message sent. The citizen can see it in Track Report and their dashboard.');
      onChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleEscalate = async () => {
    if (!window.confirm('Transfer this report up to the Subcity (Level 1) so they can handle it?')) return;
    setEscalating(true);
    try {
      if (isComplaint) {
        await woredaAPI.upgradeComplaint(report._id, {});
      } else {
        await infraAPI.escalate(report._id, {});
      }
      toast.success('Report escalated to Subcity (Level 1)');
      onChanged();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to escalate report');
    } finally {
      setEscalating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 overflow-y-auto p-3 sm:p-6"
      onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 w-full max-w-3xl rounded-2xl shadow-2xl my-4"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[report.status] || 'bg-gray-100'}`}>{report.status}</span>
              <span className="text-xs text-gray-400">{report.reportId}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                {isComplaint ? 'Complaint' : 'Infrastructure'}
              </span>
              {report.riskLevel && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">{report.riskLevel}</span>
              )}
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-1 break-words">{report.title}</h2>
            <p className="text-xs text-gray-500 mt-1">{citizen ? `Citizen: ${citizen}` : ''}{report.level !== undefined ? ` • Level ${report.level}` : ''}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Status control */}
          <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <ClipboardList className="w-4 h-4" /> Update Status
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <select value={status} onChange={e => setStatus(e.target.value)} disabled={isLocked(report)}
                className="input-field sm:max-w-[180px]">
                {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Note (optional)"
                disabled={isLocked(report)}
                className="input-field flex-1"
              />
              <button
                onClick={handleStatusUpdate}
                disabled={savingStatus || status === report.status || isLocked(report)}
                className="btn-primary text-sm px-4 py-2 disabled:opacity-50">
                {savingStatus ? 'Saving...' : 'Update'}
              </button>
            </div>
            {isLocked(report) && <p className="text-xs text-gray-400 mt-2">This report is locked (resolved/completed) and can no longer be modified.</p>}
          </div>

          {/* Description */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{report.description}</p>
            <div className="flex gap-3 mt-2 text-xs text-gray-400 flex-wrap">
              {report.category && <span>{getCategoryLabel(report.category)}</span>}
              {report.region && <span>{report.region}</span>}
              {report.subcity && <span>{report.subcity}</span>}
              {report.woreda && <span>{report.woreda}</span>}
              {report.createdAt && <span>{new Date(report.createdAt).toLocaleDateString()}</span>}
            </div>
          </div>

          {/* Files */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Paperclip className="w-4 h-4" /> Attached Files ({files.photos.length + files.videos.length})
            </p>
            {files.photos.length === 0 && files.videos.length === 0 ? (
              <p className="text-xs text-gray-400">No files attached to this report.</p>
            ) : (
              <div className="space-y-3">
                {files.photos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {files.photos.map((src, i) => (
                      <a key={i} href={src} target="_blank" rel="noreferrer" className="block">
                        <img src={src} alt="" className="h-28 w-full object-cover rounded-lg border border-gray-100 dark:border-gray-800 hover:opacity-90" />
                      </a>
                    ))}
                  </div>
                )}
                {files.videos.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {files.videos.map((src, i) => (
                      <video key={i} src={src} controls className="rounded-lg max-h-48 w-full bg-black" />
                    ))}
                  </div>
                )}
              </div>
            )}
            {files.afterPhotos.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5" /> After-work photos</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {files.afterPhotos.map((src, i) => (
                    <a key={i} href={src} target="_blank" rel="noreferrer" className="block">
                      <img src={src} alt="" className="h-28 w-full object-cover rounded-lg border border-green-200 dark:border-green-800 hover:opacity-90" />
                    </a>
                  ))}
                </div>
              </div>
            )}
            {files.afterVideos.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1"><Film className="w-3.5 h-3.5" /> After-work videos</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {files.afterVideos.map((src, i) => (
                    <video key={i} src={src} controls className="rounded-lg max-h-48 w-full bg-black" />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Location */}
          {report.latitude && report.longitude && (
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              GPS: {Number(report.latitude).toFixed(6)}, {Number(report.longitude).toFixed(6)}
            </div>
          )}

          {/* Timeline */}
          {report.timeline?.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Timeline</p>
              <div className="space-y-2">
                {report.timeline.map((ev, i) => (
                  <div key={i} className="flex gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full mt-1 shrink-0 bg-primary-400" />
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-200 capitalize">{String(ev.status || ev.action || 'Update').replace(/_/g, ' ')}</span>
                      {ev.note && <span className="text-gray-500 dark:text-gray-400"> — {ev.note}</span>}
                      <p className="text-gray-400 dark:text-gray-500">{new Date(ev.updatedAt || ev.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> Messages ({comments.length})
            </p>
            {comments.length > 0 && (
              <div className="space-y-2 max-h-56 overflow-y-auto mb-3">
                {comments.map((c, i) => (
                  <div key={c._id || i} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/60">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-800 dark:text-gray-200 text-xs">{c.authorName}</span>
                      <span className="text-xs text-gray-400">{c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{c.text}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={2}
                autoFocus={focusMessage}
                placeholder="Write a message for the citizen..."
                className="input-field flex-1 text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={sendingMessage || !message.trim()}
                className="btn-primary text-sm px-4 py-2 disabled:opacity-50 shrink-0 inline-flex items-center gap-1.5">
                <Send className="w-4 h-4" /> {sendingMessage ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        {report.level !== 1 && report.status !== 'Resolved' && report.status !== 'Rejected' && report.status !== 'Upgraded' && report.status !== 'Escalated' && report.status !== 'Completed' && (
          <div className="flex items-center justify-between gap-3 p-4 border-t border-gray-100 dark:border-gray-800">
            <button onClick={handleEscalate} disabled={escalating}
              className="text-xs px-3 py-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 inline-flex items-center gap-1">
              <ArrowUp className="w-4 h-4" /> {escalating ? 'Escalating...' : 'Escalate to Subcity (Level 1)'}
            </button>
            <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-200">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

function DepartmentDetail() {
  const { deptId } = useParams();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [focusMessage, setFocusMessage] = useState(false);
  const [savingStatus, setSavingStatus] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = { department: deptId, limit: 50 };
      if (filter) params.status = filter;
      const res = await woredaAPI.getReports(params);
      setReports(res.data.reports);
    } catch (err) {
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [deptId, filter]);

  const handleStatusChange = async (report, status) => {
    if (status === report.status) return;
    let note = '';
    if (status === 'Resolved' || status === 'Rejected') {
      note = window.prompt(`Add a note for status "${status}" (optional):`) || '';
    }
    setSavingStatus(report._id);
    try {
      if (report.source === 'complaint') {
        await woredaAPI.updateComplaintStatus(report._id, { status, note });
      } else {
        await infraAPI.updateStatus(report._id, { status, note });
      }
      toast.success('Report status updated');
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setSavingStatus(null);
    }
  };

  const handleEscalate = async (report) => {
    if (!window.confirm('Transfer this report up to the Subcity (Level 1) so they can handle it?')) return;
    try {
      if (report.source === 'infrastructure') {
        await infraAPI.escalate(report._id, {});
      } else {
        await woredaAPI.upgradeComplaint(report._id);
      }
      toast.success('Report escalated to Subcity (Level 1)');
      fetchReports();
    } catch (err) {
      console.error('[Escalate] Failed to escalate report', {
        reportId: report?._id,
        reportNumber: report?.reportId,
        source: report?.source,
        status: err?.response?.status,
        data: err?.response?.data,
      });
      toast.error(err.response?.data?.message || 'Failed to escalate report');
    }
  };

  const dept = DEPARTMENTS.find(d => d.id === deptId);

  return (
    <div>
      <button onClick={() => navigate('/woreda/dashboard/departments')}
        className="text-sm text-primary-600 hover:underline mb-4">&larr; Back to Departments</button>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">{dept?.icon && <dept.icon className="w-8 h-8" />}</span>
        <div>
          <h2 className="page-title">{deptId} Department</h2>
          <p className="page-subtitle">{dept?.description}</p>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="input-field max-w-[180px]">
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Submitted">Submitted</option>
          <option value="Under Review">Under Review</option>
          <option value="Assigned">Assigned</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Resolved">Resolved</option>
          <option value="Rejected">Rejected</option>
          <option value="Upgraded">Upgraded</option>
          <option value="Escalated">Escalated</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : reports.length === 0 ? (
        <div className="card p-12 text-center text-gray-400"><ClipboardList className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" /><p>No reports for this department</p></div>
      ) : (
        <div className="space-y-3">
          {reports.map(report => {
            const files = filesOf(report);
            const hasFiles = files.photos.length + files.videos.length + files.afterPhotos.length + files.afterVideos.length > 0;
            return (
              <div key={report._id} className="card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[report.status] || 'bg-gray-100'}`}>{report.status}</span>
                      <span className="text-xs text-gray-400">{report.reportId}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {report.source === 'complaint' ? 'Complaint' : 'Infrastructure'}
                      </span>
                      {report.level !== undefined && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${report.level === 1 ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'}`}>
                          Level {report.level === 1 ? 1 : 0}
                        </span>
                      )}
                      {hasFiles && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 inline-flex items-center gap-1">
                          <Paperclip className="w-3 h-3" /> {files.photos.length + files.videos.length + files.afterPhotos.length + files.afterVideos.length} files
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{report.title}</h3>
                    {(report.source === 'complaint' ? report.fullName : report.submittedBy?.fullName) && (
                      <p className="text-xs text-gray-500 mt-1">Citizen: {report.source === 'complaint' ? report.fullName : report.submittedBy?.fullName}{report.riskLevel ? ` • ${report.riskLevel}` : ''}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{report.description}</p>
                    <div className="flex gap-3 mt-2 text-xs text-gray-400">
                      <span>{getCategoryLabel(report.category)}</span>
                      <span>{report.region}</span>
                      <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex flex-col gap-2 items-end">
                    <div className="flex gap-2">
                      <button onClick={() => { setSelected(report); }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-primary-500 text-white hover:bg-primary-600 inline-flex items-center gap-1">
                        <FileText className="w-4 h-4" /> Details
                      </button>
                      <button onClick={() => { setFocusMessage(true); setSelected(report); }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" /> Message
                      </button>
                    </div>
                    <select
                      value=""
                      onChange={e => { if (e.target.value) handleStatusChange(report, e.target.value); e.target.value = ''; }}
                      disabled={savingStatus === report._id || isLocked(report)}
                      className="text-xs border rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 max-w-[160px] disabled:opacity-50">
                      <option value="">{savingStatus === report._id ? 'Saving...' : 'Change Status...'}</option>
                      {(report.source === 'complaint' ? COMPLAINT_STATUS_OPTIONS : INFRA_STATUS_OPTIONS)
                        .filter(s => s !== report.status)
                        .map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {report.level !== 1 && report.status !== 'Resolved' && report.status !== 'Rejected' && report.status !== 'Upgraded' && report.status !== 'Escalated' && report.status !== 'Completed' && (
                      <button onClick={() => handleEscalate(report)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600"
                        title="Transfer to Subcity (Level 1)">
                        <ArrowUp className="w-4 h-4 inline-block" /> Escalate to Subcity
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <ReportDetailModal
          report={selected}
          focusMessage={focusMessage}
          onClose={() => { setSelected(null); setFocusMessage(false); }}
          onChanged={fetchReports}
        />
      )}
    </div>
  );
}

export default function WoredaDepartments() {
  return (
    <Routes>
      <Route index element={<DepartmentList />} />
      <Route path=":deptId" element={<DepartmentDetail />} />
    </Routes>
  );
}
