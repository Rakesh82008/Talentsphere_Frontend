import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UsersIcon, BriefcaseIcon, DocumentTextIcon, CalendarDaysIcon,
  StarIcon, AcademicCapIcon, ShieldCheckIcon, ChartBarIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../../hooks/useAuth'
import { jobsApi } from '../../api/jobs'
import { applicationsApi } from '../../api/applications'
import { employeesApi } from '../../api/employees'
import { interviewsApi } from '../../api/interviews'
import { trainingsApi } from '../../api/trainings'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import PageHeader from '../../components/common/PageHeader'

interface StatCard {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
  path?: string
}

export default function DashboardPage() {
  const { user, isAdmin, isHR, isRecruiter, isManager, isEmployee, isCandidate } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<StatCard[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        if (isAdmin() || isHR()) {
          const [employees, jobs, apps, interviews, trainings] = await Promise.allSettled([
            employeesApi.getAll(),
            jobsApi.getAll({ page: 1, pageSize: 1 }),
            applicationsApi.getAll({ page: 1, pageSize: 1 }),
            interviewsApi.getAll(),
            trainingsApi.getAll(),
          ])
          setStats([
            {
              label: 'Total Employees', icon: UsersIcon, color: 'bg-blue-500',
              value: employees.status === 'fulfilled' ? employees.value.length : '-',
              path: '/employees',
            },
            {
              label: 'Open Jobs', icon: BriefcaseIcon, color: 'bg-emerald-500',
              value: jobs.status === 'fulfilled' ? jobs.value.totalCount : '-',
              path: '/jobs',
            },
            {
              label: 'Applications', icon: DocumentTextIcon, color: 'bg-violet-500',
              value: apps.status === 'fulfilled' ? apps.value.totalCount : '-',
              path: '/applications',
            },
            {
              label: 'Interviews', icon: CalendarDaysIcon, color: 'bg-orange-500',
              value: interviews.status === 'fulfilled' ? interviews.value.length : '-',
              path: '/interviews',
            },
            {
              label: 'Active Trainings', icon: AcademicCapIcon, color: 'bg-pink-500',
              value: trainings.status === 'fulfilled'
                ? trainings.value.filter((t) => t.status === 'Active').length
                : '-',
              path: '/trainings',
            },
          ])
        } else if (isRecruiter()) {
          const [jobs, apps, interviews] = await Promise.allSettled([
            jobsApi.getAll({ page: 1, pageSize: 1 }),
            applicationsApi.getAll({ page: 1, pageSize: 1 }),
            interviewsApi.getAll(),
          ])
          setStats([
            { label: 'Open Jobs', icon: BriefcaseIcon, color: 'bg-emerald-500', value: jobs.status === 'fulfilled' ? jobs.value.totalCount : '-', path: '/jobs' },
            { label: 'Applications', icon: DocumentTextIcon, color: 'bg-violet-500', value: apps.status === 'fulfilled' ? apps.value.totalCount : '-', path: '/applications' },
            { label: 'Scheduled Interviews', icon: CalendarDaysIcon, color: 'bg-orange-500', value: interviews.status === 'fulfilled' ? interviews.value.filter((i) => i.status === 'Scheduled').length : '-', path: '/interviews' },
          ])
        } else if (isManager()) {
          const [employees, trainings] = await Promise.allSettled([
            employeesApi.getAll(),
            trainingsApi.getAll(),
          ])
          setStats([
            { label: 'Team Members', icon: UsersIcon, color: 'bg-blue-500', value: employees.status === 'fulfilled' ? employees.value.length : '-', path: '/my-team' },
            { label: 'Active Trainings', icon: AcademicCapIcon, color: 'bg-pink-500', value: trainings.status === 'fulfilled' ? trainings.value.filter((t) => t.status === 'Active').length : '-', path: '/trainings' },
            { label: 'Reports', icon: ChartBarIcon, color: 'bg-indigo-500', value: 'View', path: '/reports' },
          ])
        } else if (isEmployee()) {
          setStats([
            { label: 'My Profile', icon: UsersIcon, color: 'bg-blue-500', value: 'View', path: '/my-profile' },
            { label: 'Performance Reviews', icon: StarIcon, color: 'bg-yellow-500', value: 'View', path: '/performance-reviews' },
            { label: 'Career Plans', icon: ShieldCheckIcon, color: 'bg-green-500', value: 'View', path: '/career-plans' },
          ])
        } else if (isCandidate()) {
          const [jobs, apps] = await Promise.allSettled([
            jobsApi.getAll({ status: 'Open', page: 1, pageSize: 1 }),
            applicationsApi.getByCandidate(user?.userId ?? 0),
          ])
          setStats([
            { label: 'Open Positions', icon: BriefcaseIcon, color: 'bg-emerald-500', value: jobs.status === 'fulfilled' ? jobs.value.totalCount : '-', path: '/job-board' },
            { label: 'My Applications', icon: DocumentTextIcon, color: 'bg-violet-500', value: apps.status === 'fulfilled' ? apps.value.length : '-', path: '/my-applications' },
            { label: 'My Resume', icon: DocumentTextIcon, color: 'bg-blue-500', value: 'Manage', path: '/my-resume' },
          ])
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={`${greeting()}, ${user?.name?.split(' ')[0] ?? 'there'} 👋`}
        subtitle={`Welcome back to TalentSphere. Here's your overview.`}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <button
            key={s.label}
            onClick={() => s.path && navigate(s.path)}
            className="card p-5 text-left hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className={`${s.color} h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0`}>
                <s.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Role-specific hints */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.filter((s) => s.path).map((s) => (
            <button
              key={s.label + '-quick'}
              onClick={() => s.path && navigate(s.path)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
            >
              <div className={`${s.color} h-8 w-8 rounded-lg flex items-center justify-center`}>
                <s.icon className="h-4 w-4 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-700">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
