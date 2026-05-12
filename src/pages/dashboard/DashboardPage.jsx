// Dashboard Page
//
// The first page users see after login. Shows a personalized greeting
// and a set of stat cards that vary based on the user's role:
//   - Admin / HR        → company-wide totals (employees, jobs, etc.)
//   - Recruiter         → jobs + applications + interviews
//   - Manager           → team + trainings + reports
//   - Employee          → profile + performance + career plans
//   - Candidate         → open positions + their applications + resume

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import {
  UsersIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  StarIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ArrowRightIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline'

import { useAuth } from '../../hooks/useAuth'
import { jobsApi } from '../../api/jobs'
import { applicationsApi } from '../../api/applications'
import { employeesApi } from '../../api/employees'
import { interviewsApi } from '../../api/interviews'
import { trainingsApi } from '../../api/trainings'

import { PageLoader } from '../../components/common/LoadingSpinner'

// Emoji shown next to the greeting, based on time of day.
const GREETING_EMOJI = {
  morning: '☀️',
  afternoon: '🌤️',
  evening: '🌙',
}

// -------------------------------------------------------------------
// Pick the right greeting text + emoji key for the current time.
// -------------------------------------------------------------------
const getGreeting = () => {
  const currentHour = new Date().getHours()
  if (currentHour < 12) return { text: 'Good morning', key: 'morning' }
  if (currentHour < 18) return { text: 'Good afternoon', key: 'afternoon' }
  return { text: 'Good evening', key: 'evening' }
}

// -------------------------------------------------------------------
// Helper: read .length / .totalCount from a Promise.allSettled result,
// or fall back to "—" if the call failed.
// -------------------------------------------------------------------
const getCount = (settledResult) => {
  if (settledResult.status !== 'fulfilled') return '—'
  const value = settledResult.value
  if (typeof value?.totalCount === 'number') return value.totalCount
  if (Array.isArray(value)) return value.length
  return '—'
}

const countByFilter = (settledResult, predicate) => {
  if (settledResult.status !== 'fulfilled') return '—'
  const value = settledResult.value
  if (!Array.isArray(value)) return '—'
  return value.filter(predicate).length
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const {
    user,
    isAdmin,
    isHR,
    isRecruiter,
    isManager,
    isEmployee,
    isCandidate,
  } = useAuth()

  const [statCards, setStatCards] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // -----------------------------------------------------------------
  // useEffect: load the role-appropriate stats once on mount.
  // Each role hits a different combination of endpoints — we resolve
  // them in parallel and then build the stat card array.
  // -----------------------------------------------------------------
  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (isAdmin() || isHR()) {
          const [employees, jobs, applications, interviews, trainings] =
            await Promise.allSettled([
              employeesApi.getAll(),
              jobsApi.getAll({ page: 1, pageSize: 1 }),
              applicationsApi.getAll({ page: 1, pageSize: 1 }),
              interviewsApi.getAll(),
              trainingsApi.getAll(),
            ])

          setStatCards([
            {
              label: 'Total Employees',
              icon: UsersIcon,
              gradient: 'from-blue-500 to-indigo-600',
              iconBg: 'bg-blue-500/10 dark:bg-blue-500/20',
              value: getCount(employees),
              path: '/employees',
              change: 'Workforce',
            },
            {
              label: 'Open Jobs',
              icon: BriefcaseIcon,
              gradient: 'from-emerald-500 to-teal-600',
              iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
              value: getCount(jobs),
              path: '/jobs',
              change: 'Active listings',
            },
            {
              label: 'Applications',
              icon: DocumentTextIcon,
              gradient: 'from-violet-500 to-purple-600',
              iconBg: 'bg-violet-500/10 dark:bg-violet-500/20',
              value: getCount(applications),
              path: '/applications',
              change: 'Total received',
            },
            {
              label: 'Interviews',
              icon: CalendarDaysIcon,
              gradient: 'from-orange-500 to-amber-600',
              iconBg: 'bg-orange-500/10 dark:bg-orange-500/20',
              value: getCount(interviews),
              path: '/interviews',
              change: 'Scheduled',
            },
            {
              label: 'Active Trainings',
              icon: AcademicCapIcon,
              gradient: 'from-pink-500 to-rose-600',
              iconBg: 'bg-pink-500/10 dark:bg-pink-500/20',
              value: countByFilter(trainings, (t) => t.status === 'Active'),
              path: '/trainings',
              change: 'In progress',
            },
          ])
        } else if (isRecruiter()) {
          const [jobs, applications, interviews] = await Promise.allSettled([
            jobsApi.getAll({ page: 1, pageSize: 1 }),
            applicationsApi.getAll({ page: 1, pageSize: 1 }),
            interviewsApi.getAll(),
          ])

          setStatCards([
            {
              label: 'Open Jobs',
              icon: BriefcaseIcon,
              gradient: 'from-emerald-500 to-teal-600',
              iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
              value: getCount(jobs),
              path: '/jobs',
              change: 'Active listings',
            },
            {
              label: 'Applications',
              icon: DocumentTextIcon,
              gradient: 'from-violet-500 to-purple-600',
              iconBg: 'bg-violet-500/10 dark:bg-violet-500/20',
              value: getCount(applications),
              path: '/applications',
              change: 'Total received',
            },
            {
              label: 'Scheduled Interviews',
              icon: CalendarDaysIcon,
              gradient: 'from-orange-500 to-amber-600',
              iconBg: 'bg-orange-500/10 dark:bg-orange-500/20',
              value: countByFilter(interviews, (i) => i.status === 'Scheduled'),
              path: '/interviews',
              change: 'This period',
            },
          ])
        } else if (isManager()) {
          const [employees, trainings] = await Promise.allSettled([
            employeesApi.getAll(),
            trainingsApi.getAll(),
          ])

          setStatCards([
            {
              label: 'Team Members',
              icon: UsersIcon,
              gradient: 'from-blue-500 to-indigo-600',
              iconBg: 'bg-blue-500/10 dark:bg-blue-500/20',
              value: getCount(employees),
              path: '/my-team',
              change: 'In your team',
            },
            {
              label: 'Active Trainings',
              icon: AcademicCapIcon,
              gradient: 'from-pink-500 to-rose-600',
              iconBg: 'bg-pink-500/10 dark:bg-pink-500/20',
              value: countByFilter(trainings, (t) => t.status === 'Active'),
              path: '/trainings',
              change: 'In progress',
            },
            {
              label: 'Reports',
              icon: ChartBarIcon,
              gradient: 'from-indigo-500 to-violet-600',
              iconBg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
              value: 'View',
              path: '/reports',
              change: 'Analytics',
            },
          ])
        } else if (isEmployee()) {
          // Employees see purely navigational cards (no counts needed).
          setStatCards([
            {
              label: 'My Profile',
              icon: UsersIcon,
              gradient: 'from-blue-500 to-indigo-600',
              iconBg: 'bg-blue-500/10 dark:bg-blue-500/20',
              value: 'View',
              path: '/my-profile',
              change: 'Personal info',
            },
            {
              label: 'Performance Reviews',
              icon: StarIcon,
              gradient: 'from-amber-500 to-yellow-600',
              iconBg: 'bg-amber-500/10 dark:bg-amber-500/20',
              value: 'View',
              path: '/performance-reviews',
              change: 'Your evaluations',
            },
            {
              label: 'Career Plans',
              icon: ShieldCheckIcon,
              gradient: 'from-emerald-500 to-teal-600',
              iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
              value: 'View',
              path: '/career-plans',
              change: 'Development path',
            },
          ])
        } else if (isCandidate()) {
          const [openJobs, myApplications] = await Promise.allSettled([
            jobsApi.getAll({ status: 'Open', page: 1, pageSize: 1 }),
            applicationsApi.getByCandidate(user?.userId ?? 0),
          ])

          setStatCards([
            {
              label: 'Open Positions',
              icon: BriefcaseIcon,
              gradient: 'from-emerald-500 to-teal-600',
              iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
              value: getCount(openJobs),
              path: '/job-board',
              change: 'Available now',
            },
            {
              label: 'My Applications',
              icon: DocumentTextIcon,
              gradient: 'from-violet-500 to-purple-600',
              iconBg: 'bg-violet-500/10 dark:bg-violet-500/20',
              value: getCount(myApplications),
              path: '/my-applications',
              change: 'Submitted',
            },
            {
              label: 'My Resume',
              icon: DocumentTextIcon,
              gradient: 'from-blue-500 to-indigo-600',
              iconBg: 'bg-blue-500/10 dark:bg-blue-500/20',
              value: 'Manage',
              path: '/my-resume',
              change: 'Keep it updated',
            },
          ])
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isLoading) return <PageLoader />

  const { text: greetingText, key: greetingKey } = getGreeting()
  const firstName = user?.name?.split(' ')[0] ?? 'there'

  // Quick-access cards are just the stat cards that have a path.
  const quickAccessCards = statCards.filter((card) => card.path)

  return (
    <div className="animate-slide-up">
      {/* Welcome header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{GREETING_EMOJI[greetingKey]}</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {greetingText}, {firstName}
          </h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm ml-9">
          Here's what's happening in TalentSphere today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mb-8">
        {statCards.map((card) => {
          const CardIcon = card.icon

          return (
            <button
              key={card.label}
              onClick={() => card.path && navigate(card.path)}
              className="group relative bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 p-5 text-left shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
            >
              {/* Decorative gradient blob shown on hover */}
              <div
                className={clsx(
                  'absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-y-8 translate-x-8 bg-gradient-to-br',
                  card.gradient
                )}
              />

              <div className="relative flex items-start justify-between mb-4">
                <div
                  className={clsx(
                    'h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-sm',
                    card.gradient
                  )}
                >
                  <CardIcon className="h-5 w-5 text-white" />
                </div>
                <ArrowTrendingUpIcon className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 transition-colors duration-200" />
              </div>

              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mb-0.5 leading-tight">
                  {card.value}
                </p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {card.label}
                </p>
                {card.change && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {card.change}
                  </p>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Quick navigation */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Quick Access
          </h2>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Navigate faster
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {quickAccessCards.map((card) => {
            const CardIcon = card.icon

            return (
              <button
                key={`${card.label}-quick`}
                onClick={() => navigate(card.path)}
                className="group flex flex-col items-center gap-3 p-4 rounded-xl border border-slate-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all duration-150 text-center"
              >
                <div
                  className={clsx(
                    'h-9 w-9 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-sm',
                    card.gradient
                  )}
                >
                  <CardIcon className="h-4.5 w-4.5 h-[18px] w-[18px] text-white" />
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-tight block">
                    {card.label}
                  </span>
                </div>
                <ArrowRightIcon className="h-3 w-3 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all duration-150" />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
