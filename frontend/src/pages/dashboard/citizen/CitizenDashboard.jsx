import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, PlusCircle, ClipboardList, Megaphone, Bell, UserCircle, MessageSquareText, Settings } from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import CitizenOverview from './CitizenOverview';
import CreateReport from './CreateReport';
import MyReports from './MyReports';
import PublicAlerts from './PublicAlerts';
import CitizenNotifications from './CitizenNotifications';
import CitizenProfile from './CitizenProfile';
import CitizenSettings from './CitizenSettings';
import CitizenFeedback from './CitizenFeedback';

export default function CitizenDashboard() {
  const { t } = useTranslation();

  const navItems = [
    { path: '/dashboard/citizen',                 icon: LayoutDashboard,   label: t('dashboard.overview') },
    { path: '/dashboard/citizen/create-report',   icon: PlusCircle,        label: t('dashboard.createReport') },
    { path: '/dashboard/citizen/my-reports',      icon: ClipboardList,     label: t('dashboard.myReports') },
    { path: '/dashboard/citizen/public-alerts',   icon: Megaphone,         label: t('publicAlerts.title') },
    { path: '/dashboard/citizen/feedback',        icon: MessageSquareText, label: 'Feedback' },
    { path: '/dashboard/citizen/notifications',   icon: Bell,              label: t('common.notifications') },
    { path: '/dashboard/citizen/profile',         icon: UserCircle,        label: t('dashboard.profile') },
    { path: '/dashboard/citizen/settings',        icon: Settings,          label: t('dashboard.settings') },
  ];

  return (
    <DashboardLayout navItems={navItems} title={t('dashboard.citizenDashboard')}>
      <Routes>
        <Route index element={<CitizenOverview />} />
        <Route path="create-report" element={<CreateReport />} />
        <Route path="my-reports" element={<MyReports />} />
        <Route path="public-alerts" element={<PublicAlerts />} />
        <Route path="feedback" element={<CitizenFeedback />} />
        <Route path="notifications" element={<CitizenNotifications />} />
        <Route path="profile" element={<CitizenProfile />} />
        <Route path="settings" element={<CitizenSettings />} />
        <Route path="*" element={<Navigate to="/dashboard/citizen" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
