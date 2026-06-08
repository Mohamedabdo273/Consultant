import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard, GuestGuard, RoleGuard } from './components/common/Guards';
import AppLayout from './components/layout/AppLayout';

// Landing page
import LandingPage from './pages/landing/LandingPage';

// Auth pages
import LoginPage        from './pages/auth/LoginPage';
import RegisterPage     from './pages/auth/RegisterPage';
import ForgotPasswordPage  from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage   from './pages/auth/ResetPasswordPage';

// App pages
import DashboardPage    from './pages/dashboard/DashboardPage';
import ProjectsPage     from './pages/projects/ProjectsPage';
import ProjectDetailPage from './pages/projects/ProjectDetailPage';
import TasksPage        from './pages/tasks/TasksPage';
import InvoicesPage     from './pages/invoices/InvoicesPage';
import ContractsPage    from './pages/contracts/ContractsPage';
import ReportsPage      from './pages/reports/ReportsPage';
import TimeEntriesPage  from './pages/time/TimeEntriesPage';
import DocumentsPage    from './pages/documents/DocumentsPage';
import AnalysisPage       from './pages/analysis/AnalysisPage';
import AnalysisDetailPage from './pages/analysis/AnalysisDetailPage';
import ChatPage         from './pages/chat/ChatPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import ProfilePage      from './pages/profile/ProfilePage';
import SearchPage       from './pages/search/SearchPage';
import CompanyPage      from './pages/company/CompanyPage';
import AiDashboardPage  from './pages/ai-dashboard/AiDashboardPage';

// New Enterprise pages
import ClientPortalPage   from './pages/client/ClientPortalPage';
import MilestonesPage     from './pages/milestones/MilestonesPage';
import EmailTemplatesPage from './pages/settings/EmailTemplatesPage';

// New modules
import RisksPage                from './pages/risks/RisksPage';
import BusinessIntelligencePage from './pages/bi/BusinessIntelligencePage';
import CrmPage                  from './pages/crm/CrmPage';
import CashFlowPage             from './pages/cashflow/CashFlowPage';

// Admin pages
import CompaniesPage    from './pages/admin/CompaniesPage';
import UsersPage        from './pages/admin/UsersPage';

export default function App() {
  return (
    <Routes>
      {/* ── Public landing page ───────────────────────────── */}
      <Route path="/" element={<LandingPage />} />

      {/* ── Guest routes ──────────────────────────────────── */}
      <Route path="/login" element={
        <GuestGuard><LoginPage /></GuestGuard>
      } />
      <Route path="/register" element={
        <GuestGuard><RegisterPage /></GuestGuard>
      } />
      <Route path="/forgot-password" element={
        <GuestGuard><ForgotPasswordPage /></GuestGuard>
      } />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* ── Protected app routes ──────────────────────────── */}
      <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
        <Route path="/dashboard"      element={<DashboardPage />} />
        <Route path="/ai-dashboard"   element={<AiDashboardPage />} />
        <Route path="/projects"       element={<ProjectsPage />} />
        <Route path="/projects/:id"   element={<ProjectDetailPage />} />
        <Route path="/tasks"          element={<TasksPage />} />
        <Route path="/invoices"       element={<InvoicesPage />} />
        <Route path="/contracts"      element={<ContractsPage />} />
        <Route path="/reports"        element={<ReportsPage />} />
        <Route path="/time"           element={<TimeEntriesPage />} />
        <Route path="/documents"      element={<DocumentsPage />} />
        <Route path="/analysis"        element={<AnalysisPage />} />
        <Route path="/analysis/:id"   element={<AnalysisDetailPage />} />
        <Route path="/chat"           element={<ChatPage />} />
        <Route path="/notifications"  element={<NotificationsPage />} />
        <Route path="/profile"        element={<ProfilePage />} />
        <Route path="/search"         element={<SearchPage />} />
        <Route path="/company"        element={<CompanyPage />} />

        {/* ── New Module Routes ──────────────────────────── */}
        <Route path="/risks" element={<RisksPage />} />
        <Route path="/bi"    element={<BusinessIntelligencePage />} />
        <Route path="/crm"   element={
          <RoleGuard allowedRoles={['Admin','SuperAdmin']}>
            <CrmPage />
          </RoleGuard>
        } />
        <Route path="/cashflow" element={<CashFlowPage />} />

        {/* ── Enterprise Feature Routes ──────────────────── */}
        <Route path="/client-portal"    element={<ClientPortalPage />} />
        <Route path="/milestones"       element={<MilestonesPage />} />
        <Route path="/settings/email-templates" element={
          <RoleGuard allowedRoles={['Admin', 'SuperAdmin']}>
            <EmailTemplatesPage />
          </RoleGuard>
        } />

        {/* ── Admin-only routes ──────────────────────────── */}
        <Route path="/admin/companies" element={
          <RoleGuard allowedRoles={['SuperAdmin', 'Admin']}>
            <CompaniesPage />
          </RoleGuard>
        } />
        <Route path="/admin/users" element={
          <RoleGuard allowedRoles={['SuperAdmin', 'Admin']}>
            <UsersPage />
          </RoleGuard>
        } />
        <Route path="/admin/settings" element={
          <RoleGuard allowedRoles={['SuperAdmin', 'Admin']}>
            <CompaniesPage />
          </RoleGuard>
        } />
      </Route>

      {/* ── Fallback ─────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
