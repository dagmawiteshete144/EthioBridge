import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, ClipboardList, BadgeDollarSign, Megaphone,
  HandHelping, FileText, BadgeCheck, Building2, Newspaper, Bell, UserCircle, Settings,
  MessageSquareText, BarChart3,
} from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import WoredaOverview from './WoredaOverview';
import WoredaReports from './WoredaReports';
import WoredaAnalytics from './WoredaAnalytics';
import WoredaDepartments from './WoredaDepartments';
import WoredaNotifications from './WoredaNotifications';
import WoredaFeedback from './WoredaFeedback';
import CitizenProfile from '../citizen/CitizenProfile';
import WoredaSettings from './WoredaSettings';
import PublicAlertManager from '../../../components/common/PublicAlertManager';
import CampaignManager from '../shared/CampaignManager';
import SuccessStoryManager from '../../../components/common/SuccessStoryManager';
import AdminVolunteerTasks from '../shared/AdminVolunteerTasks';
import AdminVolunteerApplications from '../shared/AdminVolunteerApplications';
import AdminVolunteerCompletions from '../shared/AdminVolunteerCompletions';

export default function WoredaDashboard() {
  const { t } = useTranslation();
  const base = '/woreda/dashboard';

  const navItems = [
    { path: base,                  icon: LayoutDashboard, label: t('dashboard.overview') },
    { path: `${base}/reports`,     icon: ClipboardList,   label: 'Reports' },
    { path: `${base}/analytics`,   icon: BarChart3,       label: 'Reports & Analytics' },
    { path: `${base}/fundraising`, icon: BadgeDollarSign, label: 'Fundraising' },
    { path: `${base}/alerts`,      icon: Megaphone,       label: 'Public Alerts' },
    { path: `${base}/volunteer-tasks`, icon: HandHelping, label: t('dashboard.volunteerTasksAdmin') },
    { path: `${base}/volunteer-applications`, icon: FileText, label: t('dashboard.volunteerApplications') },
    { path: `${base}/volunteer-verifications`, icon: BadgeCheck, label: t('dashboard.completionVerification') },
    { path: `${base}/departments`, icon: Building2,       label: 'Departments' },
    { path: `${base}/feedback`,    icon: MessageSquareText, label: 'Feedback' },
    { path: `${base}/success-stories`, icon: Newspaper,   label: t('dashboard.successStoriesTitle') },
    { path: `${base}/notifications`, icon: Bell,          label: 'Notifications' },
    { path: `${base}/profile`,     icon: UserCircle,      label: t('dashboard.profile') },
    { path: `${base}/settings`,    icon: Settings,        label: t('dashboard.settings') },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Woreda Dashboard" showSearch={false}>
      <Routes>
        <Route index element={<WoredaOverview />} />
        <Route path="reports/*" element={<WoredaReports />} />
        <Route path="analytics" element={<WoredaAnalytics />} />
        <Route path="fundraising" element={<CampaignManager basePath={base} />} />
        <Route path="alerts" element={<PublicAlertManager />} />
        <Route path="volunteer-tasks" element={<AdminVolunteerTasks />} />
        <Route path="volunteer-applications" element={<AdminVolunteerApplications />} />
        <Route path="volunteer-verifications" element={<AdminVolunteerCompletions />} />
        <Route path="departments/*" element={<WoredaDepartments />} />
        <Route path="feedback" element={<WoredaFeedback />} />
        <Route path="success-stories" element={<SuccessStoryManager title={t('dashboard.successStoriesTitle')} />} />
        <Route path="notifications" element={<WoredaNotifications />} />
        <Route path="profile" element={<CitizenProfile />} />
        <Route path="settings" element={<WoredaSettings />} />
        <Route path="*" element={<Navigate to={base} replace />} />
      </Routes>
    </DashboardLayout>
  );
}
