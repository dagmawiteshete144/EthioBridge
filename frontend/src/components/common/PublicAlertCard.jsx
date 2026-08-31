import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone } from 'lucide-react';
import AppIcon from '../../utils/iconMap.jsx';
import { alertAPI } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import {
  ALERT_SEVERITY_STYLES,
  ALERT_STATUS_LABELS,
  getAlertCategory,
  alertLocationLabel,
  alertIssuerLabel,
} from '../../utils/alertConstants';

// Data-driven replacement for the old static "Public Alerts & Broadcasts" card.
// Shows the latest active alert and refreshes instantly via Socket.io whenever a
// new alert is published. Logged-in citizens only see alerts relevant to their
// woreda/subcity (government alerts are always visible).
export default function PublicAlertCard() {
  const { on } = useSocket() || {};
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);

  const fetchAlerts = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const params = { limit: 5 };
      if (user?.role === 'citizen' && user.subcity) {
        params.subcity = user.subcity;
        if (user.woredaName) params.woreda = user.woredaName;
      }
      const res = await alertAPI.getActive(params);
      setAlerts(res.data?.data?.alerts || []);
    } catch (e) {
      console.error('Failed to load active alerts:', e);
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [user?.role, user?.subcity, user?.woredaName]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  useEffect(() => {
    if (!on) return;
    const offNew = on('alert:new', fetchAlerts);
    const offUpdated = on('alert:updated', fetchAlerts);
    const offDeleted = on('alert:deleted', fetchAlerts);
    return () => {
      offNew?.();
      offUpdated?.();
      offDeleted?.();
    };
  }, [on, fetchAlerts]);

  const active = alerts[0];
  const cat = getAlertCategory(active?.category);
  const count = alerts.length;

  return (
    <div className="card h-full relative overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-2xl hover:border-red-400/60 transition-all duration-300 group bg-[#1e3652] border-[#2b4566]">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-rose-500 to-red-600" />
      <div className="flex items-center justify-between mb-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center text-2xl shadow-md shadow-black/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
          <Megaphone size={28} strokeWidth={2} />
        </div>
        <span className="text-[11px] font-semibold bg-red-900/30 text-red-200 px-2.5 py-1 rounded-full">
          {count > 0 ? `${count} Active` : 'No Active'}
        </span>
      </div>

      <h3 className="mt-5 text-lg font-bold text-white mb-1">Public Alerts</h3>

      {loading ? (
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-[#2b4566] rounded animate-pulse" />
          <div className="h-3 bg-[#2b4566] rounded animate-pulse w-3/4" />
        </div>
      ) : !active ? (
        <div className="flex flex-col flex-1">
          <p className="text-sm text-blue-100/70 leading-relaxed">
            No active alerts right now. Updates from government authorities will appear here.
          </p>
          <Link to="/alerts" className="btn-primary text-sm py-2.5 px-5 w-full text-center mt-auto rounded-lg shadow-sm hover:shadow-md transition-all duration-200 inline-flex items-center justify-center">
            View Alerts
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5 mb-2">
            <span className="text-[10px] font-medium bg-[#16283f] text-blue-100/80 px-2 py-0.5 rounded-full">
              {cat.icon && <AppIcon icon={cat.icon} size={14} className="inline-block align-[-2px] mr-1" />}
              {cat.label}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ALERT_SEVERITY_STYLES[active.severity] || ''}`}>
              {active.severity}
            </span>
            {active.status !== 'active' && (
              <span className="text-[10px] font-medium bg-[#16283f] text-blue-100/80 px-2 py-0.5 rounded-full">
                {ALERT_STATUS_LABELS[active.status] || active.status}
              </span>
            )}
          </div>

          <h4 className="font-semibold text-white leading-snug line-clamp-2 group-hover:text-red-400 transition-colors">
            {active.title}
          </h4>
          <p className="text-sm text-blue-100/70 mt-1 leading-relaxed line-clamp-3">
            {active.description}
          </p>

          <div className="mt-3 space-y-1 text-xs text-blue-100/50">
            <p className="truncate"><AppIcon icon="publicService" size={14} className="inline-block align-[-2px] mr-1" />{alertIssuerLabel(active)}</p>
            <p className="truncate"><AppIcon icon="mapPin" size={14} className="inline-block align-[-2px] mr-1" />{alertLocationLabel(active) || 'Addis Ababa'}</p>
            <p><AppIcon icon="calendar" size={14} className="inline-block align-[-2px] mr-1" />{new Date(active.publishedAt || active.createdAt).toLocaleDateString()}</p>
          </div>

          <Link
            to={`/alerts/${active._id}`}
            className="btn-primary text-sm py-2.5 px-5 w-full text-center mt-auto rounded-lg shadow-sm hover:shadow-md transition-all duration-200 inline-flex items-center justify-center"
          >
            View Alert
          </Link>
        </>
      )}
    </div>
  );
}
