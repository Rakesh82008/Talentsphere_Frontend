import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from './store'
import { initializeAuth, refreshToken } from './store/slices/authSlice'
import { ROLES } from './config/roles'

import ProtectedRoute from './components/guards/ProtectedRoute'
import MainLayout from './components/layout/MainLayout'

import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import UnauthorizedPage from './pages/UnauthorizedPage'
import NotFoundPage from './pages/NotFoundPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import UsersPage from './pages/users/UsersPage'
import EmployeesPage from './pages/employees/EmployeesPage'
import EmployeeDetailPage from './pages/employees/EmployeeDetailPage'
import EmployeeDocumentsPage from './pages/employees/EmployeeDocumentsPage'
import JobsPage from './pages/recruitment/JobsPage'
import JobDetailPage from './pages/recruitment/JobDetailPage'
import ApplicationsPage from './pages/recruitment/ApplicationsPage'
import ScreeningsPage from './pages/screening/ScreeningsPage'
import InterviewsPage from './pages/interviews/InterviewsPage'
import SelectionsPage from './pages/selections/SelectionsPage'
import PerformanceReviewsPage from './pages/performance/PerformanceReviewsPage'
import CareerPlansPage from './pages/performance/CareerPlansPage'
import TrainingsPage from './pages/training/TrainingsPage'
import EnrollmentsPage from './pages/training/EnrollmentsPage'
import SuccessionPlansPage from './pages/training/SuccessionPlansPage'
import CompliancePage from './pages/compliance/CompliancePage'
import AuditsPage from './pages/audit/AuditsPage'
import AuditLogsPage from './pages/audit/AuditLogsPage'
import ReportsPage from './pages/reports/ReportsPage'
import NotificationsPage from './pages/notifications/NotificationsPage'
import JobBoardPage from './pages/candidate/JobBoardPage'
import MyApplicationsPage from './pages/candidate/MyApplicationsPage'
import ResumePage from './pages/candidate/ResumePage'
import ProfilePage from './pages/profile/ProfilePage'

export default function App() {
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)

  useEffect(() => {
    dispatch(initializeAuth())
  }, [dispatch])

  // Silently re-issue a fresh JWT with the current DB role on every app load.
  // This ensures role changes made by an admin take effect without requiring the user to re-enter their password.
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(refreshToken())
    }
  }, [isAuthenticated, dispatch])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login"        element={<LoginPage />} />
        <Route path="/register"     element={<RegisterPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* All authenticated */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/"              element={<DashboardPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/profile"       element={<ProfilePage />} />

            {/* Admin only */}
            <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
              <Route path="/users"      element={<UsersPage />} />
              <Route path="/audit-logs" element={<AuditLogsPage />} />
            </Route>

            {/* Admin + HR */}
            <Route element={<ProtectedRoute roles={[ROLES.ADMIN, ROLES.HR]} />}>
              <Route path="/employees"                    element={<EmployeesPage />} />
              <Route path="/employees/:id"                element={<EmployeeDetailPage />} />
              <Route path="/employees/:id/documents"      element={<EmployeeDocumentsPage />} />
              <Route path="/selections"                   element={<SelectionsPage />} />
              <Route path="/compliance"                   element={<CompliancePage />} />
              <Route path="/audits"                       element={<AuditsPage />} />
            </Route>

            {/* Job detail — all authenticated roles can view */}
            <Route element={<ProtectedRoute roles={[ROLES.ADMIN, ROLES.HR, ROLES.RECRUITER, ROLES.MANAGER, ROLES.EMPLOYEE, ROLES.CANDIDATE]} />}>
              <Route path="/jobs/:id" element={<JobDetailPage />} />
            </Route>

            {/* Admin + HR + Recruiter */}
            <Route element={<ProtectedRoute roles={[ROLES.ADMIN, ROLES.HR, ROLES.RECRUITER]} />}>
              <Route path="/jobs"       element={<JobsPage />} />
              <Route path="/screenings" element={<ScreeningsPage />} />
            </Route>

            {/* Admin + HR + Recruiter + Manager */}
            <Route element={<ProtectedRoute roles={[ROLES.ADMIN, ROLES.HR, ROLES.RECRUITER, ROLES.MANAGER]} />}>
              <Route path="/applications" element={<ApplicationsPage />} />
              <Route path="/interviews"   element={<InterviewsPage />} />
            </Route>

            {/* Admin + HR + Manager + Employee */}
            <Route element={<ProtectedRoute roles={[ROLES.ADMIN, ROLES.HR, ROLES.MANAGER, ROLES.EMPLOYEE]} />}>
              <Route path="/performance-reviews" element={<PerformanceReviewsPage />} />
              <Route path="/career-plans"        element={<CareerPlansPage />} />
              <Route path="/trainings"           element={<TrainingsPage />} />
              <Route path="/enrollments"         element={<EnrollmentsPage />} />
            </Route>

            {/* Admin + HR + Manager */}
            <Route element={<ProtectedRoute roles={[ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]} />}>
              <Route path="/succession-plans"    element={<SuccessionPlansPage />} />
              <Route path="/reports"             element={<ReportsPage />} />
            </Route>

            {/* Manager – see own team */}
            <Route element={<ProtectedRoute roles={[ROLES.MANAGER]} />}>
              <Route path="/my-team" element={<EmployeesPage />} />
            </Route>

            {/* Employee self-service */}
            <Route element={<ProtectedRoute roles={[ROLES.EMPLOYEE]} />}>
              <Route path="/my-profile"   element={<EmployeeDetailPage />} />
              <Route path="/my-documents" element={<EmployeeDocumentsPage />} />
            </Route>

            {/* Candidate */}
            <Route element={<ProtectedRoute roles={[ROLES.CANDIDATE]} />}>
              <Route path="/job-board"       element={<JobBoardPage />} />
              <Route path="/my-applications" element={<MyApplicationsPage />} />
              <Route path="/my-resume"       element={<ResumePage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
