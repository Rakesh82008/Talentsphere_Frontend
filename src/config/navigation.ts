import { ROLES } from './roles'

export interface NavItem {
  label: string
  path: string
  icon: string
  roles: string[]
  children?: NavItem[]
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/',
    icon: 'HomeIcon',
    roles: [ROLES.ADMIN, ROLES.HR, ROLES.RECRUITER, ROLES.MANAGER, ROLES.EMPLOYEE, ROLES.CANDIDATE],
  },
  // Admin
  {
    label: 'User Management',
    path: '/users',
    icon: 'UserGroupIcon',
    roles: [ROLES.ADMIN],
  },
  // Admin + HR
  {
    label: 'Employees',
    path: '/employees',
    icon: 'UsersIcon',
    roles: [ROLES.ADMIN, ROLES.HR],
  },
  // Manager
  {
    label: 'My Team',
    path: '/my-team',
    icon: 'UsersIcon',
    roles: [ROLES.MANAGER],
  },
  // Employee self-service
  {
    label: 'My Profile',
    path: '/my-profile',
    icon: 'UserCircleIcon',
    roles: [ROLES.EMPLOYEE],
  },
  {
    label: 'My Documents',
    path: '/my-documents',
    icon: 'DocumentIcon',
    roles: [ROLES.EMPLOYEE],
  },
  // Recruitment
  {
    label: 'Jobs',
    path: '/jobs',
    icon: 'BriefcaseIcon',
    roles: [ROLES.ADMIN, ROLES.HR, ROLES.RECRUITER],
  },
  {
    label: 'Applications',
    path: '/applications',
    icon: 'DocumentTextIcon',
    roles: [ROLES.ADMIN, ROLES.HR, ROLES.RECRUITER, ROLES.MANAGER],
  },
  {
    label: 'Screening',
    path: '/screenings',
    icon: 'MagnifyingGlassIcon',
    roles: [ROLES.ADMIN, ROLES.HR, ROLES.RECRUITER],
  },
  {
    label: 'Interviews',
    path: '/interviews',
    icon: 'CalendarDaysIcon',
    roles: [ROLES.ADMIN, ROLES.HR, ROLES.RECRUITER, ROLES.MANAGER],
  },
  {
    label: 'Selections',
    path: '/selections',
    icon: 'CheckBadgeIcon',
    roles: [ROLES.ADMIN, ROLES.HR],
  },
  // Performance
  {
    label: 'Performance Reviews',
    path: '/performance-reviews',
    icon: 'StarIcon',
    roles: [ROLES.ADMIN, ROLES.HR, ROLES.MANAGER, ROLES.EMPLOYEE],
  },
  {
    label: 'Career Plans',
    path: '/career-plans',
    icon: 'MapIcon',
    roles: [ROLES.ADMIN, ROLES.HR, ROLES.MANAGER, ROLES.EMPLOYEE],
  },
  // Training
  {
    label: 'Trainings',
    path: '/trainings',
    icon: 'AcademicCapIcon',
    roles: [ROLES.ADMIN, ROLES.HR, ROLES.MANAGER],
  },
  {
    label: 'Enrollments',
    path: '/enrollments',
    icon: 'ClipboardDocumentCheckIcon',
    roles: [ROLES.ADMIN, ROLES.HR, ROLES.MANAGER, ROLES.EMPLOYEE],
  },
  {
    label: 'Succession Plans',
    path: '/succession-plans',
    icon: 'ArrowPathIcon',
    roles: [ROLES.ADMIN, ROLES.HR, ROLES.MANAGER],
  },
  // Compliance & Audit
  {
    label: 'Compliance',
    path: '/compliance',
    icon: 'ShieldCheckIcon',
    roles: [ROLES.ADMIN, ROLES.HR],
  },
  {
    label: 'Audits',
    path: '/audits',
    icon: 'ClipboardDocumentListIcon',
    roles: [ROLES.ADMIN, ROLES.HR],
  },
  {
    label: 'Audit Logs',
    path: '/audit-logs',
    icon: 'ListBulletIcon',
    roles: [ROLES.ADMIN],
  },
  // Reports
  {
    label: 'Reports & Analytics',
    path: '/reports',
    icon: 'ChartBarIcon',
    roles: [ROLES.ADMIN, ROLES.HR, ROLES.MANAGER],
  },
  // Candidate
  {
    label: 'Job Board',
    path: '/job-board',
    icon: 'BriefcaseIcon',
    roles: [ROLES.CANDIDATE],
  },
  {
    label: 'My Applications',
    path: '/my-applications',
    icon: 'DocumentTextIcon',
    roles: [ROLES.CANDIDATE],
  },
  {
    label: 'My Resume',
    path: '/my-resume',
    icon: 'DocumentArrowUpIcon',
    roles: [ROLES.CANDIDATE],
  },
  // Shared
  {
    label: 'Notifications',
    path: '/notifications',
    icon: 'BellIcon',
    roles: [ROLES.ADMIN, ROLES.HR, ROLES.RECRUITER, ROLES.MANAGER, ROLES.EMPLOYEE, ROLES.CANDIDATE],
  },
]
