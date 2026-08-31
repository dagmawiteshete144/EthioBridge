import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ClipboardCheck, MapPin, Paperclip,
  CalendarDays, Clock, TriangleAlert,
  Info, Building2, Star, X, Check, CircleCheck,
  Route, History, CircleX, ArrowUp, RefreshCw, ClipboardList,
  MessageSquareText,
} from 'lucide-react';
import { infraAPI } from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EthioMap from '../../components/map/EthioMap';
import ReportTimeline from '../../components/common/ReportTimeline';
import BeforeAfterGallery from '../../components/common/BeforeAfterGallery';
import { getCategoryLabel, getCategoryIcon } from '../../utils/categories';
import { resolveIcon } from '../../utils/iconMap.jsx';

const STAGES = [
  { key: 'Pending',             labelKey: 'tracking.stageSubmitted',     fallback: 'Report Submitted',     descKey: 'tracking.stageSubmittedDesc',     fallbackDesc: 'Your report was received by the system.' },
  { key: 'Under Review',        labelKey: 'tracking.stageReview',        fallback: 'Under Review',         descKey: 'tracking.stageReviewDesc',        fallbackDesc: 'Administrators are checking the reported issue.' },
  { key: 'Approved',            labelKey: 'tracking.stageApproved',      fallback: 'Approved',             descKey: 'tracking.stageApprovedDesc',      fallbackDesc: 'Your report was accepted and qualified for action.' },
  { key: 'Assigned',            labelKey: 'tracking.stageAssigned',      fallback: 'Assigned to Department', descKey: 'tracking.stageAssignedDesc',    fallbackDesc: 'A responsible department has been assigned.' },
  { key: 'In Progress',         labelKey: 'tracking.stageWorkStarted',   fallback: 'Work Started',         descKey: 'tracking.stageWorkStartedDesc',   fallbackDesc: 'Repair or action work is currently underway.' },
  { key: 'Completed',           labelKey: 'tracking.stageWorkCompleted', fallback: 'Work Completed',       descKey: 'tracking.stageWorkCompletedDesc', fallbackDesc: 'The required work has been finished.' },
  { key: 'Citizen Verification', labelKey: 'tracking.stageVerification', fallback: 'Citizen Verification', descKey: 'tracking.stageVerificationDesc', fallbackDesc: 'Waiting for your confirmation of the outcome.' },
  { key: 'Resolved',            labelKey: 'tracking.stageResolved',      fallback: 'Resolved',             descKey: 'tracking.stageResolvedDesc',      fallbackDesc: 'This report has been closed and resolved.' },
];

const ACTION_TO_STAGE = {
  created: 'Pending',
  approved: 'Approved',
  assigned: 'Assigned',
  work_started: 'In Progress',
  work_completed: 'Completed',
  citizen_verified: 'Citizen Verification',
  resolved: 'Resolved',
};

const fmt = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleString();
};

const statusStageIndex = (status) => {
  const i = STAGES.findIndex((s) => s.key === status);
  if (i !== -1) return i;
  if (status === 'Closed' || status === 'Cancelled') return STAGES.length - 1;
  return -1;
};

