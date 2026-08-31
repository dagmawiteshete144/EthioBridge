import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { volunteerTaskAPI } from '../../../services/api';
import { useSocket } from '../../../context/SocketContext';
import PageHeader from '../../../components/common/PageHeader';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import EmptyState from '../../../components/common/EmptyState';
import StatusBadge from '../../../components/common/StatusBadge';
import { toast } from 'react-toastify';
import { PenLine, ClipboardList, CalendarDays } from 'lucide-react';

export default function AdminVolunteerApplications() {
  const { t } = useTranslation();
  const { on } = useSocket() || {};
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [rejecting, setRejecting] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [actionId, setActionId] = useState(null);

  const loadApplications = useCallback(() => {
    const params = filter ? { status: filter } : {};
    return volunteerTaskAPI.getOrgApplications(params)
      .then(r => setApplications(r.data.applications || []))
      .catch(err => console.error(err));
  }, [filter]);

  useEffect(() => {
    loadApplications().finally(() => setLoading(false));
  }, [loadApplications]);

  useEffect(() => {
    if (!on) return;
    const offApp = on('volunteer:application', loadApplications);
    return () => { offApp?.(); };
  }, [on, loadApplications]);

  const handleApprove = async (id) => {
    setActionId(id);
    try {
      await volunteerTaskAPI.approveApplication(id);
      toast.success(t('dashboard.applicationApproved'));
      loadApplications();
    } catch (err) {
      toast.error(err.response?.data?.message || t('dashboard.actionFailed'));
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id) => {
    setActionId(id);
    try {
      await volunteerTaskAPI.rejectApplication(id, { note: rejectNote });
      toast.success(t('dashboard.applicationRejected'));
      setRejecting(null);
      setRejectNote('');
      loadApplications();
    } catch (err) {
      toast.error(err.response?.data?.message || t('dashboard.actionFailed'));
    } finally {
      setActionId(null);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

  return (
    <div className="space-y-5">
      <PageHeader title={t('dashboard.volunteerApplications')} subtitle={t('dashboard.volunteerApplicationsSubtitle')}>
        <select value={filter} onChange={e => { setFilter(e.target.value); }} className="input-field w-auto text-sm">
          <option value="">{t('dashboard.allStatuses')}</option>
          <option value="Pending">{t('dashboard.statusPending')}</option>
          <option value="Approved">{t('dashboard.statusApproved')}</option>
          <option value="Rejected">{t('dashboard.statusRejected')}</option>
        </select>
      </PageHeader>

      {loading ? <LoadingSpinner /> : applications.length === 0 ? (
        <EmptyState icon={<PenLine size={48} strokeWidth={2} />} title={t('dashboard.noApplicationsReceived')} description={t('dashboard.noApplicationsReceivedDesc')} />
      ) : (
        <div className="space-y-3">
          {applications.map(app => {
            const v = app.volunteerInfo || {};
            const task = app.task;
            return (
              <div key={app._id} className="card p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{v.fullName || app.volunteer?.fullName || '—'}</p>
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      <ClipboardList size={14} strokeWidth={2} className="inline mr-1" />{t('dashboard.appliedTask')}: <span className="font-medium text-gray-700 dark:text-gray-300">{task?.title || '—'}</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400"><CalendarDays size={14} strokeWidth={2} className="inline mr-1" />{t('dashboard.applicationDate')}: {formatDate(app.createdAt)}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {app.status === 'Pending' && (
                      <>
                        <button onClick={() => handleApprove(app._id)} disabled={actionId === app._id} className="btn-success text-xs py-1.5 px-3">
                          {actionId === app._id ? '...' : t('dashboard.approve')}
                        </button>
                        <button onClick={() => { setRejecting(rejecting === app._id ? null : app._id); setRejectNote(''); }} className="btn-secondary text-xs py-1.5 px-3">
                          {t('dashboard.reject')}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-sm">
                  <div><p className="text-xs text-gray-400">{t('dashboard.phoneNumber')}</p><p className="text-gray-700 dark:text-gray-200">{v.phone || '—'}</p></div>
                  <div><p className="text-xs text-gray-400">{t('register.profession')}</p><p className="text-gray-700 dark:text-gray-200">{v.profession || '—'}</p></div>
                  <div><p className="text-xs text-gray-400">{t('register.gender')}</p><p className="text-gray-700 dark:text-gray-200">{v.gender || '—'}</p></div>
                  <div className="col-span-2 sm:col-span-4">
                    <p className="text-xs text-gray-400">{t('register.skills')}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(v.skills || []).length ? v.skills.map((s, i) => (
                        <span key={i} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">{s}</span>
                      )) : <span className="text-gray-500 dark:text-gray-400">—</span>}
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-4">
                    <p className="text-xs text-gray-400">{t('dashboard.registrationInfo')}</p>
                    <p className="text-gray-700 dark:text-gray-200">
                      {app.volunteer?.email || '—'} • {app.volunteer?.subcity || '—'}{app.volunteer?.woredaName ? ` • ${app.volunteer.woredaName}` : ''}
                    </p>
                  </div>
                </div>

                {app.reason && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs text-gray-600 dark:text-gray-300">
                    <strong>{t('dashboard.reasonForApplying')}:</strong> {app.reason}
                  </div>
                )}

                {rejecting === app._id && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg space-y-2">
                    <textarea rows={2} value={rejectNote} onChange={e => setRejectNote(e.target.value)} className="input-field" placeholder={t('dashboard.rejectNotePlaceholder')} />
                    <div className="flex gap-2">
                      <button onClick={() => handleReject(app._id)} disabled={actionId === app._id} className="btn-primary text-xs py-1.5 px-3">
                        {actionId === app._id ? '...' : t('dashboard.confirmReject')}
                      </button>
                      <button onClick={() => setRejecting(null)} className="btn-secondary text-xs py-1.5 px-3">{t('dashboard.cancel')}</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
