import { useTranslation } from 'react-i18next';
import AppIcon from '../../utils/iconMap.jsx';

// icon accepts a semantic name (e.g. "inbox"), a lucide component, or a
// legacy emoji — resolved through the central icon system.
export default function EmptyState({ icon = 'empty', title, description, children }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AppIcon icon={icon} size={40} className="mb-4 text-gray-300 dark:text-gray-600" />
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">{title || t('common.noResults')}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">{description || t('common.nothingToShow')}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
