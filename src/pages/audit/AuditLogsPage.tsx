import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { auditsApi } from '../../api/audits'
import type { AuditLogResponse } from '../../types'
import PageHeader from '../../components/common/PageHeader'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import SearchBar from '../../components/common/SearchBar'
import { format } from 'date-fns'

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    auditsApi.getLogs()
      .then(setLogs)
      .catch(() => toast.error('Failed to load audit logs'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = logs.filter((l) =>
    !search ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.entityType.toLowerCase().includes(search.toLowerCase()) ||
    l.userName?.toLowerCase().includes(search.toLowerCase())
  )

  const actionColors: Record<string, string> = {
    Create: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    Update: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    Delete: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    Login:  'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  }

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="System-wide activity log (Admin only)" />

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by action, entity, or user…" className="w-80" />
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No audit logs" description="No activity has been recorded yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-th">User</th>
                  <th className="table-th">Action</th>
                  <th className="table-th">Description</th>
                  <th className="table-th">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((l) => (
                  <tr key={l.auditLogID} className="hover:bg-gray-50">
                    <td className="table-td font-medium">{l.userName ?? `User #${l.userID}`}</td>
                    <td className="table-td">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${actionColors[l.action] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'}`}>{l.action}</span>
                    </td>
                    <td className="table-td text-gray-500 dark:text-slate-400 max-w-xs truncate">{l.description ?? '—'}</td>
                    <td className="table-td text-gray-500 dark:text-slate-400 whitespace-nowrap">{format(new Date(l.createdAt), 'MMM d, yyyy HH:mm')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
