import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { alertAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { Megaphone } from 'lucide-react';
import EthioMap from '../../components/map/EthioMap';
import {
  ALERT_SEVERITY_STYLES,
  ALERT_STATUS_STYLES,
  ALERT_STATUS_LABELS,
  getAlertCategory,
  alertLocationLabel,
  alertIssuerLabel,
} from '../../utils/alertConstants';

export default function AlertDetail() {
  const { id } = useParams();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await alertAPI.getOne(id);
        setAlert(res.data?.data?.alert || null);
      } catch (e) {
        setError(e.response?.data?.message || 'Alert not found');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><LoadingSpinner /></div>;

  if (error || !alert) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <EmptyState icon={<Megaphone size={48} strokeWidth={2} />} title="Alert not found" description={error || 'This alert may have been removed.'} />
        <Link to="/alerts" className="btn-primary py-2.5 px-6 text-sm -mt-4">Browse All Alerts</Link>
      </div>
    );
  }

  const cat = getAlertCategory(alert.category);
  const hasCoords = typeof alert.latitude === 'number' && typeof alert.longitude === 'number';
  const issuedAt = new Date(alert.publishedAt || alert.createdAt);
  const expiresAt = alert.expiresAt ? new Date(alert.expiresAt) : null;

  return (
    <div className="py-12 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/alerts" className="inline-flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline mb-6">
          ← Back to Alerts
        </Link>

        <div className="card overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/10 border-b border-gray-200 dark:border-gray-700 px-6 py-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-xs font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full">
                {cat.label}
              </span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${ALERT_SEVERITY_STYLES[alert.severity] || ''}`}>
                {alert.severity}
              </span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ALERT_STATUS_STYLES[alert.status] || ''}`}>
                {ALERT_STATUS_LABELS[alert.status] || alert.status}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
              {alert.title}
            </h1>
          </div>

          <div className="p-6 sm:p-8">
            {/* Issuer + Location + Dates */}
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Issued By</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{alertIssuerLabel(alert)}</p>
                {alert.subcity && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{alert.subcity} Subcity</p>}
                {alert.woreda && <p className="text-xs text-gray-500 dark:text-gray-400">Woreda {alert.woreda}</p>}
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Location</p>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {alertLocationLabel(alert) || 'Addis Ababa'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Issued {issuedAt.toLocaleString()}
                  {expiresAt && !Number.isNaN(expiresAt.getTime()) && ` • Expires ${expiresAt.toLocaleDateString()}`}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Details</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {alert.description}
              </p>
            </div>

            {alert.image && (
              <div className="mb-6">
                <img src={alert.image} alt={alert.title} className="w-full max-h-96 object-cover rounded-xl" />
              </div>
            )}

            {/* Map */}
            {hasCoords && (
              <div>
                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Affected Area</h2>
                <EthioMap
                  markers={[{ latitude: alert.latitude, longitude: alert.longitude, type: 'alert', title: alert.title, region: alertLocationLabel(alert) }]}
                  center={[alert.latitude, alert.longitude]}
                  zoom={13}
                  height="320px"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
