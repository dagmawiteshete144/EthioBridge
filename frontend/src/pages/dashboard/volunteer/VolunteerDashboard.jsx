import { Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Inbox, ClipboardList, FileText, UserCircle, Megaphone } from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import VolunteerOverview from './VolunteerOverview';
import VolunteerAvailableTasks from './VolunteerAvailableTasks';
import VolunteerAssignedTasks from './VolunteerAssignedTasks';
import VolunteerApplications from './VolunteerApplications';
import VolunteerAlerts from './VolunteerAlerts';
import VolunteerProfile from './VolunteerProfile';

export default function VolunteerDashboard() {
  const { t } = useTranslation();

  const navItems = [
    { path: '/dashboard/volunteer',            icon: LayoutDashboard, label: t('dashboard.overview') },
    { path: '/dashboard/volunteer/available',  icon: Inbox,           label: t('dashboard.availableTasks') },
    { path: '/dashboard/volunteer/tasks',      icon: ClipboardList,   label: t('dashboard.assignedTasks') },
    { path: '/dashboard/volunteer/applications', icon: FileText,      label: t('dashboard.myApplications') },
    { path: '/dashboard/volunteer/alerts',      icon: Megaphone,     label: t('dashboard.publicAlerts') },
    { path: '/dashboard/volunteer/profile',    icon: UserCircle,      label: t('dashboard.profile') },
  ];

  return (
    <DashboardLayout navItems={navItems} title={t('dashboard.volunteerDashboard')}>
      <Routes>
        <Route index element={<VolunteerOverview />} />
        <Route path="available" element={<VolunteerAvailableTasks />} />
        <Route path="tasks" element={<VolunteerAssignedTasks />} />
        <Route path="applications" element={<VolunteerApplications />} />
        <Route path="alerts" element={<VolunteerAlerts />} />
        <Route path="profile" element={<VolunteerProfile />} />
        <Route path="*" element={<Navigate to="/dashboard/volunteer" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
