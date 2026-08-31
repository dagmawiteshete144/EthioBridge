import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { volunteerTaskAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import PageHeader from '../../../components/common/PageHeader';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import EmptyState from '../../../components/common/EmptyState';
import { toast } from 'react-toastify';
import { Inbox, Map, Building2, MapPin, Users, Calendar, X } from 'lucide-react';

const priorityBadge = {
  High: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  Medium: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Low: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
};

export default function VolunteerAvailableTasks() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState('');
  const [availability, setAvailability] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = () => {
    setLoading(true);
    volunteerTaskAPI.getAvailableTasks()
      .then(r => setTasks(r.data.tasks || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTasks(); }, []);

  const openApply = (task) => { setSelected(task); setReason(''); setAvailability(false); };

  const handleApply = async () => {
    if (!availability) { toast.error(t('dashboard.confirmAvailabilityRequired')); return; }
    setSubmitting(true);
    try {
      await volunteerTaskAPI.applyToTask(selected._id, { reason, availabilityConfirmed: availability });
      toast.success(t('dashboard.applicationSubmitted'));
      setSelected(null);
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || t('dashboard.applicationFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const formatDeadline = (d) => d ? new Date(d).toLocaleDateString() : t('dashboard.noDeadline');

  return (
    <div className="space-y-5">
      <PageHeader title={t('dashboard.availableTasksPage')} subtitle={t('dashboard.availableTasksSubtitle')} />

      {loading ? <LoadingSpinner /> : tasks.length === 0 ? (
        !user?.subcity ? (
          <div>
            <EmptyState icon={Map} title={t('dashboard.setSubcityRequiredTitle')} description={t('dashboard.setSubcityRequiredDesc')} />
            <div className="text-center">
              <Link to="/volunteer/profile" className="btn-primary inline-flex text-sm py-2 px-4">{t('dashboard.goToProfile')}</Link>
            </div>
          </div>
        ) : (
          <EmptyState icon={Inbox} title={t('dashboard.noAvailableTasks')} description={t('dashboard.noAvailableTasksDesc')} />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tasks.map(task => (
            <div key={task._id} className="card flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">{task.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${priorityBadge[task.priority] || ''}`}>{task.priority}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">{task.description}</p>
              <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400 mb-4">
                <p><Building2 className="w-4 h-4 inline-block" /> {task.woredaName ? `${task.woredaName}, ${task.subcity}` : task.subcity}</p>
                {task.location && <p><MapPin className="w-4 h-4 inline-block" /> {task.location}</p>}
                <p><Users className="w-4 h-4 inline-block" /> {t('dashboard.requiredVolunteers')}: {task.requiredVolunteers}</p>
                <p><Calendar className="w-4 h-4 inline-block" /> {t('dashboard.deadline')}: {formatDeadline(task.deadline)}</p>
              </div>
              <button onClick={() => openApply(task)} className="btn-primary w-full mt-auto text-sm py-2">
                {t('dashboard.apply')}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Apply Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !submitting && setSelected(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">{t('dashboard.applyToTask')}</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3">
                <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{selected.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{selected.woredaName ? selected.woredaName : selected.subcity} {selected.location ? `• ${selected.location}` : ''}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('dashboard.profileInfoAuto')}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-xs text-gray-400">{t('dashboard.volunteerId')}</p><p className="text-gray-700 dark:text-gray-200 font-mono">{user?._id || '—'}</p></div>
                  <div><p className="text-xs text-gray-400">{t('dashboard.taskId')}</p><p className="text-gray-700 dark:text-gray-200 font-mono">{selected?._id || '—'}</p></div>
                  <div><p className="text-xs text-gray-400">{t('dashboard.fullName')}</p><p className="text-gray-700 dark:text-gray-200">{user?.fullName || '—'}</p></div>
                  <div><p className="text-xs text-gray-400">{t('dashboard.phoneNumber')}</p><p className="text-gray-700 dark:text-gray-200">{user?.phone || '—'}</p></div>
                  <div><p className="text-xs text-gray-400">{t('register.profession')}</p><p className="text-gray-700 dark:text-gray-200">{user?.profession || '—'}</p></div>
                  <div className="col-span-2"><p className="text-xs text-gray-400">{t('register.skills')}</p><p className="text-gray-700 dark:text-gray-200">{(user?.skills || []).join(', ') || '—'}</p></div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dashboard.reasonForApplying')} <span className="text-gray-400">({t('common.optional')})</span></label>
                <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} className="input-field" placeholder={t('dashboard.reasonPlaceholder')} />
              </div>

              <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input type="checkbox" checked={availability} onChange={e => setAvailability(e.target.checked)} className="mt-0.5" />
                <span>{t('dashboard.availabilityCheckbox')}</span>
              </label>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
              <button onClick={() => setSelected(null)} className="btn-secondary flex-1" disabled={submitting}>{t('dashboard.cancel')}</button>
              <button onClick={handleApply} disabled={submitting || !availability} className="btn-primary flex-1">
                {submitting ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('dashboard.applying')}</span> : t('dashboard.apply')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
