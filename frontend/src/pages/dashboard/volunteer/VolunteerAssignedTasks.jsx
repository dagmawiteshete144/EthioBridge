import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { volunteerTaskAPI } from '../../../services/api';
import PageHeader from '../../../components/common/PageHeader';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import EmptyState from '../../../components/common/EmptyState';
import StatusBadge from '../../../components/common/StatusBadge';
import { toast } from 'react-toastify';
import { ClipboardList, MapPin, Calendar, AlarmClock } from 'lucide-react';

const priorityBadge = {
  High: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  Medium: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Low: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
};

const statusTone = {
  Assigned: 'badge-review',
  'In Progress': 'badge-progress',
  Completed: 'badge-resolved',
  Closed: 'badge-resolved',
  Open: 'badge-active',
};

export default function VolunteerAssignedTasks() {
  const { t } = useTranslation();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [progressForm, setProgressForm] = useState({ percentage: 0, note: '', photos: [] });
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = () => {
    setLoading(true);
    volunteerTaskAPI.getMyAssignedTasks()
      .then(r => setApplications(r.data.applications || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleStart = async (taskId) => {
    try {
      await volunteerTaskAPI.startTask(taskId);
      toast.success(t('dashboard.taskStarted'));
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || t('dashboard.actionFailed'));
    }
  };

  const handleProgress = async (taskId, e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('percentage', progressForm.percentage);
      fd.append('note', progressForm.note);
      progressForm.photos.forEach(p => fd.append('photos', p));
      await volunteerTaskAPI.updateTaskProgress(taskId, fd);
      toast.success(t('dashboard.progressSubmitted'));
      setProgressForm({ percentage: 0, note: '', photos: [] });
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || t('dashboard.actionFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (taskId) => {
    if (!window.confirm(t('dashboard.confirmComplete'))) return;
    try {
      await volunteerTaskAPI.requestCompletion(taskId);
      toast.success(t('dashboard.completionRequestSent'));
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || t('dashboard.actionFailed'));
    }
  };

  const handleToggleSubtask = async (taskId, subtaskId) => {
    const previous = applications;
    setApplications(prev => prev.map(app => {
      if (app.task?._id !== taskId) return app;
      const subtasks = (app.task.subtasks || []).map(s =>
        s._id === subtaskId ? { ...s, isCompleted: !s.isCompleted, completedAt: s.isCompleted ? null : new Date().toISOString() } : s
      );
      const total = subtasks.length;
      const done = subtasks.filter(s => s.isCompleted).length;
      return { ...app, task: { ...app.task, subtasks, progress: total ? Math.round((done / total) * 100) : 0 } };
    }));
    try {
      const r = await volunteerTaskAPI.toggleSubtask(taskId, subtaskId);
      setApplications(prev => prev.map(app =>
        app.task?._id === taskId ? { ...app, task: r.data.task } : app
      ));
    } catch (err) {
      toast.error(err.response?.data?.message || t('dashboard.actionFailed'));
      setApplications(previous);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

  return (
    <div className="space-y-5">
      <PageHeader title={t('dashboard.assignedTasks')} subtitle={t('dashboard.assignedTasksSubtitle')} />

      {loading ? <LoadingSpinner /> : applications.length === 0 ? (
        <EmptyState icon={ClipboardList} title={t('dashboard.noAssignedTasks')} description={t('dashboard.noAssignedTasksDesc')} />
      ) : (
        <div className="space-y-3">
          {applications.map(app => {
            const task = app.task;
            if (!task) return null;
            const isExpanded = expanded === task._id;
            const hasSubtasks = (task.subtasks?.length || 0) > 0;
            const progressPct = hasSubtasks
              ? (task.progress ?? 0)
              : (task.progressUpdates?.length ? Math.max(...task.progressUpdates.map(p => p.percentage || 0)) : 0);
            return (
              <div key={app._id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{task.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityBadge[task.priority] || ''}`}>{task.priority}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {task.woredaName ? `${task.woredaName}, ${task.subcity}` : task.subcity}
                      {task.location ? <> • <MapPin className="w-4 h-4 inline-block" /> {task.location}</> : ''}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{task.description}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span><Calendar className="w-4 h-4 inline-block" /> {t('dashboard.assignedDate')}: {formatDate(app.reviewedAt || app.createdAt)}</span>
                      <span><AlarmClock className="w-4 h-4 inline-block" /> {t('dashboard.deadline')}: {formatDate(task.deadline)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <StatusBadge status={task.status === 'Completed' ? 'Completed' : task.status} />
                    {task.status === 'Assigned' && (
                      <button onClick={() => handleStart(task._id)} className="btn-success text-xs py-1.5 px-3">{t('dashboard.startTask')}</button>
                    )}
                  </div>
                </div>

                {task.status === 'Completed' && task.completionRequestedBy && (
                  <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-xs text-yellow-800 dark:text-yellow-200">
                    {t('dashboard.awaitingVerification')}
                  </div>
                )}

                {task.status === 'In Progress' && task.completionFeedback && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-200">
                    <strong>{t('dashboard.completionFeedback')}:</strong> {task.completionFeedback}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-600 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                    {progressPct}%
                  </span>
                  <button onClick={() => setExpanded(isExpanded ? null : task._id)} className="text-xs text-primary-600 hover:underline">
                    {isExpanded ? t('dashboard.hideDetails') : t('dashboard.viewDetails')}
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-4 space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                    {hasSubtasks && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                          {t('dashboard.subtasks')} ({task.subtasks.filter(s => s.isCompleted).length}/{task.subtasks.length})
                        </h4>
                        <ul className="space-y-1">
                          {task.subtasks.map(subtask => (
                            <li key={subtask._id}>
                              <label className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${subtask.isCompleted ? 'bg-primary-50 dark:bg-primary-900/10' : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                <input
                                  type="checkbox"
                                  checked={subtask.isCompleted}
                                  onChange={() => handleToggleSubtask(task._id, subtask._id)}
                                  className="w-4 h-4 rounded accent-primary-600 cursor-pointer"
                                />
                                <span className={`text-sm ${subtask.isCompleted ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'}`}>
                                  {subtask.title}
                                </span>
                              </label>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {task.status === 'In Progress' && (
                      <form onSubmit={e => handleProgress(task._id, e)} className="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('dashboard.submitProgressUpdate')}</h4>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{t('dashboard.progressPercentage')}: {progressForm.percentage}%</label>
                          <input type="range" min="0" max="100" step="5" value={progressForm.percentage}
                            onChange={e => setProgressForm(p => ({ ...p, percentage: Number(e.target.value) }))}
                            className="w-full accent-primary-600" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{t('dashboard.progressNote')}</label>
                          <textarea rows={2} value={progressForm.note} onChange={e => setProgressForm(p => ({ ...p, note: e.target.value }))}
                            className="input-field" placeholder={t('dashboard.progressNotePlaceholder')} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{t('dashboard.uploadPhotos')}</label>
                          <input type="file" accept="image/*" multiple
                            onChange={e => setProgressForm(p => ({ ...p, photos: [...e.target.files] }))}
                            className="input-field file:mr-3 file:rounded-md file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-700" />
                        </div>
                        <button type="submit" disabled={submitting} className="btn-primary text-sm py-2 px-4">
                          {submitting ? t('dashboard.submitting') : t('dashboard.submitUpdate')}
                        </button>
                      </form>
                    )}

                    {task.status === 'In Progress' && (
                      <div className="flex justify-end">
                        <button onClick={() => handleComplete(task._id)} className="btn-success text-sm py-2 px-4">{t('dashboard.completeTask')}</button>
                      </div>
                    )}

                    {task.progressUpdates?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">{t('dashboard.progressHistory')}</h4>
                        <div className="space-y-2">
                          {task.progressUpdates.slice().reverse().map((p, i) => (
                            <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-gray-700 dark:text-gray-200">{p.percentage}%</span>
                                <span className="text-xs text-gray-400">{formatDate(p.submittedAt)}</span>
                              </div>
                              {p.note && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{p.note}</p>}
                              {p.photos?.length > 0 && (
                                <div className="flex gap-2 mt-2 flex-wrap">
                                  {p.photos.map((photo, j) => (
                                    <a key={j} href={photo} target="_blank" rel="noreferrer">
                                      <img src={photo} alt="" className="w-16 h-16 object-cover rounded-lg" />
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
