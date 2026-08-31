import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, ClipboardList, Calendar } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { getCategoryLabel } from '../../utils/categories';
const typeIcons = {
  infrastructure: Building2,
};

const typeRoutes = {
  infrastructure: '/infrastructure-reports',
};

export default function ReportCard({ report, type }) {
  const { t } = useTranslation();
  const Icon = typeIcons[type] || ClipboardList;
  const route = typeRoutes[type] || '/';

  const title = report.title;
  const subtitle = `${getCategoryLabel(report.category)} • ${report.region}`;
  const date = new Date(report.createdAt).toLocaleDateString();

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-2xl overflow-hidden shrink-0">
          {report.photos?.[0]
            ? <img src={report.photos[0]} alt="" className="w-full h-full object-cover" />
            : <Icon size={28} strokeWidth={2} className="text-gray-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-gray-800 truncate">{title}</p>
            <StatusBadge status={report.status} />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Calendar size={14} strokeWidth={2} className="text-gray-400" />{date}</p>
          {report.reportId && <p className="text-xs text-gray-400">{t('common.id')}: {report.reportId}</p>}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-600 line-clamp-2">{report.description}</p>
      </div>
      <div className="mt-4">
        <Link to={`${route}/${report._id}`} className="btn-primary text-sm py-1.5 px-4 inline-block">
          {t('common.viewDetails')}
        </Link>
      </div>
    </div>
  );
}
