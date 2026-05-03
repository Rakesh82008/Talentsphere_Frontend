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

export default function Sidebar() {
  const { user } = useAuth()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.some((r) => user?.roles.includes(r))
  )

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white flex flex-col z-30">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-700">
        <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">TS</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white truncate">TalentSphere</p>
          <p className="text-xs text-gray-400 truncate">HR Management</p>
        </div>
      </div>

      {/* User info */}
      <div className="px-5 py-3 border-b border-gray-700">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Signed in as</p>
        <p className="text-sm font-medium text-white truncate">{user?.name}</p>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {user?.roles.map((r) => (
            <span
              key={r}
              className="inline-block px-1.5 py-0.5 rounded text-xs bg-blue-600/30 text-blue-300"
            >
              {r}
            </span>
          ))}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        <ul className="space-y-0.5">
          {visibleItems.map((item) => {
            const Icon = iconMap[item.icon] ?? HomeIcon
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    )
                  }
                >
                  <Icon className="h-4.5 w-4.5 flex-shrink-0 h-5 w-5" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <ArrowLeftOnRectangleIcon className="h-5 w-5 flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
