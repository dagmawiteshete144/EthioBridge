import { useTranslation } from 'react-i18next';
import NewsManager from '../../../components/common/NewsManager';

export default function AdminNews() {
  const { t } = useTranslation();
  return (
    <NewsManager
      category="Platform Updates"
      filterCategory=""
      title={t('dashboard.platformNewsTitle')}
      canPublish
      canDelete
    />
  );
}
