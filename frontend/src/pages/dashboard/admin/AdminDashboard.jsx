import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Users, ClipboardList, BadgeDollarSign, FileText,
  FolderTree, Mail, BarChart3, History, Building2, MapPinned, Settings,
  UserCircle, LogOut,
} from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import AdminOverview from './AdminOverview';
import AdminUsers from './AdminUsers';
import AdminReports from './AdminReports';
import AdminNews from './AdminNews';
import AdminCategories from './AdminCategories';
import AdminActivity from './AdminActivity';
import AdminSettings from './AdminSettings';
import GovAnalytics from './AdminAnalytics';
import CitizenProfile from '../citizen/CitizenProfile';
import AdminCampaigns from './AdminCampaigns';
import AdminSubcityManagement from './AdminSubcityManagement';
import AdminLocationDeptManagement from './AdminLocationDeptManagement';
import AdminContactMessages from './AdminContactMessages';

export default function AdminDashboard() {
  const { t } = useTranslation();

  const navItems = [
    { path: '/dashboard/admin',              icon: LayoutDashboard, label: t('dashboard.overview') },
    { path: '/dashboard/admin/users',        icon: Users,           label: 'User Management' },
    { path: '/dashboard/admin/reports',      icon: ClipboardList,   label: t('dashboard.reportManagement') },
    { path: '/dashboard/admin/campaigns',    icon: BadgeDollarSign, label: 'Campaigns' },
    { path: '/dashboard/admin/news',         icon: FileText,        label: 'Platform Updates' },
    { path: '/dashboard/admin/categories',   icon: FolderTree,      label: t('dashboard.categoryManagement') },
    { path: '/dashboard/admin/contact-messages', icon: Mail,        label: 'Contact Messages' },
    { path: '/dashboard/admin/analytics',    icon: BarChart3,       label: t('dashboard.analyticsTitle') },
    { path: '/dashboard/admin/activity',     icon: History,         label: t('admin.activityLog') },
    { path: '/dashboard/admin/subcities',    icon: Building2,       label: 'Subcity Management' },
    { path: '/dashboard/admin/locations',    icon: MapPinned,       label: 'Location & Department Management' },
    { path: '/dashboard/admin/departments',  icon: Settings,        label: 'Settings' },
    { path: '/dashboard/admin/profile',      icon: UserCircle,      label: t('dashboard.profile') },
    { path: '/dashboard',                    icon: LogOut,          label: t('nav.logout'), action: 'logout' },
  ];

  return (
    <DashboardLayout navItems={navItems} title={t('dashboard.adminDashboard')} showSearch={false}>
      <Routes>
        <Route index element={<AdminOverview />} />
        <Route path="campaigns"  element={<AdminCampaigns />} />
        <Route path="users"      element={<AdminUsers />} />
        <Route path="reports"    element={<AdminReports />} />
        <Route path="activity"   element={<AdminActivity />} />
        <Route path="departments" element={<AdminSettings />} />
        <Route path="subcities"  element={<AdminSubcityManagement />} />
        <Route path="locations"  element={<AdminLocationDeptManagement />} />
        <Route path="news"       element={<AdminNews />} />
        <Route path="contact-messages" element={<AdminContactMessages />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="analytics"  element={<GovAnalytics />} />
        <Route path="profile"    element={<CitizenProfile />} />
        <Route path="*"          element={<Navigate to="/dashboard/admin" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
