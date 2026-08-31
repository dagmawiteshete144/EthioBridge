import { useState, useEffect, useMemo } from 'react';
import { Send, CircleCheck, ChevronUp, ChevronDown, Construction, Inbox, Megaphone } from 'lucide-react';
import PageHeader from '../../../components/common/PageHeader';
import { useTranslation } from 'react-i18next';
import { infraAPI, complaintReportAPI, feedbackAPI, locationAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import StatusBadge from '../../../components/common/StatusBadge';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import EmptyState from '../../../components/common/EmptyState';
import Pagination from '../../../components/common/Pagination';
import ReportTimeline from '../../../components/common/ReportTimeline';
import ImageLightbox from '../../../components/common/ImageLightbox';
import StarRating from '../../../components/common/StarRating';
import { toast } from 'react-toastify';

const STATUS_OPTIONS = [
  { v: 'Pending', l: 'dashboard.statusPending' },
  { v: 'Submitted', l: 'dashboard.statusPending' },
  { v: 'Under Review', l: 'dashboard.statusUnderReview' },
  { v: 'In Progress', l: 'dashboard.statusInProgress' },
  { v: 'Active', l: 'dashboard.statusActive' },
  { v: 'Resolved', l: 'dashboard.statusResolved' },
  { v: 'Rejected', l: 'dashboard.statusRejected' },
];

const PAGE_SIZE = 8;

// All infrastructure report categories defined in the system (report `category`
// is constrained to this enum on the model, so these are the only possible
// infrastructure categories — not a hard-coded subset of a few reports).
const INFRA_CATEGORIES = [
  { value: 'road_issue',         label: 'Road Issue' },
  { value: 'electricity_issue',  label: 'Electricity Issue' },
  { value: 'water_supply_issue', label: 'Water Supply Issue' },
];

const categoryOf = (r) => r.category || r.department || null;

// Reports store subcity values inconsistently ("Bole", "BOLE", "Lemmi Kura",
// "LEMMI_KURA"…). Normalize both sides of the filter so they always match.
const normSubcity = (v) => String(v || '').trim().toUpperCase().replace(/\s+/g, '_');

export default function MyReports() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [feedback, setFeedback] = useState({});

  // Raw data per type (kept whole so client-side filters can be applied).
  const [allInfra, setAllInfra] = useState([]);
  const [allComplaint, setAllComplaint] = useState([]);

  // System-wide lookup lists used to build the filter dropdowns dynamically.
  const [subcityOptions, setSubcityOptions] = useState([]);
  const [woredaOptions, setWoredaOptions] = useState([]);
  const [deptOptions, setDeptOptions] = useState([]);

  const [filters, setFilters] = useState({
    status: '',
    search: '',
    category: '',
    subcity: '',
    woreda: '',
    dateFrom: '',
    dateTo: '',
  });

  const TABS = [
    { key: 'all',            label: t('myReports.allReports'), icon: null },
    { key: 'infrastructure', label: t('myReports.infrastructureReports', 'Infrastructure Reports'), icon: Construction },
    { key: 'complaint',      label: t('myReports.publicComplaints', 'Public Complaint'), icon: Megaphone },
  ];

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = { status: filters.status || undefined, page: 1, limit: 50 };
      const fetches = [];
      if (tab === 'all' || tab === 'infrastructure') {
        fetches.push(infraAPI.getMy(params).then(r => setAllInfra(r.data.reports.map(x => ({ ...x, _type: 'Infrastructure' })))));
      }
      if (tab === 'all' || tab === 'complaint') {
        fetches.push(complaintReportAPI.getMy(params).then(r => setAllComplaint((r.data.data?.complaints || []).map(x => ({ ...x, _type: 'Complaint' })))));
      }
      await Promise.all(fetches);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [tab]);

  // Load every Subcity, Woreda and complaint department currently in the system
  // so the filters always offer the full dynamic list, not just values found in
  // the user's own reports.
  useEffect(() => {
    let cancelled = false;
    locationAPI.getSubcities()
      .then(res => { if (!cancelled) setSubcityOptions(res.data?.subcities || []); })
      .catch(() => {});
    locationAPI.getWoredas()
      .then(res => { if (!cancelled) setWoredaOptions(res.data?.woredas || []); })
      .catch(() => {});
    Promise.all([locationAPI.getDepartments(), locationAPI.getPublicComplaintDepartments()])
      .then(([r1, r2]) => {
        if (cancelled) return;
        const merged = new Map();
        [...(r1.data?.departments || []), ...(r2.data?.departments || [])].forEach(d => {
          const name = d.departmentName || d.name;
          if (name) merged.set(name, d);
        });
        setDeptOptions([...merged.values()]);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const combined = useMemo(() => {
    const pool = [...allInfra, ...allComplaint];
    return pool.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [allInfra, allComplaint]);

  // Data-driven filter option lists — full system lists merged with any values
  // present only in the user's own reports (legacy/edge values still appear).
  const options = useMemo(() => {
    const categories = new Map();
    const subcityMap = new Map();
    const woredas = new Set();

    // System-defined categories: every infrastructure category plus every
    // complaint department configured in the system.
    INFRA_CATEGORIES.forEach(c => categories.set(c.value, { value: c.value, label: c.label }));
    deptOptions.forEach(d => {
      const name = d.departmentName || d.name;
      if (name) categories.set(name, { value: name, label: name });
    });

    // System subcities / woredas (dedupe subcity by normalized value so the
    // display name wins over the underscored uppercase value stored on reports).
    const addSubcity = (name) => {
      if (!name) return;
      const key = normSubcity(name);
      if (!subcityMap.has(key)) subcityMap.set(key, name);
    };
    subcityOptions.forEach(s => addSubcity(s.name));
    woredaOptions.forEach(w => {
      const name = w.woredaName || w.name;
      if (name) woredas.add(name);
    });

    // Values found in the user's own reports (kept as a fallback).
    combined.forEach(r => {
      const cat = r.category || r.department || r.issueType;
      if (cat) categories.set(cat, { value: cat, label: String(cat).replace(/_/g, ' ') });
      addSubcity(r.subcity);
      const w = r.woredaName || r.woreda;
      if (w) woredas.add(w);
    });

    return {
      categories: [...categories.values()].sort((a, b) => a.label.localeCompare(b.label)),
      subcities: [...subcityMap.values()].sort((a, b) => normSubcity(a).localeCompare(normSubcity(b))),
      woredas: [...woredas].sort((a, b) => a.localeCompare(b)),
    };
  }, [combined, subcityOptions, woredaOptions, deptOptions]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const sub = filters.subcity ? normSubcity(filters.subcity) : '';
    const woreda = filters.woreda ? filters.woreda.trim().toLowerCase() : '';
    return combined.filter(r => {
      // Type separation: each tab shows only its own report type.
      if (tab === 'infrastructure' && r._type !== 'Infrastructure') return false;
      if (tab === 'complaint' && r._type !== 'Complaint') return false;
      if (filters.status && r.status !== filters.status) return false;
      if (filters.category && (r.category || r.department || r.issueType) !== filters.category) return false;
      if (sub && normSubcity(r.subcity) !== sub) return false;
      const w = r.woredaName || r.woreda;
      if (woreda && (w || '').trim().toLowerCase() !== woreda) return false;
      if (filters.dateFrom && new Date(r.createdAt) < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && new Date(r.createdAt) > new Date(filters.dateTo)) return false;
      if (q) {
        const hay = `${r.title || ''} ${r.reportId || ''} ${r.description || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [combined, filters, tab]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const view = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const setFilter = (key, value) => { setFilters(p => ({ ...p, [key]: value })); setPage(1); };

  const setReportFeedback = (id, patch) => setFeedback(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const submitFeedback = async (r) => {
    const entry = feedback[r._id] || {};
    const rating = entry.rating || 0;
    const text = (entry.text || '').trim();
    if (rating === 0 && !text) {
      toast.error(t('myReports.feedbackRequired') || 'Please rate your experience or write feedback');
      return;
    }
    setReportFeedback(r._id, { sending: true });
    const recipient = user?.woredaName ? 'woreda' : 'subcity';
    const body = [
      r.reportId || r._id ? `Report #${r.reportId || r._id.slice(-6)}` : '',
      rating ? `${rating}/5` : '',
      text,
    ].filter(Boolean).join(' — ');
    try {
      await feedbackAPI.create({ recipient, department: categoryOf(r) || undefined, text: body });
      setReportFeedback(r._id, { sent: true, sending: false, rating, text });
      toast.success(t('myReports.feedbackSent') || 'Feedback sent');
    } catch (err) {
      setReportFeedback(r._id, { sending: false });
      toast.error(err.response?.data?.message || t('myReports.feedbackFailed') || 'Failed to send feedback');
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title={t('myReports.title')} subtitle={`${filtered.length} report${filtered.length === 1 ? '' : 's'}`}>
        <select value={filters.status} onChange={e => setFilter('status', e.target.value)} className="input-field w-auto text-sm">
          <option value="">{t('common.allStatuses')}</option>
          {STATUS_OPTIONS.map(s => <option key={s.v} value={s.v}>{t(s.l)}</option>)}
        </select>
      </PageHeader>

      <div className="flex gap-2 flex-wrap">
        {TABS.map(tabItem => (
          <button key={tabItem.key} onClick={() => { setTab(tabItem.key); setPage(1); setFilters(p => ({ ...p, search: '', category: '', subcity: '', woreda: '', dateFrom: '', dateTo: '' })); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === tabItem.key ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
            {tabItem.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-3">
          <input
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
            placeholder={t('myReports.searchPlaceholder')}
            className="input-field w-auto min-w-[180px] text-sm"
          />
          <select value={filters.category} onChange={e => setFilter('category', e.target.value)} className="input-field w-auto text-sm">
            <option value="">{t('myReports.allCategories')}</option>
            {options.categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={filters.subcity} onChange={e => setFilter('subcity', e.target.value)} className="input-field w-auto text-sm">
            <option value="">{t('myReports.allSubcities')}</option>
            {options.subcities.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filters.woreda} onChange={e => setFilter('woreda', e.target.value)} className="input-field w-auto text-sm">
            <option value="">{t('myReports.allWoredas')}</option>
            {options.woredas.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={e => setFilter('dateFrom', e.target.value)}
            className="input-field w-auto text-sm"
            title={t('myReports.dateFrom')}
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={e => setFilter('dateTo', e.target.value)}
            className="input-field w-auto text-sm"
            title={t('myReports.dateTo')}
          />
          {(filters.search || filters.category || filters.subcity || filters.woreda || filters.dateFrom || filters.dateTo) && (
            <button
              onClick={() => setFilters({ status: filters.status, search: '', category: '', subcity: '', woreda: '', dateFrom: '', dateTo: '' })}
              className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              {t('common.clearFilters') || 'Clear filters'}
            </button>
          )}
        </div>
      </div>

      {loading ? <LoadingSpinner /> : view.length === 0 ? (
        <EmptyState icon={Inbox} title={t('myReports.noReports')} description={t('myReports.noReportsDesc')} />
      ) : (
        <div className="space-y-3">
          {view.map(r => {
            const location = [r.subcity, r.woredaName || r.woreda].filter(Boolean).join(' - ') || r.region;
            const typeStyle = r._type === 'Infrastructure' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
              : r._type === 'Complaint' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
              : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
            return (
              <div key={r._id} className="card p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={() => setExpanded(expanded === r._id ? null : r._id)}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeStyle}`}>{r._type}</span>
                      <span className="text-xs text-gray-400">{r.reportId}</span>
                      {r.category && <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{String(r.category).replace(/_/g, ' ')}</span>}
                    </div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100 mt-1">{r.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{location} · {new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={r.status} />
                    <span className="text-gray-400 text-xs">{expanded === r._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</span>
                  </div>
                </div>

                {expanded === r._id && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{r.description}</p>
                    {r._type === 'Infrastructure' && r.timeline?.length > 0 && (
                      <ReportTimeline timeline={r.timeline} />
                    )}
                    {r._type === 'Complaint' && r.timeline?.length > 0 ? (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">{t('common.progressHistory')}</p>
                        <div className="space-y-2">
                          {r.timeline.map((h, i) => (
                            <div key={i} className="flex gap-2 text-xs">
                              <span className={`w-2 h-2 rounded-full mt-1 shrink-0 bg-teal-400`} />
                              <div>
                                <span className="font-medium text-gray-700 dark:text-gray-200">{h.status}</span>
                                {h.note && <span className="text-gray-500 dark:text-gray-400"> — {h.note}</span>}
                                <p className="text-gray-400 dark:text-gray-500">{new Date(h.updatedAt).toLocaleString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {r.photos?.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {r.photos.map((p, i) => (
                          <img key={i} src={p} alt="" className="h-20 w-auto rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={(e) => { e.stopPropagation(); setLightbox({ images: r.photos, videos: r.videos || [], index: i }); }} />
                        ))}
                      </div>
                    )}

                    {/* Messages from officials / woreda */}
                    {r.comments?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                          {t('common.messages', 'Messages')} ({r.comments.length})
                        </p>
                        <div className="space-y-2">
                          {r.comments.map((c, i) => (
                            <div key={c._id || i} className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-3">
                              <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{c.authorName || 'Official'}</span>
                                <span className="text-xs text-gray-400">{c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{c.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Report feedback for resolved reports */}
                    {r.status === 'Resolved' && (
                      <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50/60 dark:bg-green-900/10 p-4">
                        {feedback[r._id]?.sent ? (
                          <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                            <CircleCheck className="w-4 h-4 inline-block text-green-600" /> {t('myReports.feedbackThanks') || 'Thank you for your feedback!'}
                          </p>
                        ) : (
                          <>
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                              {t('myReports.feedbackQuestion') || 'Was this issue resolved successfully?'}
                            </p>
                            <div className="mt-2">
                              <StarRating rating={feedback[r._id]?.rating || 0} onRate={v => setReportFeedback(r._id, { rating: v })} size="md" />
                            </div>
                            <textarea
                              rows={3}
                              value={feedback[r._id]?.text || ''}
                              onChange={e => setReportFeedback(r._id, { text: e.target.value })}
                              placeholder={t('myReports.feedbackPlaceholder') || 'Write your feedback...'}
                              className="input-field w-full mt-3"
                            />
                            <button
                              type="button"
                              onClick={() => submitFeedback(r)}
                              disabled={feedback[r._id]?.sending}
                              className="btn-primary inline-flex items-center gap-2 mt-3 text-sm py-2.5 disabled:opacity-50"
                            >
                              <Send size={16} />
                              {feedback[r._id]?.sending
                                ? (t('myReports.feedbackSending') || 'Sending...')
                                : (t('myReports.feedbackSubmit') || 'Submit Feedback')}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <Pagination page={page} pages={pages} onPageChange={setPage} />

      {lightbox && (
        <ImageLightbox images={lightbox.images} videos={lightbox.videos} startIndex={lightbox.index} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}
