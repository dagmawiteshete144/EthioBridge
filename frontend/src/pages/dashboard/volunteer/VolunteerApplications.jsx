import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { volunteerTaskAPI } from '../../../services/api';
import PageHeader from '../../../components/common/PageHeader';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import EmptyState from '../../../components/common/EmptyState';
import StatusBadge from '../../../components/common/StatusBadge';
import { PenLine } from 'lucide-react';

export default function VolunteerApplications() {
  const { t } = useTranslation();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    volunteerTaskAPI.getMyApplications()
      .then(r => setApplications(r.data.applications || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

  return (
    <div className="space-y-5">
      <PageHeader title={t('dashboard.myApplications')} subtitle={t('dashboard.myApplicationsSubtitle')} />

      {loading ? <LoadingSpinner /> : applications.length === 0 ? (
        <EmptyState icon={PenLine} title={t('dashboard.noApplications')} description={t('dashboard.noApplicationsDesc')} />
      ) : (
        <div className="space-y-3">
          {applications.map(app => (
            <div key={app._id} className="card p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 dark:text-gray-200">{app.task?.title || '—'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {app.task?.woredaName ? app.task.woredaName : app.task?.subcity} • {t('dashboard.appliedOn')}: {formatDate(app.createdAt)}
                </p>
                {app.reviewNote && <p className="text-xs text-gray-400 mt-1"><PenLine className="w-4 h-4 inline-block" /> {app.reviewNote}</p>}
              </div>
              <div className="shrink-0">
                <StatusBadge status={app.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
