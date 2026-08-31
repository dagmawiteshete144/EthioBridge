export const ALERT_CATEGORIES = {
  flood:        { icon: 'flood',        label: 'Flood Warning',           color: 'blue' },
  rainfall:     { icon: 'rainfall',     label: 'Heavy Rainfall Advisory', color: 'indigo' },
  road_closure: { icon: 'roadClosure',  label: 'Road Closure / Blockage', color: 'orange' },
  health:       { icon: 'health',       label: 'Health & Outbreak Alert', color: 'red' },
  power_outage: { icon: 'powerOutage',  label: 'Power Outage Notice',     color: 'yellow' },
  general:      { icon: 'general',      label: 'General Announcement',    color: 'slate' },
  security:     { icon: 'security',     label: 'Security Advisory',       color: 'emerald' },
  public_service: { icon: 'publicService', label: 'Public Service Notice', color: 'teal' },
};

export const ALERT_CATEGORY_OPTIONS = Object.entries(ALERT_CATEGORIES).map(([value, c]) => ({
  value,
  icon: c.icon,
  label: c.label,
  color: c.color,
}));

export const ALERT_SEVERITIES = [
  { v: 'Info',     color: 'blue',   desc: 'General advisory',          icon: 'info' },
  { v: 'Warning',  color: 'amber',  desc: 'Potential danger',          icon: 'warning' },
  { v: 'Critical', color: 'red',    desc: 'Immediate action needed',   icon: 'critical' },
];

export const ALERT_SEVERITY_STYLES = {
  Info:     'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  Warning:  'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  Critical: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300',
};

// Citizen-facing alert priority (Normal / Important / Urgent). Stored on the
// alert when set; legacy alerts derive one from severity via getAlertPriority.
export const ALERT_PRIORITIES = [
  { v: 'Normal',    color: 'blue',  icon: 'info',     desc: 'Routine information' },
  { v: 'Important', color: 'amber', icon: 'warning',  desc: 'Needs attention' },
  { v: 'Urgent',    color: 'red',   icon: 'critical', desc: 'Act immediately' },
];

export const ALERT_PRIORITY_STYLES = {
  Normal:    'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  Important: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  Urgent:    'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300',
};

const SEVERITY_TO_PRIORITY = { Info: 'Normal', Warning: 'Important', Critical: 'Urgent' };

export const getAlertPriority = (alert) =>
  alert?.priority || SEVERITY_TO_PRIORITY[alert?.severity] || 'Normal';

export const ALERT_STATUS_STYLES = {
  draft:    'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  active:   'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300',
  expired:  'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  archived: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-500',
};

export const ALERT_STATUS_LABELS = {
  draft: 'Draft',
  active: 'Active',
  expired: 'Expired',
  archived: 'Archived',
};

// "BOLE" -> "Bole", "LEMMI_KURA" -> "Lemmi Kura". Normalizes the uppercase
// values stored on citizen/officer accounts to the display subcity names.
export const formatSubcityName = (value) => String(value || '')
  .toLowerCase()
  .replace(/_/g, ' ')
  .split(' ')
  .filter(Boolean)
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');

export const getWoredaLabel = (woreda) =>
  String(woreda?.woredaName || woreda?.name || '').trim();

export const getAlertCategory = (category) => ALERT_CATEGORIES[category] || {
  icon: 'general',
  label: category || 'Alert',
  color: 'slate',
};

export const alertLocationLabel = (alert) => {
  if (!alert) return '';
  const parts = [];
  if (alert.location) parts.push(alert.location);
  if (alert.woreda) {
    parts.push(/^woreda\s/i.test(String(alert.woreda).trim()) ? alert.woreda : `Woreda ${alert.woreda}`);
  }
  if (alert.subcity) parts.push(alert.subcity);
  if (alert.zone) parts.push(alert.zone);
  if (!parts.length && alert.region) parts.push(alert.region);
  return parts.join(', ');
};

export const alertIssuerLabel = (alert) => {
  if (!alert) return '';
  if (alert.publishedByName) {
    return alert.publishedByOrg ? `${alert.publishedByName} (${alert.publishedByOrg})` : alert.publishedByName;
  }
  if (alert.issuerRole === 'woreda') return alert.woreda ? `Woreda ${alert.woreda}` : 'Woreda Office';
  if (alert.issuerRole === 'subcity') return alert.subcity ? `${alert.subcity} Subcity` : 'Subcity Office';
  return 'Government';
};
