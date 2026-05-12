// Profile Page
//
// Read-only view of the currently logged-in user's account info.
// Pulls everything from the Redux auth slice via useAuth().

import { useAuth } from '../../hooks/useAuth'
import PageHeader from '../../components/common/PageHeader'

export default function ProfilePage() {
  const { user } = useAuth()

  // First letter of the user's name (used as a placeholder avatar).
  const avatarInitial = user?.name?.[0] ?? '?'

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Your account information" />
      <div className="card p-8 max-w-lg">
        <div className="flex items-center gap-5 mb-8">
          <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {avatarInitial}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name}</h2>
            <p className="text-gray-500 dark:text-slate-400 text-sm">{user?.email}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {user?.roles.map((r) => (
                <span key={r} className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">{r}</span>
              ))}
            </div>
          </div>
        </div>
        <dl className="space-y-4 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
            <dt className="text-gray-500 dark:text-slate-400">User ID</dt>
            <dd className="font-medium text-gray-900 dark:text-slate-100">#{user?.userId}</dd>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
            <dt className="text-gray-500 dark:text-slate-400">Email</dt>
            <dd className="font-medium text-gray-900 dark:text-slate-100">{user?.email}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-gray-500 dark:text-slate-400">Roles</dt>
            <dd>{user?.roles.join(', ')}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
