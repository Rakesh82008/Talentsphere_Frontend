import { useAuth } from '../../hooks/useAuth'
import PageHeader from '../../components/common/PageHeader'
import StatusBadge from '../../components/common/StatusBadge'

export default function ProfilePage() {
  const { user } = useAuth()

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Your account information" />
      <div className="card p-8 max-w-lg">
        <div className="flex items-center gap-5 mb-8">
          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-2xl font-bold text-blue-600">{user?.name?.[0] ?? '?'}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {user?.roles.map((r) => (
                <span key={r} className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{r}</span>
              ))}
            </div>
          </div>
        </div>
        <dl className="space-y-4 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <dt className="text-gray-500">User ID</dt>
            <dd className="font-medium text-gray-900">#{user?.userId}</dd>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <dt className="text-gray-500">Email</dt>
            <dd className="font-medium text-gray-900">{user?.email}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-gray-500">Roles</dt>
            <dd>{user?.roles.join(', ')}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
