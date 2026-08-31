import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, ClipboardList, BadgeDollarSign, PlusCircle, Megaphone,
  HandHelping, FileText, BadgeCheck, Building2, MapPinned, Newspaper,
  Bell, UserCircle, Settings, BarChart3, MessageSquareText,
} from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import SubcityOverview from './SubcityOverview';
import SubcityReports from './SubcityReports';
import SubcityAnalytics from './SubcityAnalytics';
import SubcityDepartments from './SubcityDepartments';
import SubcityFeedback from './SubcityFeedback';
import SubcityNotifications from './SubcityNotifications';
import SubcityWoredas from './SubcityWoredas';
import SubcitySettings from './SubcitySettings';
import CitizenProfile from '../citizen/CitizenProfile';
import PublicAlertManager from '../../../components/common/PublicAlertManager';
import SubcityCampaigns from './SubcityCampaigns';
import CreateCampaign from '../shared/CreateCampaign';
import SuccessStoryManager from '../../../components/common/SuccessStoryManager';
import AdminVolunteerTasks from '../shared/AdminVolunteerTasks';
import AdminVolunteerApplications from '../shared/AdminVolunteerApplications';
import AdminVolunteerCompletions from '../shared/AdminVolunteerCompletions';

export default function SubcityDashboard({ subcity }) {
  const { t } = useTranslation();
  const location = useLocation();
  const base = location.pathname.split('/').slice(0, 4).join('/');

  const navItems = [
    { path: base,                    icon: LayoutDashboard, label: t('dashboard.overview') },
    { path: `${base}/reports`,       icon: ClipboardList,  label: 'Reports' },
    { path: `${base}/analytics`,     icon: BarChart3,      label: t('dashboard.analyticsTitle') },
    { path: `${base}/fundraising`,   icon: BadgeDollarSign, label: 'Fundraising' },
    { path: `${base}/create-campaign`, icon: PlusCircle,   label: 'Create Campaign' },
    { path: `${base}/alerts`,        icon: Megaphone,      label: 'Public Alerts' },
    { path: `${base}/volunteer-tasks`, icon: HandHelping,  label: t('dashboard.volunteerTasksAdmin') },
    { path: `${base}/volunteer-applications`, icon: FileText, label: t('dashboard.volunteerApplications') },
    { path: `${base}/volunteer-verifications`, icon: BadgeCheck, label: t('dashboard.completionVerification') },
    { path: `${base}/departments`,  icon: Building2,       label: 'Departments' },
    { path: `${base}/feedback`,     icon: MessageSquareText, label: 'Feedback' },
    { path: `${base}/woredas`,       icon: MapPinned,      label: 'Woredas' },
    { path: `${base}/success-stories`, icon: Newspaper,    label: t('dashboard.successStoriesTitle') },
    { path: `${base}/notifications`, icon: Bell,           label: 'Notifications' },
    { path: `${base}/profile`,       icon: UserCircle,     label: t('dashboard.profile') },
    { path: `${base}/settings`,      icon: Settings,       label: t('dashboard.settings') },
  ];

  return (
    <DashboardLayout navItems={navItems} title={`${subcity} Dashboard`} showSearch={false}>
      <Routes>
        <Route index element={<SubcityOverview subcity={subcity} />} />
        <Route path="reports" element={<SubcityReports subcity={subcity} />} />
        <Route path="analytics" element={<SubcityAnalytics subcity={subcity} />} />
        <Route path="fundraising" element={<SubcityCampaigns basePath={base} />} />
        <Route path="create-campaign" element={<CreateCampaign basePath={base} />} />
        <Route path="alerts" element={<PublicAlertManager />} />
        <Route path="volunteer-tasks" element={<AdminVolunteerTasks />} />
        <Route path="volunteer-applications" element={<AdminVolunteerApplications />} />
        <Route path="volunteer-verifications" element={<AdminVolunteerCompletions />} />
        <Route path="departments/*" element={<SubcityDepartments subcity={subcity} />} />
        <Route path="feedback" element={<SubcityFeedback />} />
        <Route path="woredas" element={<SubcityWoredas />} />
        <Route path="success-stories" element={<SuccessStoryManager title={t('dashboard.successStoriesTitle')} />} />
        <Route path="notifications" element={<SubcityNotifications />} />
        <Route path="profile" element={<CitizenProfile />} />
        <Route path="settings" element={<SubcitySettings />} />
        <Route path="*" element={<Navigate to={base} replace />} />
      </Routes>
    </DashboardLayout>
  );
}
