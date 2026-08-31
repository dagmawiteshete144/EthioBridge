import React from 'react';
import { ICONS } from '../../utils/iconMap.jsx';

const STATUS_ICON_MAP = {
  Open:                  { icon: ICONS.pending,         color: 'text-gray-500 dark:text-gray-400' },
  Pending:               { icon: ICONS.pending,         color: 'text-amber-500' },
  Submitted:             { icon: ICONS.pending,         color: 'text-amber-500' },
  'Under Review':        { icon: ICONS.inReview,        color: 'text-blue-500' },
  Approved:              { icon: ICONS.success,         color: 'text-green-500' },
  Assigned:              { icon: ICONS.assigned,        color: 'text-blue-500' },
  'In Progress':         { icon: ICONS.inProgress,      color: 'text-blue-500' },
  Completed:             { icon: ICONS.success,         color: 'text-green-500' },
  'Citizen Verification':{ icon: ICONS.badgeCheck,      color: 'text-amber-500' },
  Resolved:              { icon: ICONS.resolved,        color: 'text-emerald-500' },
  Reopened:              { icon: ICONS.refresh,         color: 'text-amber-500' },
  Active:                { icon: ICONS.success,         color: 'text-green-500' },
  Found:                 { icon: ICONS.success,         color: 'text-green-500' },
  Rejected:              { icon: ICONS.rejected,        color: 'text-red-500' },
  Missing:               { icon: ICONS.search,          color: 'text-amber-500' },
  'Under Investigation': { icon: ICONS.inReview,        color: 'text-blue-500' },
  Closed:                { icon: ICONS.error,           color: 'text-gray-500 dark:text-gray-400' },
  Cancelled:             { icon: ICONS.error,           color: 'text-red-500' },
  Upgraded:              { icon: ICONS.upgraded,        color: 'text-blue-500' },
};

export const getStatusIcon = (status) => STATUS_ICON_MAP[status] || {
  icon: ICONS.pending,
  color: 'text-gray-500 dark:text-gray-400',
};

export default function StatusIcon({ status, size = 16, className = '' }) {
  const { icon: Icon, color } = getStatusIcon(status);
  return <Icon size={size} strokeWidth={2} className={`${color} ${className}`} />;
}
