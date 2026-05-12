// Audit Logs Page (Admin only)
//
// Read-only list of system activity — every create/update/delete/login
// captured by the backend. Useful for forensic / compliance review.

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

import { auditsApi } from '../../api/audits'

import PageHeader from '../../components/common/PageHeader'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import SearchBar from '../../components/common/SearchBar'

// Pill color for each common action type.
const ACTION_COLOR_CLASSES = {
  Create: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  Update: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  Delete: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  Login: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
}
const DEFAULT_ACTION_COLOR =
  'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchText, setSearchText] = useState('')

  // -----------------------------------------------------------------
  // useEffect: load the entire activity log once on mount.
  // (This endpoint is admin-only and already protected by routing.)
  // -----------------------------------------------------------------
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const logsList = await auditsApi.getLogs()
        setLogs(logsList)
      } catch {
        toast.error('Failed to load audit logs')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLogs()
  }, [])

  // Filter logs by action, entity type or user name.
  const filteredLogs = logs.filter((log) => {
    if (!searchText) return true
    const lowerSearch = searchText.toLowerCase()
    return (
      log.action.toLowerCase().includes(lowerSearch) ||
      log.entityType.toLowerCase().includes(lowerSearch) ||
      log.userName?.toLowerCase().includes(lowerSearch)
    )
  })

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        subtitle="System-wide activity log (Admin only)"
      />

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <SearchBar
            value={searchText}
            onChange={setSearchText}
            placeholder="Search by action, entity, or user…"
            className="w-80"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            title="No audit logs"
            description="No activity has been recorded yet."
          />
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
                {filteredLogs.map((log) => {
                  const actionColor =
                    ACTION_COLOR_CLASSES[log.action] ?? DEFAULT_ACTION_COLOR
                  const formattedTimestamp = format(
                    new Date(log.createdAt),
                    'MMM d, yyyy HH:mm'
                  )

                  return (
                    <tr key={log.auditLogID} className="hover:bg-gray-50">
                      <td className="table-td font-medium">
                        {log.userName ?? `User #${log.userID}`}
                      </td>
                      <td className="table-td">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${actionColor}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="table-td text-gray-500 dark:text-slate-400 max-w-xs truncate">
                        {log.description ?? '—'}
                      </td>
                      <td className="table-td text-gray-500 dark:text-slate-400 whitespace-nowrap">
                        {formattedTimestamp}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
