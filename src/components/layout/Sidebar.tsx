import { NavLink, useNavigate } from 'react-router-dom'
import {
  HomeIcon,
  UserGroupIcon,
  UsersIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  StarIcon,
  MapIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
  ListBulletIcon,
  ChartBarIcon,
  BellIcon,
  UserCircleIcon,
  DocumentIcon,
  DocumentArrowUpIcon,
  ArrowLeftOnRectangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useAppDispatch } from '../../store'
import { logout } from '../../store/slices/authSlice'
import { useAuth } from '../../hooks/useAuth'
import { NAV_ITEMS } from '../../config/navigation'
import clsx from 'clsx'

const iconMap: Record<string, React.ElementType> = {
  HomeIcon,
  UserGroupIcon,
  UsersIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  StarIcon,
  MapIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
  ListBulletIcon,
  ChartBarIcon,
  BellIcon,
  UserCircleIcon,
  DocumentIcon,
  DocumentArrowUpIcon,
}

const PATH_GROUP: Record<string, string> = {
  '/': '_main',
  '/users': 'Administration',
  '/employees': 'Workforce',
  '/my-team': 'Workforce',
  '/my-profile': 'Workforce',
  '/my-documents': 'Workforce',
  '/jobs': 'Recruitment',
  '/applications': 'Recruitment',
  '/screenings': 'Recruitment',
  '/interviews': 'Recruitment',
  '/selections': 'Recruitment',
  '/performance-reviews': 'Performance',
  '/career-plans': 'Performance',
  '/trainings': 'Learning',
  '/enrollments': 'Learning',
  '/succession-plans': 'Learning',
  '/compliance': 'Compliance',
  '/audits': 'Compliance',
  '/audit-logs': 'Compliance',
  '/reports': 'Analytics',
  '/job-board': 'Candidate Portal',
  '/my-applications': 'Candidate Portal',
  '/my-resume': 'Candidate Portal',
  '/notifications': 'General',
}

const GROUP_ORDER = ['_main', 'Administration', 'Workforce', 'Recruitment', 'Performance', 'Learning', 'Compliance', 'Analytics', 'Candidate Portal', 'General']

interface Props {
  open: boolean
  onClose: () => void
}

function getInitials(name?: string) {
  if (!name) return 'U'
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

export default function Sidebar({ open, onClose }: Props) {
  const { user } = useAuth()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.some((r) => user?.roles.includes(r))
  )

  // Group items
  const grouped = GROUP_ORDER.reduce<Record<string, typeof visibleItems>>((acc, group) => {
    const items = visibleItems.filter((i) => (PATH_GROUP[i.path] ?? 'General') === group)
    if (items.length > 0) acc[group] = items
    return acc
  }, {})

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 h-screen w-[260px] z-30 flex flex-col',
        'bg-[#0f172a] text-white',
        'transition-transform duration-300 ease-in-out',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        'shadow-[1px_0_0_0_rgba(255,255,255,0.05)]'
      )}
    >
      {/* Brand header */}
      <div className="relative flex items-center justify-between px-5 py-5 border-b border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9 flex-shrink-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm tracking-tight">TS</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-emerald-400 rounded-full border-2 border-[#0f172a]" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">TalentSphere</p>
            <p className="text-[10px] text-slate-400 leading-tight mt-0.5">HR Platform</p>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          aria-label="Close sidebar"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      {/* User profile chip */}
      <div className="px-4 py-3.5 border-b border-white/[0.07]">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.05]">
          <div className="h-8 w-8 flex-shrink-0 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
            {getInitials(user?.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate leading-tight">{user?.name}</p>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {user?.roles.slice(0, 2).map((r) => (
                <span key={r} className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 leading-tight">
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 sidebar-nav">
        {Object.entries(grouped).map(([group, items]) => (
          <div key={group} className="mb-1">
            {group !== '_main' && (
              <p className="nav-section-label">{group}</p>
            )}
            <ul className="space-y-0.5">
              {items.map((item) => {
                const Icon = iconMap[item.icon] ?? HomeIcon
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      onClick={onClose}
                      className={({ isActive }) =>
                        clsx(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                          isActive
                            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/50'
                            : 'text-slate-400 hover:bg-white/[0.07] hover:text-slate-200'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon className={clsx('h-4.5 w-4.5 flex-shrink-0 h-[18px] w-[18px]', isActive ? 'text-white' : 'text-slate-500')} />
                          <span className="truncate">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-white/[0.07]">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-150"
        >
          <ArrowLeftOnRectangleIcon className="h-[18px] w-[18px] flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
