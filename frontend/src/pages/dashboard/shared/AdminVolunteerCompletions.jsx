import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { volunteerTaskAPI } from '../../../services/api';
import { useSocket } from '../../../context/SocketContext';
import PageHeader from '../../../components/common/PageHeader';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import EmptyState from '../../../components/common/EmptyState';
import { toast } from 'react-toastify';
import { CircleCheck, MapPin, UserRound } from 'lucide-react';

export default function AdminVolunteerCompletions() {
  const { t } = useTranslation();
  const { on } = useSocket() || {};
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [actionId, setActionId] = useState(null);

  const loadTasks = useCallback(() => {
    return volunteerTaskAPI.getOrgCompletions()
      .then(r => setTasks(r.data.tasks || []))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    loadTasks().finally(() => setLoading(false));
  }, [loadTasks]);

  useEffect(() => {
    if (!on) return;
    const offCompletion = on('volunteer:completion', loadTasks);
    return () => { offCompletion?.(); };
  }, [on, loadTasks]);

  const handleVerify = async (id) => {
    setActionId(id);
    try {
      await volunteerTaskAPI.verifyCompletion(id);
      toast.success(t('dashboard.completionVerified'));
      loadTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || t('dashboard.actionFailed'));
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id) => {
    if (!feedback.trim()) { toast.error(t('dashboard.feedbackRequired')); return; }
    setActionId(id);
    try {
      await volunteerTaskAPI.rejectCompletion(id, { feedback });
      toast.success(t('dashboard.completionRejected'));
      setRejecting(null);
      setFeedback('');
      loadTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || t('dashboard.actionFailed'));
    } finally {
      setActionId(null);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

  return (
    <div className="space-y-5">
      <PageHeader title={t('dashboard.completionVerification')} subtitle={t('dashboard.completionVerificationSubtitle')} />

      {loading ? <LoadingSpinner /> : tasks.length === 0 ? (
        <EmptyState icon={<CircleCheck size={48} strokeWidth={2} />} title={t('dashboard.noCompletionRequests')} description={t('dashboard.noCompletionRequestsDesc')} />
      ) : (
        <div className="space-y-3">
          {tasks.map(task => (
            <div key={task._id} className="card p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">{task.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {task.woredaName ? `${task.woredaName}, ${task.subcity}` : task.subcity}
                    {task.location ? <><span className="mx-1">•</span><MapPin size={12} strokeWidth={2} className="inline" /> {task.location}</> : ''}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <UserRound size={14} strokeWidth={2} className="inline mr-1" />{t('dashboard.requestedBy')}: {task.completionRequestedBy?.fullName || '—'} • {formatDate(task.completionRequestedAt)}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleVerify(task._id)} disabled={actionId === task._id} className="btn-success text-xs py-1.5 px-3">
                    {actionId === task._id ? '...' : t('dashboard.verifyCompletion')}
                  </button>
                  <button onClick={() => { setRejecting(rejecting === task._id ? null : task._id); setFeedback(''); }} className="btn-secondary text-xs py-1.5 px-3">
                    {t('dashboard.rejectCompletion')}
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{task.description}</p>

              {task.progressUpdates?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">{t('dashboard.submittedProgress')}</p>
                  <div className="space-y-2">
                    {task.progressUpdates.slice().reverse().map((p, i) => (
                      <div key={i} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs">
                        <span className="font-semibold text-gray-700 dark:text-gray-200">{p.percentage}%</span>
                        {p.note && <span className="text-gray-500 dark:text-gray-400 ml-2">{p.note}</span>}
                        {p.photos?.length > 0 && (
                          <div className="flex gap-2 mt-1 flex-wrap">
                            {p.photos.map((photo, j) => (
                              <a key={j} href={photo} target="_blank" rel="noreferrer">
                                <img src={photo} alt="" className="w-14 h-14 object-cover rounded-lg" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {rejecting === task._id && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg space-y-2">
                  <textarea rows={2} value={feedback} onChange={e => setFeedback(e.target.value)} className="input-field" placeholder={t('dashboard.feedbackPlaceholder')} />
                  <div className="flex gap-2">
                    <button onClick={() => handleReject(task._id)} disabled={actionId === task._id} className="btn-primary text-xs py-1.5 px-3">
                      {actionId === task._id ? '...' : t('dashboard.sendFeedback')}
                    </button>
                    <button onClick={() => setRejecting(null)} className="btn-secondary text-xs py-1.5 px-3">{t('dashboard.cancel')}</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
