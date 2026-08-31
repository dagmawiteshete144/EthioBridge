import { useTranslation } from 'react-i18next';
import AppIcon from '../../utils/iconMap.jsx';

const ACTION_CONFIG = {
  created: { icon: 'editLine', color: 'bg-blue-100 text-blue-600' },
  approved: { icon: 'success', color: 'bg-green-100 text-green-600' },
  rejected: { icon: 'error', color: 'bg-red-100 text-red-600' },
  assigned: { icon: 'assigned', color: 'bg-purple-100 text-purple-600' },
  status_changed: { icon: 'refresh', color: 'bg-yellow-100 text-yellow-600' },
  work_started: { icon: 'wrench', color: 'bg-orange-100 text-orange-600' },
  work_completed: { icon: 'sparkles', color: 'bg-green-100 text-green-600' },
  citizen_verified: { icon: 'thumbsUp', color: 'bg-green-100 text-green-600' },
  citizen_rejected: { icon: 'thumbsDown', color: 'bg-red-100 text-red-600' },
  reopened: { icon: 'refresh', color: 'bg-amber-100 text-amber-600' },
  comment_added: { icon: 'messageSquare', color: 'bg-gray-100 text-gray-600' },
  media_uploaded: { icon: 'camera', color: 'bg-indigo-100 text-indigo-600' },
  feedback_added: { icon: 'star', color: 'bg-yellow-100 text-yellow-600' },
  forwarded: { icon: 'forward', color: 'bg-blue-100 text-blue-600' },
  received: { icon: 'download', color: 'bg-teal-100 text-teal-600' },
  resolved_at_level: { icon: 'success', color: 'bg-green-100 text-green-600' },
};

export default function ReportTimeline({ timeline = [], showTitle = true }) {
  const { t } = useTranslation();

  if (!timeline.length) return null;

  const sorted = [...timeline].reverse();

  return (
    <div className="space-y-1">
      {showTitle && <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('dashboard.timelineHistory')}</h3>}
      <div className="relative ml-4">
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
        {sorted.map((event, i) => {
          const config = ACTION_CONFIG[event.action] || ACTION_CONFIG.status_changed;
          return (
            <div key={event._id || i} className="relative pl-8 pb-5 last:pb-0">
              <div className={`absolute left-[-7px] top-0 w-4 h-4 rounded-full ${config.color} flex items-center justify-center text-[10px] border-2 border-white dark:border-gray-800 z-10`}>
                <AppIcon icon={config.icon} size={10} />
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg p-3 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{event.description}</p>
                  <span className="text-xs text-gray-400 shrink-0 ml-2">
                    {new Date(event.createdAt || event.updatedAt).toLocaleString()}
                  </span>
                </div>
                {event.note && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{event.note}</p>}
                {event.previousStatus && event.newStatus && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                    <span>{event.previousStatus}</span>
                    <AppIcon icon="arrowRight" size={12} />
                    <span className="font-medium text-gray-600 dark:text-gray-300">{event.newStatus}</span>
                  </div>
                )}
                {event.performedByName && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {event.performedByName} ({event.performedByRole})
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
