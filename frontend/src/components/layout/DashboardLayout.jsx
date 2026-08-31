import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { Menu, Search, LogOut } from 'lucide-react';
import AppIcon from '../../utils/iconMap.jsx';
import LanguageSelector from '../common/LanguageSelector';
import ThemeToggle from '../common/ThemeToggle';
import NotificationBell from '../common/NotificationBell';

const ROLE_LABELS = {
  citizen: 'Citizen',
  government: 'Government',
  ngo: 'NGO',
  volunteer: 'Volunteer',
  admin: 'Administrator',
  woreda: 'Woreda',
  department: 'Department',
  subcity: 'Sub-city',
  subcity_bole: 'Subcity - Bole',
  subcity_yeka: 'Subcity - Yeka',
  subcity_lemmi_kura: 'Subcity - Lemmi Kura',
};

const formatRole = (role) => {
  if (!role) return 'User';
  if (ROLE_LABELS[role]) return ROLE_LABELS[role];
  return role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

export default function DashboardLayout({ children, navItems, title, showSearch = true }) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success(t('toast.loggedOut'));
    navigate('/');
  };

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === path;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const renderIcon = (item) => {
    if (typeof item.icon === 'string') {
      return <AppIcon icon={item.icon} size={20} className="shrink-0" />;
    }
    const Icon = item.icon;
    return <Icon size={20} strokeWidth={2} className="shrink-0" />;
  };

  const renderNavItem = (item) => {
    const content = (
      <>
        {renderIcon(item)}
        <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
      </>
    );

    if (item.action === 'logout') {
      return (
        <button key={item.label} onClick={handleLogout} className="sidebar-link w-full">
          {content}
        </button>
      );
    }

    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => setSidebarOpen(false)}
        className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
      >
        {content}
      </Link>
    );
  };

  const avatarContent = user?.profileImage
    ? <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
    : (user?.fullName?.[0]?.toUpperCase() || 'A');

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-navy-900 flex transition-colors">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Fixed Left Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 z-50 bg-gradient-to-b from-[#12305F] to-[#0A1F45] flex flex-col transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-primary-900/40">E</div>
          <div className="min-w-0">
            <p className="font-bold text-white leading-tight truncate">EthioBridge</p>
            <p className="text-[11px] text-blue-200/80 leading-tight truncate">{formatRole(user?.role)} Portal</p>
          </div>
        </div>

        {/* Authenticated profile */}
        <div className="px-6 pt-4 pb-3 flex flex-col items-center gap-2 shrink-0">
          <div className="w-14 h-14 rounded-full bg-primary-600 ring-2 ring-white/15 flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0 shadow-md shadow-primary-900/30">
            {avatarContent}
          </div>
          <div className="min-w-0 w-full text-center leading-tight">
            <p className="text-sm font-semibold text-white truncate" title={user?.fullName}>{user?.fullName || formatRole(user?.role)}</p>
            <p className="text-[11px] text-blue-200/90 capitalize truncate">{formatRole(user?.role)}</p>
          </div>
        </div>

        {/* Thin divider */}
        <div className="mx-6 my-2 h-px bg-white/10 shrink-0" />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navItems.map(renderNavItem)}
        </nav>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden lg:ml-64">
        {/* Fixed Top Header */}
        <header className="sticky top-0 z-30 h-[72px] bg-white dark:bg-navy-800 border-b border-gray-200 dark:border-navy-600 px-4 sm:px-6 flex items-center justify-between gap-4 shadow-sm">
          {/* Left: menu toggle + page title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors text-gray-600 dark:text-navy-200 shrink-0"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-navy-100 truncate">{title}</h1>
          </div>

          {/* Center search bar */}
          {showSearch && (
            <div className="hidden md:flex flex-1 max-w-md mx-auto px-2">
              <div className="relative w-full">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('search.placeholder') || 'Search…'}
                  className="w-full bg-gray-50 dark:bg-navy-700 border border-gray-200 dark:border-navy-600 rounded-xl pl-9 pr-4 py-2 text-sm text-gray-700 dark:text-navy-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
          )}

          {/* Right: all header actions */}
          <div className="flex items-center justify-end gap-4 xl:gap-6 shrink-0">
            <NotificationBell />
            <ThemeToggle />
            <LanguageSelector variant="dashboard" />

            <div className="hidden sm:flex items-center gap-3 pl-4 ml-1 border-l border-gray-200 dark:border-navy-600">
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-300 text-sm font-bold overflow-hidden shrink-0">
                {avatarContent}
              </div>
              <div className="hidden lg:block leading-tight">
                <p className="text-sm font-medium text-gray-700 dark:text-navy-100 truncate max-w-[160px]">{user?.fullName}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">{formatRole(user?.role)}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors shrink-0"
              aria-label={t('nav.logout')}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Scrollable main content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-3 lg:p-4 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
