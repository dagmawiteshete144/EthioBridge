import { useState, useEffect } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { deptAPI } from '../../../services/api';
import { toast } from 'react-toastify';
import { getCategoryLabel } from '../../../utils/categories';
import { ClipboardList } from 'lucide-react';

const STATUS_STYLES = {
  'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  'Assigned': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  'In Progress': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  'Completed': 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  'Resolved': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  'Rejected': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export default function DepartmentReports() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(searchParams.get('status') || '');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filter) params.status = filter;
      if (search) params.search = search;
      const res = await deptAPI.getReports(params);
      setReports(res.data.reports);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [page, filter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchReports();
  };

  const handleAction = async (action, id, data) => {
    try {
      if (action === 'accept') await deptAPI.acceptReport(id);
      else if (action === 'reject') {
        const note = prompt('Rejection reason:');
        if (!note) return;
        await deptAPI.rejectReport(id, { note });
      } else if (action === 'start') await deptAPI.startWorking(id);
      else if (action === 'complete') {
        const note = prompt('Completion note:');
        const formData = new FormData();
        if (note) formData.append('note', note);
        await deptAPI.markComplete(id, formData);
      }
      toast.success('Action completed');
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div>
      <PageHeader title="Department Reports" />

      <div className="flex flex-wrap gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="input-field max-w-[250px]" placeholder="Search reports..." />
          <button type="submit" className="btn-secondary px-3 py-2 text-sm">Search</button>
        </form>
        <select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}
          className="input-field max-w-[180px]">
          <option value="">All Status</option>
          {Object.keys(STATUS_STYLES).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : reports.length === 0 ? (
        <div className="card p-12 text-center text-gray-400"><ClipboardList className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" /><p>No reports found</p></div>
      ) : (
        <div className="space-y-3">
          {reports.map(report => (
            <div key={report._id} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[report.status] || 'bg-gray-100'}`}>{report.status}</span>
                    <span className="text-xs text-gray-400">{report.reportId}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{report.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{report.description}</p>
                  <div className="flex gap-3 mt-2 text-xs text-gray-400">
                    <span>{getCategoryLabel(report.category)}</span>
                    <span>{report.region}</span>
                    <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                    {report.submittedBy?.fullName && <span>By: {report.submittedBy.fullName}</span>}
                  </div>
                </div>
                <div className="flex-shrink-0 flex flex-col gap-2">
                  {report.status === 'Pending' && (
                    <>
                      <button onClick={() => handleAction('accept', report._id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600">Accept</button>
                      <button onClick={() => handleAction('reject', report._id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600">Reject</button>
                    </>
                  )}
                  {report.status === 'Assigned' && (
                    <button onClick={() => handleAction('start', report._id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600">Start Working</button>
                  )}
                  {report.status === 'In Progress' && (
                    <button onClick={() => handleAction('complete', report._id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-teal-500 text-white hover:bg-teal-600">Mark Complete</button>
                  )}
                </div>
              </div>
            </div>
          ))}
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
