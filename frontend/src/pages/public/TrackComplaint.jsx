import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { complaintReportAPI, infraAPI, publicAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import EthioMap from '../../components/map/EthioMap';
import { MessageSquareText } from 'lucide-react';

const STATUS_ORDER = ['Submitted', 'Pending', 'Under Review', 'Assigned', 'In Progress', 'Upgraded', 'Escalated', 'Citizen Verification', 'Resolved'];

const STATUS_STYLE = {
  Resolved: 'border-l-green-500 bg-green-50 dark:bg-green-900/10',
  'In Progress': 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10',
  Upgraded: 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/10',
  Escalated: 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/10',
  Rejected: 'border-l-red-500 bg-red-50 dark:bg-red-900/10',
  default: 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10',
};

function normalizeTimeline(data, kind) {
  const events = Array.isArray(data.timeline) ? data.timeline : [];
  if (events.length > 0) return events;

  const fallback = [];
  if (data.status) {
    fallback.push({
      title: 'Submitted',
      description: 'Submission received and routed for review.',
      date: data.submittedAt || data.createdAt,
    });
    if (data.upgrade?.upgraded) {
      fallback.push({
        title: 'Upgraded / Escalated',
        description: data.upgrade.reason || `Transferred to ${data.upgrade.transferredTo || 'a higher level'}.`,
        date: data.upgrade.date,
      });
    }
    if (data.resolution?.resolved) {
      fallback.push({
        title: 'Resolved',
        description: data.resolution.resolutionNotes || 'Marked as resolved.',
        date: data.resolution.resolvedAt,
      });
    }
  }
  return fallback;
}

export default function TrackComplaint() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingPin, setTrackingPin] = useState('');
  const [data, setData] = useState(null);
  const [kind, setKind] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoSubmitted, setAutoSubmitted] = useState(false);

  useEffect(() => {
    const number = searchParams.get('number');
    const pin = searchParams.get('pin');
    if (number && pin && !autoSubmitted) {
      setTrackingNumber(number);
      setTrackingPin(pin);
      setAutoSubmitted(true);
      handleSearchFromParams(number, pin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSearchFromParams = async (number, pin) => {
    setLoading(true);
    setError('');
    setData(null);
    try {
      const res = await complaintReportAPI.track({ trackingNumber: number, trackingPin: pin });
      setData(res.data.data);
      setKind(res.data.kind);
    } catch (err) {
      if (err.response?.status === 404) {
        try {
          const r = await infraAPI.trackGuest({ trackingNumber: number, trackingPin: pin });
          setData(r.data.report);
          setKind('infrastructure');
        } catch (err2) {
          setError(err2.response?.data?.message || t('tracking.notFound', 'No record matches the provided tracking number and PIN.'));
        }
      } else {
        setError(err.response?.data?.message || 'Failed to look up this tracking number.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!trackingNumber.trim() || !trackingPin.trim()) {
      setError(t('tracking.enterBoth', 'Enter both the tracking number and the PIN.'));
      return;
    }
    await handleSearchFromParams(trackingNumber.trim().toUpperCase(), trackingPin.trim());
  };

  const markers = data?.latitude && data?.longitude
    ? [{ latitude: Number(data.latitude), longitude: Number(data.longitude), title: data.title, type: kind === 'infrastructure' ? 'infrastructure' : 'publicComplaint', status: data.status }]
    : [];

  const timeline = data ? normalizeTimeline(data, kind) : [];
  const receiptUrl = publicAPI.getReceiptUrl(trackingNumber, trackingPin);
  const statusIndex = STATUS_ORDER.indexOf(data?.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t('tracking.title', 'Track Your Report')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {t('tracking.desc', 'Enter your Tracking Number and PIN to check the current status, timeline, and resolution of your submission.')}
        </p>
      </div>

      <form onSubmit={handleSearch} className="max-w-lg mx-auto mb-4">
        <div className="flex gap-3 flex-col sm:flex-row">
          <input
            type="text"
            value={trackingNumber}
            onChange={e => setTrackingNumber(e.target.value)}
            placeholder={t('tracking.numberPlaceholder', 'Tracking Number (e.g., ADB-20260804-482931)')}
            className="input-field flex-1 text-center font-mono text-sm tracking-wider"
          />
          <input
            type="text"
            value={trackingPin}
            onChange={e => setTrackingPin(e.target.value.replace(/\D/g, ''))}
            maxLength={6}
            placeholder={t('tracking.pinPlaceholder', '6-digit PIN')}
            className="input-field w-full sm:w-36 text-center font-mono text-sm tracking-widest"
          />
        </div>
        <button type="submit" disabled={loading || !trackingNumber.trim() || !trackingPin.trim()} className="btn-primary w-full mt-3">
          {loading ? t('common.searching', 'Searching...') : t('common.search', 'Track')}
        </button>
      </form>
      <p className="text-center text-xs text-gray-400 dark:text-gray-500 mb-6">
        {t('tracking.pinHint', 'The 6-digit PIN was shown when you submitted and on your receipt.')}
      </p>

      {loading && <LoadingSpinner />}

      {error && (
        <div className="card text-center py-10">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            {t('tracking.noMatch', 'Remember that both the Tracking Number and the 6-digit PIN are required.')}
          </p>
          <Link to="/report/public-complaint" className="btn-primary py-2 px-6 text-sm">
            {t('tracking.submitNew', 'Submit a New Report')}
          </Link>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Status Banner */}
          <div className={`card border-l-4 ${STATUS_STYLE[data.status] || STATUS_STYLE.default}`}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{data.trackingNumber}</p>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-1">{data.title}</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {kind === 'infrastructure' ? t('tracking.typeInfrastructure', 'Infrastructure Report') : t('tracking.typeComplaint', 'Complaint')}
                  {data.category ? ` · ${data.category}` : ''}
                </p>
              </div>
              <StatusBadge status={data.status} />
            </div>
          </div>

          {/* Progress bar */}
          {statusIndex >= 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                {t('tracking.progress', 'Report Progress')}
              </h3>
              <div className="flex items-center overflow-x-auto pb-2">
                {STATUS_ORDER.map((s, i) => {
                  const isCompleted = i <= statusIndex;
                  const isCurrent = i === statusIndex;
                  return (
                    <div key={s} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0 ${
                        isCompleted ? 'bg-green-500 border-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400'
                      }`}>
                        {isCompleted && !isCurrent ? '✓' : i + 1}
                      </div>
                      <div className={`text-[10px] mt-1 hidden lg:block ${isCurrent ? 'font-bold text-blue-600 dark:text-blue-400' : isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                      {i < STATUS_ORDER.length - 1 && (
                        <div className={`w-6 h-0.5 shrink-0 ${isCompleted ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {t('tracking.lastUpdated', 'Last updated')}: {data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : data.submittedAt ? new Date(data.submittedAt).toLocaleString() : '—'}
              </p>
            </div>
          )}

          {/* Upgrade card */}
          {data.upgrade?.upgraded && (
            <div className="card border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/10">
              <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">
                {t('tracking.upgradedTitle', 'Upgraded / Escalated to a Higher Level')}
              </h3>
              <p className="text-sm text-purple-800 dark:text-purple-200">
                {data.upgrade.reason || t('tracking.upgradedDefault', 'This report was transferred for further action.')}
              </p>
              <div className="grid sm:grid-cols-2 gap-2 mt-3 text-sm">
                {data.upgrade.transferredTo && (
                  <p className="text-xs text-purple-700 dark:text-purple-300">
                    <span className="font-semibold">{t('tracking.transferredTo', 'Transferred to')}:</span> {data.upgrade.transferredTo}
                  </p>
                )}
                {data.upgrade.date && (
                  <p className="text-xs text-purple-700 dark:text-purple-300">
                    <span className="font-semibold">{t('tracking.upgradeDate', 'Date')}:</span> {new Date(data.upgrade.date).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Resolution card */}
          {data.resolution?.resolved && (
            <div className="card border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10">
              <h3 className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2">
                ✓ {t('tracking.resolvedTitle', 'Resolution')}
              </h3>
              {data.resolution.resolutionNotes && (
                <p className="text-sm text-green-800 dark:text-green-200">{data.resolution.resolutionNotes}</p>
              )}
              <div className="grid sm:grid-cols-2 gap-2 mt-3 text-sm">
                {data.resolution.resolvedBy && (
                  <p className="text-xs text-green-700 dark:text-green-300">
                    <span className="font-semibold">{t('tracking.resolvedBy', 'Resolved by')}:</span> {data.resolution.resolvedBy}
                  </p>
                )}
                {data.resolution.resolvedAt && (
                  <p className="text-xs text-green-700 dark:text-green-300">
                    <span className="font-semibold">{t('tracking.resolvedAt', 'Resolved on')}:</span> {new Date(data.resolution.resolvedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Details */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              {t('common.details', 'Details')}
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {data.category && <Detail label={t('common.category', 'Category')} value={data.category} />}
              {data.severityLevel && <Detail label={t('common.severity', 'Severity')} value={data.severityLevel} />}
              {data.department && <Detail label={t('tracking.department', 'Department')} value={data.department} />}
              {(data.subcity || data.subcityValue) && <Detail label={t('tracking.subcity', 'Subcity')} value={data.subcity || data.subcityValue} />}
              {(data.woreda || data.woredaName) && <Detail label={t('tracking.woreda', 'Woreda')} value={data.woreda || data.woredaName} />}
              {data.region && <Detail label={t('common.region', 'Region')} value={data.region} />}
              {data.city && <Detail label={t('common.city', 'City')} value={data.city} />}
              {data.address && <Detail label={t('dashboard.address', 'Address')} value={data.address} />}
              {data.specificLocation && <Detail label={t('common.location', 'Location')} value={data.specificLocation} />}
              {data.incidentDate && <Detail label={t('dashboard.incidentDate', 'Incident Date')} value={new Date(data.incidentDate).toLocaleDateString()} />}
              {(data.submittedAt || data.createdAt) && <Detail label={t('tracking.submittedOn', 'Submitted On')} value={new Date(data.submittedAt || data.createdAt).toLocaleString()} />}
              {data.resolvedAt && <Detail label={t('dashboard.resolvedAt', 'Resolved At')} value={new Date(data.resolvedAt).toLocaleString()} />}
            </div>
            {data.description && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('common.description', 'Description')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{data.description}</p>
              </div>
            )}
          </div>

          {/* Map */}
          {markers.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                {t('common.location', 'Location')}
              </h3>
              <EthioMap markers={markers} center={[Number(data.latitude), Number(data.longitude)]} zoom={12} height="280px" />
            </div>
          )}

          {/* Timeline */}
          {timeline.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                {t('tracking.timeline', 'Timeline')}
              </h3>
              <ol className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-2 space-y-6">
                {timeline.map((ev, i) => {
                  const date = ev.updatedAt || ev.timestamp || ev.createdAt || ev.date;
                  const title = ev.status || ev.action || ev.title || 'Update';
                  const note = ev.note || ev.description || '';
                  return (
                    <li key={i} className="ml-6">
                      <span className="absolute -left-2 w-4 h-4 rounded-full bg-primary-500 ring-4 ring-primary-100 dark:ring-primary-900/30" />
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 capitalize">{String(title).replace(/_/g, ' ')}</p>
                      {note && <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{note}</p>}
                      {date && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{new Date(date).toLocaleString()}</p>}
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {/* Messages from officials */}
          {data.comments?.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                <MessageSquareText className="w-4 h-4 text-primary-600 dark:text-primary-400" strokeWidth={2} />
                {t('tracking.messages', 'Messages')}
              </h3>
              <div className="space-y-3">
                {data.comments.map((c, i) => (
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

          {/* Receipt */}
          <div className="card text-center py-6">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {t('tracking.receiptTitle', 'Save or print your receipt')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              {t('tracking.receiptDesc', 'The PDF receipt contains your tracking details and a scannable QR code.')}
            </p>
            <a href={receiptUrl} target="_blank" rel="noreferrer" className="btn-primary py-2.5 px-6 text-sm inline-flex items-center gap-2">
              <span aria-hidden>⬇</span> {t('tracking.downloadReceipt', 'Download Receipt (PDF)')}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-gray-800 dark:text-gray-200 mt-0.5">{value}</p>
    </div>
  );
}
