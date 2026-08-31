import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '../../../components/common/PageHeader';
import ThemeToggle from '../../../components/common/ThemeToggle';
import LanguageSelector from '../../../components/common/LanguageSelector';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-toastify';
import { Bell, ClipboardList, Globe, Megaphone, MessageSquare, Palette, Settings, UserRound } from 'lucide-react';

const PREFS_KEY = 'ethiobridge_notif_prefs';

const DEFAULT_PREFS = {
  reportUpdates: true,
  publicAlerts: true,
  feedbackResponses: true,
  systemUpdates: true,
};

const loadPrefs = () => {
  try {
    return { ...DEFAULT_PREFS, ...(JSON.parse(localStorage.getItem(PREFS_KEY)) || {}) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
};

const PREF_ITEMS = [
  { key: 'reportUpdates',      icon: ClipboardList, labelKey: 'settings.reportUpdates' },
  { key: 'publicAlerts',       icon: Megaphone, labelKey: 'settings.publicAlerts' },
  { key: 'feedbackResponses',  icon: MessageSquare, labelKey: 'settings.feedbackResponses' },
  { key: 'systemUpdates',      icon: Settings, labelKey: 'settings.systemUpdates' },
];

export default function CitizenSettings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [prefs, setPrefs] = useState(loadPrefs);

  const togglePref = (key) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    toast.success(t('settings.saved'));
  };

  const subcity = user?.subcity ? String(user.subcity).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : '—';
  const woreda = user?.woredaName || '—';

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title={t('settings.title')} />

      {/* Notification preferences */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1"><Bell size={20} strokeWidth={2} className="inline-block mr-1.5 align-[-3px]" />{t('settings.notificationsTitle')}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('settings.notificationsDesc')}</p>
        <div className="space-y-3">
          {PREF_ITEMS.map(item => {
            const PrefIcon = item.icon;
            return (
            <label key={item.key} className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <PrefIcon size={18} strokeWidth={2} className="text-gray-500 dark:text-gray-400" />
                {t(item.labelKey)}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={prefs[item.key]}
                onClick={() => togglePref(item.key)}
                className={`relative w-11 h-6 rounded-full transition-colors ${prefs[item.key] ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${prefs[item.key] ? 'translate-x-5' : ''}`}
                />
              </button>
            </label>
            );
          })}
        </div>
      </div>

      {/* Language & Appearance */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">
          <Globe size={20} strokeWidth={2} className="inline-block mr-1.5 align-[-3px]" />{t('settings.languageTitle')} &{' '}
          <Palette size={20} strokeWidth={2} className="inline-block mx-1.5 align-[-3px]" />{t('settings.themeTitle')}
        </h3>
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('settings.languageTitle')}</p>
            <LanguageSelector variant="dashboard" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('settings.themeTitle')}</p>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Account overview */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4"><UserRound size={20} strokeWidth={2} className="inline-block mr-1.5 align-[-3px]" />{t('settings.accountTitle')}</h3>
        <dl className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('dashboard.fullName')}</dt>
            <dd className="mt-1 font-medium text-gray-800 dark:text-gray-200">{user?.fullName || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('dashboard.emailLabel')}</dt>
            <dd className="mt-1 font-medium text-gray-800 dark:text-gray-200 truncate">{user?.email || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subcity</dt>
            <dd className="mt-1 font-medium text-gray-800 dark:text-gray-200">{subcity}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Woreda</dt>
            <dd className="mt-1 font-medium text-gray-800 dark:text-gray-200">{woreda}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('dashboard.phoneNumber')}</dt>
            <dd className="mt-1 font-medium text-gray-800 dark:text-gray-200">{user?.phone || '—'}</dd>
          </div>
        </dl>
        <div className="mt-5">
          <Link to="/dashboard/citizen/profile" className="btn-secondary text-sm">
            {t('settings.editProfile')}
          </Link>
        </div>
      </div>
    </div>
  );
}
