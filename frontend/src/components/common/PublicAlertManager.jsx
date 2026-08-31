import { useState, useEffect, useCallback, useMemo } from 'react';
import { Megaphone } from 'lucide-react';
import AppIcon from '../../utils/iconMap.jsx';
import { alertAPI, locationAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import { toast } from 'react-toastify';
import {
  ALERT_CATEGORY_OPTIONS,
  ALERT_SEVERITIES,
  ALERT_SEVERITY_STYLES,
  ALERT_PRIORITY_STYLES,
  ALERT_STATUS_STYLES,
  ALERT_STATUS_LABELS,
  getAlertCategory,
  getAlertPriority,
  alertLocationLabel,
  formatSubcityName,
  getWoredaLabel,
} from '../../utils/alertConstants';

const ROLE_SUBCITY_MAP = {
  subcity_bole: 'BOLE',
  subcity_yeka: 'YEKA',
  subcity_lemmi_kura: 'LEMMI_KURA',
};

const SUB_CITY_ROLES = Object.keys(ROLE_SUBCITY_MAP);

const isSubcityRole = (role) => SUB_CITY_ROLES.includes(role);

const EMPTY_FORM = {
  title: '',
  category: '',
  severity: 'Warning',
  subcityId: '',
  woredaId: '',
  description: '',
  expiresAt: '',
};

export default function PublicAlertManager() {
  const { user } = useAuth();
  const { on } = useSocket() || {};
  const isWoreda = user?.role === 'woreda';
  const isSubcity = isSubcityRole(user?.role);

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState({ status: '', category: '', severity: '' });

  const [subcities, setSubcities] = useState([]);
  const [woredas, setWoredas] = useState([]);
  const [loadingWoredas, setLoadingWoredas] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Subcity/woreda scope derived from the officer's account. Subcity and woreda
  // officers are locked to their own area — the backend always saves alerts
  // bound to their subcity/woreda, never to the submitted subcity/woreda.
  const userSubcityValue = isSubcity
    ? (ROLE_SUBCITY_MAP[user?.role] || user?.subcity || '')
    : (user?.subcity || '');

  const defaultSubcityId = useMemo(() => {
    if (!subcities.length) return '';
    const target = formatSubcityName(userSubcityValue).toLowerCase();
    const match = subcities.find(s => formatSubcityName(s.name).toLowerCase() === target);
    return match?._id || '';
  }, [subcities, userSubcityValue]);

  const subcityLocked = isWoreda || isSubcity;
  const woredaLocked = isWoreda || !!editing;

  useEffect(() => {
    locationAPI.getSubcities()
      .then(res => setSubcities(res.data?.subcities || []))
      .catch(e => console.error('Failed to load subcities:', e));
  }, []);

  const loadWoredas = useCallback(async (subcityId) => {
    if (!subcityId) {
      setWoredas([]);
      return;
    }
    setLoadingWoredas(true);
    try {
      const res = await locationAPI.getWoredasBySubcity(subcityId);
      setWoredas(res.data?.woredas || []);
    } catch (e) {
      console.error('Failed to load woredas:', e);
      setWoredas([]);
    } finally {
      setLoadingWoredas(false);
    }
  }, []);

  useEffect(() => {
    if (form.subcityId) loadWoredas(form.subcityId);
  }, [form.subcityId, loadWoredas]);

  // Lock a woreda officer's Woreda select to their own woreda once the woredas
  // for their subcity finish loading.
  useEffect(() => {
    if (!isWoreda || !user?.woredaName || !woredas.length) return;
    const target = String(user.woredaName).trim().toLowerCase();
    const match = woredas.find(w => getWoredaLabel(w).toLowerCase() === target);
    if (match && !form.woredaId) {
      setForm(p => ({ ...p, woredaId: match._id }));
    }
  }, [isWoreda, user?.woredaName, woredas, form.woredaId]);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filter.status) params.status = filter.status;
      if (filter.category) params.category = filter.category;
      if (filter.severity) params.severity = filter.severity;
      const res = await alertAPI.getAll(params);
      setAlerts(res.data?.data?.alerts || []);
      setPages(res.data?.data?.pages || 1);
      setTotal(res.data?.data?.total || 0);
    } catch (e) {
      console.error('Failed to load alerts:', e);
      toast.error(e.response?.data?.message || 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  useEffect(() => {
    if (!on) return;
    const offNew = on('alert:new', fetchAlerts);
    const offUpdated = on('alert:updated', fetchAlerts);
    const offDeleted = on('alert:deleted', fetchAlerts);
    return () => { offNew?.(); offUpdated?.(); offDeleted?.(); };
  }, [on, fetchAlerts]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, subcityId: defaultSubcityId || '' });
    setImageFile(null);
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (alert) => {
    setEditing(alert);
    setForm({
      title: alert.title || '',
      category: alert.category || '',
      severity: alert.severity || 'Warning',
      subcityId: alert.subcityId || defaultSubcityId || '',
      woredaId: alert.woredaId || '',
      description: alert.description || '',
      expiresAt: alert.expiresAt ? new Date(alert.expiresAt).toISOString().slice(0, 10) : '',
    });
    setImageFile(null);
    setErrors({});
    setShowForm(true);
  };

  const set = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    if (errors[key]) setErrors(p => { const n = { ...p }; delete n[key]; return n; });
  };

  const validate = () => {
    const err = {};
    if (!form.title.trim()) err.title = 'Alert title is required';
    else if (form.title.length > 200) err.title = 'Title must be under 200 characters';
    if (!form.category) err.category = 'Category is required';
    if (!form.severity) err.severity = 'Severity is required';
    if (!form.subcityId) err.subcityId = 'Subcity is required';
    if (!form.description.trim()) err.description = 'Description is required';
    else if (form.description.length > 5000) err.description = 'Description must be under 5000 characters';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const buildPayload = (status) => {
    const data = new FormData();
    data.append('title', form.title.trim());
    data.append('category', form.category);
    data.append('severity', form.severity);
    data.append('description', form.description.trim());
    data.append('status', status);
    const subcity = subcities.find(s => s._id === form.subcityId);
    const woreda = woredas.find(w => w._id === form.woredaId);
    if (subcity) {
      data.append('subcity', subcity.name);
      data.append('subcityId', subcity._id);
    }
    if (woreda) {
      data.append('woreda', getWoredaLabel(woreda));
      data.append('woredaId', woreda._id);
    }
    if (form.expiresAt) data.append('expiresAt', form.expiresAt);
    if (imageFile) data.append('image', imageFile);
    return data;
  };

  const handleSubmit = async (e, status) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the errors below');
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await alertAPI.update(editing._id, buildPayload(status));
        toast.success(status === 'active' ? 'Alert updated and published' : 'Alert updated');
      } else {
        await alertAPI.create(buildPayload(status));
        toast.success(status === 'active' ? 'Public alert published' : 'Alert saved as draft');
      }
      setShowForm(false);
      fetchAlerts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save alert');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatus = async (alert, status) => {
    const actionLabel = ALERT_STATUS_LABELS[status] || status;
    if (status === 'archived' && !window.confirm(`Archive "${alert.title}"? It will no longer be visible to citizens.`)) return;
    try {
      await alertAPI.updateStatus(alert._id, { status });
      toast.success(`Alert ${actionLabel.toLowerCase()}d`);
      fetchAlerts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update alert');
    }
  };

  const handleDelete = async (alert) => {
    if (!window.confirm(`Delete "${alert.title}" permanently?`)) return;
    try {
      await alertAPI.delete(alert._id);
      toast.success('Alert deleted');
      if (editing?._id === alert._id) setShowForm(false);
      fetchAlerts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete alert');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-navy-100"><Megaphone className="inline-block mr-2 align-[-3px]" size={26} strokeWidth={2} />Public Alerts</h1>
          <p className="text-sm text-gray-500 dark:text-navy-300 mt-1">
            {total} alert{total === 1 ? '' : 's'}
            {isWoreda
              ? ` for Woreda ${user?.woredaName || user?.woredaId || '—'}${user?.subcity ? `, ${user.subcity}` : ''}`
              : user?.subcity ? ` for ${user.subcity} Subcity` : ''}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors text-sm inline-flex items-center gap-2 shrink-0"
        >
          <AppIcon icon="plus" size={18} />
          Create Public Alert
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-3">
          <select value={filter.status} onChange={e => { setFilter(p => ({ ...p, status: e.target.value })); setPage(1); }} className="input-field w-auto text-sm">
            <option value="">All Statuses</option>
            {Object.entries(ALERT_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select value={filter.category} onChange={e => { setFilter(p => ({ ...p, category: e.target.value })); setPage(1); }} className="input-field w-auto text-sm">
            <option value="">All Categories</option>
            {ALERT_CATEGORY_OPTIONS.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <select value={filter.severity} onChange={e => { setFilter(p => ({ ...p, severity: e.target.value })); setPage(1); }} className="input-field w-auto text-sm">
            <option value="">All Severities</option>
            {ALERT_SEVERITIES.map(s => (
              <option key={s.v} value={s.v}>{s.v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Alerts List */}
      {loading ? (
        <LoadingSpinner />
      ) : alerts.length === 0 ? (
        <EmptyState icon="alerts" title="No alerts found" description="Create your first public alert to notify citizens in your area." />
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => {
            const cat = getAlertCategory(alert.category);
            return (
              <div key={alert._id} className="card hover:shadow-md transition-shadow border-l-4 border-l-red-500">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="flex items-center"><AppIcon icon={cat.icon} size={20} className="inline-block" /></span>
                      <h3 className="font-semibold text-gray-800 dark:text-navy-100 truncate">{alert.title}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ALERT_PRIORITY_STYLES[getAlertPriority(alert)] || ''}`}>{getAlertPriority(alert)}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ALERT_SEVERITY_STYLES[alert.severity] || ''}`}>{alert.severity}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${ALERT_STATUS_STYLES[alert.status] || ''}`}>{ALERT_STATUS_LABELS[alert.status] || alert.status}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-navy-300 line-clamp-1">{alert.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
                      <span className="flex items-center gap-1"><AppIcon icon="mapPin" size={14} className="inline-block" />{alertLocationLabel(alert) || 'Addis Ababa'}</span>
                      <span>•</span>
                      <span>{new Date(alert.publishedAt || alert.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>By {alert.publishedByName}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 shrink-0 items-center">
                    {alert.status === 'draft' && (
                      <button onClick={() => handleStatus(alert, 'active')}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors">
                        Publish
                      </button>
                    )}
                    {alert.status === 'active' && isWoreda && (
                      <button onClick={() => handleStatus(alert, 'archived')}
                        className="btn-secondary text-xs py-1.5 px-3">Archive</button>
                    )}
                    {alert.status === 'expired' && (
                      <button onClick={() => handleStatus(alert, 'active')}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors">
                        Reactivate
                      </button>
                    )}
                    {alert.status === 'archived' && isWoreda && (
                      <button onClick={() => handleStatus(alert, 'active')}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors">
                        Reactivate
                      </button>
                    )}
                    <button onClick={() => openEdit(alert)} className="btn-secondary text-xs py-1.5 px-3">Edit</button>
                    <button onClick={() => handleDelete(alert)} className="btn-danger text-xs py-1.5 px-3">Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination page={page} pages={pages} onPageChange={setPage} />

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white dark:bg-navy-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-navy-600 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-navy-100">
                  {editing ? 'Edit Public Alert' : 'Create Public Alert'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-navy-300 mt-0.5">
                  Issued by {isWoreda ? `Woreda ${user?.woredaName || '—'}` : user?.subcity ? `${user.subcity} Subcity` : 'your office'}
                  {isWoreda && user?.subcity ? `, ${user.subcity}` : ''} — saved automatically
                </p>
              </div>
              <button onClick={() => setShowForm(false)} aria-label="Close" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
                <AppIcon icon="x" size={20} />
              </button>
            </div>

            <form onSubmit={e => handleSubmit(e, 'active')} noValidate>
              <div className="p-6 space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-navy-200 mb-1.5">Title <span className="text-red-500">*</span></label>
                  <input
                    name="title" value={form.title} maxLength={200}
                    onChange={e => set('title', e.target.value)}
                    placeholder="e.g. Heavy Rainfall Warning for Woreda 3"
                    className={`input-field ${errors.title ? 'border-red-400 focus:ring-red-300' : ''}`}
                  />
                  {errors.title && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.title}</p>}
                </div>

                {/* Category + Severity */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-navy-200 mb-1.5">Category <span className="text-red-500">*</span></label>
                    <select value={form.category} onChange={e => set('category', e.target.value)} className={`input-field ${errors.category ? 'border-red-400 focus:ring-red-300' : ''}`}>
                      <option value="">Select category</option>
                      {ALERT_CATEGORY_OPTIONS.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    {errors.category && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.category}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-navy-200 mb-1.5">Severity <span className="text-red-500">*</span></label>
                    <select value={form.severity} onChange={e => set('severity', e.target.value)} className="input-field">
                      {ALERT_SEVERITIES.map(s => (
                        <option key={s.v} value={s.v}>{s.v} — {s.desc}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Subcity + Woreda + Expiry */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-navy-100 mb-1.5">Subcity <span className="text-red-500">*</span></label>
                    <select
                      value={form.subcityId}
                      onChange={e => {
                        set('subcityId', e.target.value);
                        set('woredaId', '');
                      }}
                      disabled={subcityLocked}
                      className={`input-field ${errors.subcityId ? 'border-red-400 focus:ring-red-300' : ''}`}
                    >
                      <option value="">Select subcity</option>
                      {subcities.map(s => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                    {subcityLocked && (
                      <p className="text-xs text-gray-500 dark:text-navy-400 mt-1">
                        Bound to your {formatSubcityName(userSubcityValue) || 'subcity'} office.
                      </p>
                    )}
                    {errors.subcityId && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.subcityId}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-navy-100 mb-1.5">Woreda</label>
                    <select
                      value={form.woredaId}
                      onChange={e => set('woredaId', e.target.value)}
                      disabled={!form.subcityId || woredaLocked}
                      className="input-field"
                    >
                      {!form.subcityId && <option value="">Select subcity first</option>}
                      {isSubcity && !editing && <option value="">All Woredas (Whole Subcity)</option>}
                      {form.subcityId && loadingWoredas && <option value="">Loading woredas…</option>}
                      {form.subcityId && !loadingWoredas && woredas.length === 0 && (
                        <option value="">No woredas found</option>
                      )}
                      {woredas.map(w => (
                        <option key={w._id} value={w._id}>{getWoredaLabel(w)}</option>
                      ))}
                    </select>
                    {woredaLocked && (
                      <p className="text-xs text-gray-500 dark:text-navy-400 mt-1">
                        {isWoreda ? 'Your alert is scoped to your woreda.' : 'Location scope is fixed after publishing.'}
                      </p>
                    )}
                    {isSubcity && !editing && (
                      <p className="text-xs text-gray-500 dark:text-navy-400 mt-1">
                        Optional — leave "All Woredas" to cover the whole subcity.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-navy-100 mb-1.5">Expiration Date</label>
                    <input
                      type="date" name="expiresAt" value={form.expiresAt}
                      onChange={e => set('expiresAt', e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-navy-200 mb-1.5">Image (optional)</label>
                  <input
                    type="file" accept="image/*"
                    onChange={e => setImageFile(e.target.files?.[0] || null)}
                    className="input-field file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 dark:file:bg-gray-700 file:px-3 file:py-1.5 file:text-sm"
                  />
                  {editing?.image && (
                    <img src={editing.image} alt="" className="mt-2 h-24 object-cover rounded-lg" />
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-navy-200 mb-1.5">Description <span className="text-red-500">*</span></label>
                  <textarea
                    name="description" value={form.description} rows={5} maxLength={5000}
                    onChange={e => set('description', e.target.value)}
                    placeholder="Provide detailed information about the alert and any actions citizens should take…"
                    className={`input-field resize-none ${errors.description ? 'border-red-400 focus:ring-red-300' : ''}`}
                  />
                  {errors.description && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{errors.description}</p>}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 dark:border-navy-600 bg-gray-50 dark:bg-navy-800/50 flex flex-col sm:flex-row gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary py-2.5 px-5 text-sm order-2 sm:order-1">Cancel</button>
                <button
                  type="submit" disabled={submitting}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm inline-flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving…</>
                  ) : (
                    <>{editing ? 'Update Alert' : 'Publish Alert'}</>
                  )}
                </button>
                {!editing && (
                  <button
                    type="button" disabled={submitting}
                    onClick={e => handleSubmit(e, 'draft')}
                    className="btn-secondary py-2.5 px-5 text-sm"
                  >
                    Save as Draft
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