export default function TrackReport() {
  const { t } = useTranslation();
  const [reportId, setReportId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validation, setValidation] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    const value = reportId.trim();
    if (!value) {
      setValidation(t('tracking.enterId', 'Please enter your Report ID to continue.'));
      return;
    }
    setValidation('');
    setLoading(true);
    setError('');
    setReport(null);
    try {
      const r = await infraAPI.track(value.toUpperCase());
      setReport(r.data.report);
    } catch (err) {
      setError(err.response?.data?.message || t('tracking.notFound', 'Report not found. Please check the Report ID and try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setReportId('');
    setReport(null);
    setError('');
    setValidation('');
  };

  const markers = report?.latitude && report?.longitude
    ? [{ latitude: report.latitude, longitude: report.longitude, title: report.title, type: 'infrastructure', status: report.status }]
    : [];

  const stageDates = {};
  (report?.timeline || []).forEach((ev) => {
    const stageKey = ACTION_TO_STAGE[ev.action];
    const fallbackKey = ev.newStatus ? STAGES.find((s) => s.key === ev.newStatus)?.key : null;
    const target = stageKey || fallbackKey;
    if (!target) return;
    const ts = ev.createdAt || ev.updatedAt;
    if (ts && (!stageDates[target] || new Date(ts) < new Date(stageDates[target]))) {
      stageDates[target] = ts;
    }
  });

  const showEmpty = !loading && !error && !report;

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      {/* Modern header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 text-white">
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 bg-primary-400/20 rounded-full blur-3xl" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3.5 py-1.5 text-xs font-semibold tracking-wide uppercase">
              <ClipboardCheck className="text-amber-300 w-3.5 h-3.5" strokeWidth={2} />
              {t('tracking.typeInfrastructure', 'Infrastructure Report')}
            </span>
            <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight">
              {t('tracking.title', 'Track Your Report')}
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-primary-100 text-sm sm:text-base">
              {t('tracking.desc', 'Enter your Report ID to check the current status, progress, and resolution of your infrastructure report in real time.')}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 -mt-10 relative z-10">
        {/* Search card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.1 }}>
          <div className="card !p-5 sm:!p-6 shadow-xl shadow-gray-200/60 dark:shadow-black/30">
            <form onSubmit={handleSearch}>
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" strokeWidth={2} />
                  <input
                    type="text"
                    value={reportId}
                    onChange={(e) => setReportId(e.target.value)}
                    placeholder={t('tracking.placeholder', 'Enter Report ID (e.g., IR-2026-0001)')}
                    className="input-field pl-11 text-base font-mono tracking-wider uppercase"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:shrink-0">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary px-8 inline-flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t('common.searching', 'Searching...')}
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" strokeWidth={2} />
                        {t('common.track', 'Track')}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={loading}
                    className="btn-secondary px-6 inline-flex items-center justify-center gap-2"
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={2} />
                    {t('common.clear', 'Clear')}
                  </button>
                </div>
              </div>
            </form>
            {validation ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-1.5"
              >
                <TriangleAlert className="w-3.5 h-3.5" strokeWidth={2} /> {validation}
              </motion.p>
            ) : (
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <Info className="text-primary-500 shrink-0 w-3.5 h-3.5" strokeWidth={2} />
                {t('tracking.idHint', 'Your Report ID was shared after submission — check your confirmation message or receipt.')}
              </p>
            )}
          </div>
        </motion.div>

        {/* Loading skeleton */}
        {loading && <LoadingState t={t} />}

        {/* Empty state */}
        <AnimatePresence>
          {showEmpty && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="card mt-8 text-center py-14 px-6"
            >
              <div className="mx-auto w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 flex items-center justify-center text-3xl">
                <ClipboardCheck className="text-primary-600 dark:text-primary-400 w-8 h-8" strokeWidth={2} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-gray-100">
                {t('tracking.emptyTitle', 'Nothing to track yet')}
              </h3>
              <p className="mt-1 max-w-md mx-auto text-sm text-gray-500 dark:text-gray-400">
                {t('tracking.emptyDesc', 'Enter your Report ID above to see the live status, progress, and location of your infrastructure report.')}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error state */}
        <AnimatePresence>
          {error && !loading && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="card mt-8 text-center py-12 px-6"
            >
              <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 flex items-center justify-center text-3xl">
                <TriangleAlert className="text-red-500 dark:text-red-400 w-8 h-8" strokeWidth={2} />
              </div>
              <p className="mt-4 text-gray-700 dark:text-gray-300 font-medium">{error}</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {t('tracking.noMatch', 'Check the Report ID and try again.')}
              </p>
              <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button type="button" onClick={handleClear} className="btn-secondary py-2 px-6 text-sm">
                  {t('common.clear', 'Clear')}
                </button>
                <Link to="/report/infrastructure" className="btn-primary py-2 px-6 text-sm inline-block">
                  {t('tracking.submitNew', 'Submit a New Report')}
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        {report && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="space-y-6 mt-8"
          >
            {/* Success pill */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex justify-center"
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-1.5 text-sm font-semibold text-green-700 dark:text-green-300">
                <CircleCheck className="w-3.5 h-3.5" strokeWidth={2} /> {t('tracking.reportFound', 'Report found')}
              </span>
            </motion.div>

            {/* Status card */}
            <div className="card overflow-hidden transition-shadow duration-200 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/20">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 flex items-center justify-center text-2xl shrink-0">
                    <CategoryIcon category={report.category} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2.5 py-1 rounded-md">
                        {report.reportId}
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {t('tracking.typeInfrastructure', 'Infrastructure Report')}
                      </span>
                    </div>
                    <h2 className="mt-2 text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 break-words">
                      {report.title}
                    </h2>
                  </div>
                </div>
                <div className="shrink-0">
                  <StatusBadge status={report.status} />
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-5">
                <InfoItem icon={Building2} label={t('common.category', 'Category')} value={getCategoryLabel(report.category)} />
                <InfoItem
                  icon={MapPin}
                  label={t('common.location', 'Location')}
                  value={report.specificLocation || report.subcity || report.woredaName || report.woreda || report.city}
                />
                <InfoItem icon={CalendarDays} label={t('tracking.submittedOn', 'Submitted on')} value={fmt(report.submittedAt || report.createdAt)} />
                <InfoItem
                  icon={Building2}
                  label={t('tracking.department', 'Assigned Department')}
                  value={report.assignedDepartment || report.autoAssignedOrganization}
                />
                <InfoItem
                  icon={Clock}
                  label={t('tracking.lastUpdated', 'Last updated')}
                  value={fmt(report.lastUpdated || report.submittedAt || report.createdAt)}
                />
                {report.submittedByName && (
                  <InfoItem icon={Star} label={t('tracking.submittedBy', 'Submitted by')} value={report.submittedByName} />
                )}
              </div>
            </div>

            {/* Progress timeline */}
            <div className="card transition-shadow duration-200 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/20">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
                <div className="flex items-center gap-2">
                  <Route className="text-primary-600 dark:text-primary-400 w-4 h-4" strokeWidth={2} />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {t('tracking.progress', 'Report Progress')}
                  </h3>
                </div>
                <StatusBadge status={report.status} />
              </div>
              <ProgressStages status={report.status} stageDates={stageDates} t={t} />
            </div>

            {/* Details */}
            <div className="card transition-shadow duration-200 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/20">
              <div className="flex items-center gap-2 mb-4">
                <Info className="text-primary-600 dark:text-primary-400 w-3.5 h-3.5" strokeWidth={2} />
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {t('tracking.details', 'Report Details')}
                </h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-4">
                <Detail label={t('common.category', 'Category')} value={getCategoryLabel(report.category)} />
                <Detail label={t('common.severity', 'Severity')} value={report.severityLevel} />
                <Detail label={t('common.region', 'Region')} value={report.region} />
                {report.zone && <Detail label={t('dashboard.zone', 'Zone')} value={report.zone} />}
                {(report.woredaName || report.woreda) && (
                  <Detail label={t('tracking.woreda', 'Woreda')} value={report.woredaName || report.woreda} />
                )}
                {report.subcity && <Detail label={t('tracking.subcity', 'Sub-city')} value={report.subcity} />}
                {report.kebele && <Detail label={t('dashboard.kebele', 'Kebele')} value={report.kebele} />}
                {report.city && <Detail label={t('common.city', 'City')} value={report.city} />}
                {report.specificLocation && <Detail label={t('common.location', 'Location')} value={report.specificLocation} />}
                {report.address && <Detail label={t('dashboard.address', 'Address')} value={report.address} />}
                {report.incidentDate && (
                  <Detail label={t('dashboard.incidentDate', 'Incident Date')} value={fmt(report.incidentDate)} />
                )}
                <Detail label={t('tracking.submittedOn', 'Submitted on')} value={fmt(report.submittedAt || report.createdAt)} />
                {report.assignedToName && <Detail label={t('tracking.assignedTo', 'Assigned to')} value={report.assignedToName} />}
                {report.assignedDepartment && (
                  <Detail label={t('tracking.department', 'Department')} value={report.assignedDepartment} />
                )}
                {report.autoAssignedOrganization && (
                  <Detail label={t('common.responsibleOrg', 'Responsible Organization')} value={report.autoAssignedOrganization} />
                )}
                {report.resolvedAt && (
                  <Detail label={t('dashboard.resolvedAt', 'Resolved At')} value={fmt(report.resolvedAt)} />
                )}
              </div>
              {report.description && (
                <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('common.description', 'Description')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{report.description}</p>
                </div>
              )}
            </div>

            {/* Attachments */}
            <AttachmentsCard report={report} t={t} />

            {/* Map */}
            {markers.length > 0 && (
              <div className="card transition-shadow duration-200 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/20">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="text-primary-600 dark:text-primary-400 w-3.5 h-3.5" strokeWidth={2} />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {t('tracking.locationOnMap', 'Location on Map')}
                  </h3>
                </div>
                {(report.specificLocation || report.address) && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    {report.specificLocation || report.address}
                  </p>
                )}
                <EthioMap markers={markers} center={[report.latitude, report.longitude]} zoom={13} height="300px" />
              </div>
            )}

            {/* Activity timeline */}
            {report.timeline?.length > 0 && (
              <div className="card transition-shadow duration-200 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/20">
                <div className="flex items-center gap-2 mb-4">
                  <History className="text-primary-600 dark:text-primary-400 w-3.5 h-3.5" strokeWidth={2} />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {t('tracking.activityTimeline', 'Activity Timeline')}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2 mb-4">
                  {t('tracking.activityDesc', 'Every update on your report, in order.')}
                </p>
                <ReportTimeline timeline={report.timeline} showTitle={false} />
              </div>
            )}

            {/* Messages from officials */}
            {report.comments?.length > 0 && (
              <div className="card transition-shadow duration-200 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/20">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquareText className="text-primary-600 dark:text-primary-400 w-3.5 h-3.5" strokeWidth={2} />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {t('tracking.messages', 'Messages')}
                  </h3>
                </div>
                <div className="space-y-3">
                  {report.comments.map((c, i) => (
                    <div key={i} className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-3">
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

            {/* Rating */}
            {report.rating && (
              <div className="card text-center">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t('tracking.citizenRating', 'Citizen Rating')}
                </p>
                <div className="flex justify-center gap-1 text-2xl">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className={s <= report.rating ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'}>★</span>
                  ))}
                </div>
                {report.feedback && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">"{report.feedback}"</p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function CategoryIcon({ category }) {
  const Icon = resolveIcon(getCategoryIcon(category)) || ClipboardList;
  return <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" strokeWidth={2} />;
}

function InfoItem({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
        <Icon className="text-primary-500 dark:text-primary-400 shrink-0 w-3.5 h-3.5" strokeWidth={2} /> {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-200 truncate" title={value}>{value}</p>
    </div>
  );
}

function ProgressStages({ status, stageDates, t }) {
  const index = statusStageIndex(status);

  if (status === 'Rejected' || status === 'Reopened' || status === 'Escalated' || status === 'Upgraded') {
    const config =
      status === 'Rejected'
        ? { icon: CircleX, title: t('tracking.rejectionTitle', 'Report Rejected'), desc: t('tracking.rejectionDesc', 'This report could not be approved. If you believe this is a mistake, please reach out to the support team.'), cls: 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20', titleCls: 'text-red-700 dark:text-red-300' }
        : status === 'Reopened'
        ? { icon: RefreshCw, title: t('tracking.reopenedTitle', 'Report Reopened'), desc: t('tracking.reopenedDesc', 'This report was reopened for further action and will be worked on again.'), cls: 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/20', titleCls: 'text-amber-700 dark:text-amber-300' }
        : { icon: ArrowUp, title: t('tracking.escalatedTitle', 'Report Escalated'), desc: t('tracking.escalatedDesc', 'This report was escalated to a higher level for further action.'), cls: 'border-purple-200 bg-purple-50 dark:border-purple-900/50 dark:bg-purple-900/20', titleCls: 'text-purple-700 dark:text-purple-300' };

    const Icon = config.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-start gap-4 rounded-xl border p-4 ${config.cls}`}
      >
        <span className="text-2xl"><Icon className="w-6 h-6" strokeWidth={2} /></span>
        <div>
          <p className={`text-sm font-bold ${config.titleCls}`}>{config.title}</p>
          <p className="text-xs mt-0.5 text-gray-600 dark:text-gray-400">{config.desc}</p>
        </div>
      </motion.div>
    );
  }

  const pct = index < 0 ? 0 : Math.round((index / (STAGES.length - 1)) * 100);
  const finished = index >= STAGES.length - 1;

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${finished ? 'bg-green-500' : 'bg-gradient-to-r from-primary-500 to-primary-600'}`}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
        </div>
        <span className="text-xs font-bold text-primary-600 dark:text-primary-400 shrink-0">{pct}%</span>
      </div>

      <ol className="mt-7 relative">
        {STAGES.map((stage, i) => {
          const completed = index >= 0 && i <= index;
          const current = i === index;
          const reached = stageDates[stage.key];
          return (
            <li key={stage.key} className="relative flex gap-4 pb-8 last:pb-0">
              {i < STAGES.length - 1 && (
                <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 overflow-hidden rounded-full">
                  <motion.div
                    className="absolute inset-0 bg-green-500 origin-top"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: completed && !current ? 1 : 0 }}
                    transition={{ duration: 0.5, delay: 0.25 }}
                  />
                </div>
              )}
              <div className="relative z-10 shrink-0">
                <motion.div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 shadow-sm ${
                    completed && !current
                      ? 'bg-green-500 border-green-500 text-white'
                      : current
                      ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-600/30'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-400'
                  }`}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.08 }}
                >
                  {completed && !current ? (
                    <Check className="w-4 h-4" strokeWidth={2} />
                  ) : current ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    i + 1
                  )}
                </motion.div>
                {current && (
                  <motion.span
                    className="absolute -inset-1 rounded-full border-2 border-primary-500 dark:border-primary-400"
                    animate={{ scale: [1, 1.35], opacity: [0.6, 0] }}
                    transition={{ repeat: Infinity, duration: 1.6, ease: 'easeOut' }}
                  />
                )}
              </div>
              <div className="min-w-0 pt-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`text-sm font-semibold ${
                    current
                      ? 'text-primary-700 dark:text-primary-400'
                      : completed
                      ? 'text-gray-900 dark:text-gray-100'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {t(stage.labelKey, stage.fallback)}
                  </p>
                  {reached && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                      {t('tracking.reachedOn', 'Reached on')} {fmt(reached)}
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-0.5 ${
                  current ? 'text-gray-600 dark:text-gray-400' : completed ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {t(stage.descKey, stage.fallbackDesc)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function AttachmentsCard({ report, t }) {
  const hasMedia =
    report.photos?.length || report.videos?.length || report.afterPhotos?.length || report.afterVideos?.length;
  if (!hasMedia) return null;
  return (
    <div className="card transition-shadow duration-200 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/20">
      <div className="flex items-center gap-2 mb-1">
        <Paperclip className="text-primary-600 dark:text-primary-400 w-3.5 h-3.5" strokeWidth={2} />
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
          {t('tracking.attachments', 'Attachments')}
        </h3>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        {t('tracking.attachmentsDesc', 'Photos and videos attached to this report.')}
      </p>
      <BeforeAfterGallery report={report} />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="mt-8 space-y-6">
      <div className="card">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-28 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-7 w-20 rounded-full bg-gray-100 dark:bg-gray-700 animate-pulse" />
        </div>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-5 border-t border-gray-100 dark:border-gray-700">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-28 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
      <div className="card space-y-5">
        <div className="h-3 w-32 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-gray-800 dark:text-gray-200 mt-0.5 break-words">{value}</p>
    </div>
  );
}
