import { Link } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';

export default function DashboardNotFound({ basePath, title = 'Page not found' }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 sm:py-24 px-4">
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-3xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
          <Compass className="w-12 h-12 text-primary-500 dark:text-primary-400" strokeWidth={2} />
        </div>
        <span className="absolute -top-2 -right-2 text-5xl font-black text-gray-200 dark:text-gray-700 select-none">404</span>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
        The page you are looking for does not exist or may have been moved. Check the sidebar for available sections.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {basePath && (
          <Link to={basePath} className="btn-primary inline-flex items-center gap-2 py-2.5 px-6">
            <ArrowLeft className="w-4 h-4" strokeWidth={2} /> Back to Dashboard
          </Link>
        )}
        <Link to="/" className="btn-secondary inline-flex items-center gap-2 py-2.5 px-6">
          <Home className="w-4 h-4" strokeWidth={2} /> Back to Home
        </Link>
      </div>
    </div>
  );
}
