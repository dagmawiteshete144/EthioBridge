import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { volunteerTaskAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import PageHeader from '../../../components/common/PageHeader';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import EmptyState from '../../../components/common/EmptyState';
import StatusBadge from '../../../components/common/StatusBadge';
import { toast } from 'react-toastify';
import { ClipboardList, MapPin, Users, CircleCheck, AlarmClock } from 'lucide-react';

const priorityBadge = {
  High: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  Medium: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Low: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
};

export default function AdminVolunteerTasks() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { on } = useSocket() || {};
  const isSubcity = user?.role?.startsWith('subcity_');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    requiredVolunteers: 1,
    deadline: '',
    priority: 'Medium',
    subtasks: '',
  });

  const loadTasks = useCallback(() => {
    return volunteerTaskAPI.getOrgTasks()
      .then(r => setTasks(r.data.tasks || []))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    loadTasks().finally(() => setLoading(false));
  }, [loadTasks]);

  useEffect(() => {
    if (!on) return;
    const offApp = on('volunteer:application', loadTasks);
    const offStarted = on('volunteer:started', loadTasks);
    const offProgress = on('volunteer:progress', loadTasks);
    const offCompletion = on('volunteer:completion', loadTasks);
    return () => {
      offApp?.();
      offStarted?.();
      offProgress?.();
      offCompletion?.();
    };
  }, [on, loadTasks]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const subtasks = form.subtasks
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);
      await volunteerTaskAPI.createTask({ ...form, subtasks, deadline: form.deadline || undefined });
      toast.success(t('dashboard.taskCreated'));
      setForm({ title: '', description: '', location: '', requiredVolunteers: 1, deadline: '', priority: 'Medium', subtasks: '' });
      setShowForm(false);
      loadTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || t('dashboard.actionFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

  return (
    <div className="space-y-5">
      <PageHeader title={t('dashboard.volunteerTasksAdmin')} subtitle={t('dashboard.volunteerTasksAdminSubtitle')}>
        <button onClick={() => setShowForm(p => !p)} className="btn-primary text-sm py-2 px-4">
          {showForm ? t('dashboard.cancel') : t('dashboard.createTask')}
        </button>
      </PageHeader>

      {showForm && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">{t('dashboard.createNewTask')}</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dashboard.taskTitle')} *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required className="input-field" placeholder={t('dashboard.taskTitlePlaceholder')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dashboard.taskDescription')} *</label>
              <textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required className="input-field" placeholder={t('dashboard.taskDescriptionPlaceholder')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dashboard.taskLocation')}</label>
                <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} className="input-field" placeholder={t('dashboard.taskLocationPlaceholder')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dashboard.requiredVolunteers')}</label>
                <input type="number" min="1" value={form.requiredVolunteers} onChange={e => setForm(p => ({ ...p, requiredVolunteers: Number(e.target.value) }))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dashboard.deadline')}</label>
                <input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dashboard.priority')}</label>
                <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))} className="input-field">
                  <option value="High">{t('dashboard.priorityHigh')}</option>
                  <option value="Medium">{t('dashboard.priorityMedium')}</option>
                  <option value="Low">{t('dashboard.priorityLow')}</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dashboard.subtasks')}</label>
              <textarea rows={3} value={form.subtasks} onChange={e => setForm(p => ({ ...p, subtasks: e.target.value }))} className="input-field" placeholder={t('dashboard.subtasksPlaceholder')} />
              <p className="text-xs text-gray-400 mt-1">{t('dashboard.subtasksHint')}</p>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {isSubcity
                ? t('dashboard.taskTargetSubcity', { area: user?.subcity || '' })
                : t('dashboard.taskTargetWoreda', { area: user?.woredaName || '' })}
            </div>
            <button type="submit" disabled={submitting} className="btn-primary text-sm py-2 px-4">
              {submitting ? t('dashboard.publishing') : t('dashboard.publishTask')}
            </button>
          </form>
        </div>
      )}

      {loading ? <LoadingSpinner /> : tasks.length === 0 ? (
        <EmptyState icon={<ClipboardList size={48} strokeWidth={2} />} title={t('dashboard.noOrgTasks')} description={t('dashboard.noOrgTasksDesc')} />
      ) : (
        <div className="space-y-3">
          {tasks.map(task => (
            <div key={task._id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{task.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityBadge[task.priority] || ''}`}>{task.priority}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {task.woredaName ? `${task.woredaName}, ${task.subcity}` : task.subcity}
                    {task.location ? <><span className="mx-1">•</span><MapPin size={12} strokeWidth={2} className="inline" /> {task.location}</> : ''}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{task.description}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1"><Users size={14} strokeWidth={2} /> {t('dashboard.requiredVolunteers')}: {task.requiredVolunteers}</span>
                    <span className="inline-flex items-center gap-1"><CircleCheck size={14} strokeWidth={2} /> {t('dashboard.filledSpots')}: {task.filledSpots}</span>
                    <span className="inline-flex items-center gap-1"><AlarmClock size={14} strokeWidth={2} /> {t('dashboard.deadline')}: {formatDate(task.deadline)}</span>
                  </div>
                </div>
                <div className="shrink-0">
                  <StatusBadge status={task.status} />
                </div>
              </div>
              {task.progressUpdates?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.progressUpdates')}</p>
                  <div className="space-y-1">
                    {task.progressUpdates.slice(-3).reverse().map((p, i) => (
                      <p key={i} className="text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">{p.percentage}%</span> {p.note}
                      </p>
                    ))}
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
