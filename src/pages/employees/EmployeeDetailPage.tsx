import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DocumentTextIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { employeesApi } from '../../api/employees'
import { performanceApi } from '../../api/performance'
import { careerPlansApi } from '../../api/careerPlans'
import type { EmployeeResponse, PerformanceReviewResponse, CareerPlanResponse } from '../../types'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import StatusBadge from '../../components/common/StatusBadge'
import Button from '../../components/common/Button'
import { format } from 'date-fns'

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isEmployee } = useAuth()
  const [employee, setEmployee] = useState<EmployeeResponse | null>(null)
  const [reviews, setReviews] = useState<PerformanceReviewResponse[]>([])
  const [careerPlans, setCareerPlans] = useState<CareerPlanResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        // If no URL id param, use /me to look up by JWT user ID (avoids UserID vs EmployeeID confusion)
        const emp = id
          ? await employeesApi.getById(parseInt(id))
          : await employeesApi.getMe()

        if (!emp) return
        setEmployee(emp)

        // Now use the correct EmployeeID for related data
        const [r, c] = await Promise.allSettled([
          performanceApi.getAll(emp.employeeID),
          careerPlansApi.getByEmployee(emp.employeeID),
        ])
        if (r.status === 'fulfilled') setReviews(r.value)
        if (c.status === 'fulfilled') setCareerPlans(c.value)
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number; data?: { message?: string } } })?.response?.status
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        toast.error(`Failed to load profile (${status ?? 'network error'}): ${msg ?? ''}`)
        console.error('getMe error:', err)
      }
      finally { setLoading(false) }
    }
    load()
  }, [id])

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
  if (!employee) return (
    <div className="text-center py-16">
      <p className="text-gray-700 dark:text-slate-300 font-medium mb-2">Employee profile not found.</p>
      <p className="text-sm text-gray-400 dark:text-slate-500">Your employee record hasn't been set up yet. Please contact HR or your administrator.</p>
    </div>
  )

  return (
    <div>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white mb-6">
        <ArrowLeftIcon className="h-4 w-4" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="card p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
              <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{employee.name[0]}</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{employee.name}</h2>
            <p className="text-gray-500 dark:text-slate-400">{employee.position}</p>
            <StatusBadge status={employee.status} className="mt-2" />
          </div>
          <dl className="space-y-3 text-sm">
            {[
              { label: 'Department', value: employee.department },
              { label: 'Join Date', value: format(new Date(employee.joinDate), 'MMM d, yyyy') },
              { label: 'Manager', value: employee.managerName ?? 'N/A' },
              { label: 'Email', value: employee.email ?? 'N/A' },
            ].map((f) => (
              <div key={f.label} className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                <dt className="text-gray-500 dark:text-slate-400">{f.label}</dt>
                <dd className="font-medium text-gray-900 dark:text-slate-100 text-right">{f.value}</dd>
              </div>
            ))}
          </dl>
          <Button
            variant="secondary"
            className="w-full mt-5"
            leftIcon={<DocumentTextIcon className="h-4 w-4" />}
            onClick={() => navigate(isEmployee() ? '/my-documents' : `/employees/${employee.employeeID}/documents`)}
          >
            View Documents
          </Button>
        </div>

        {/* Performance Reviews */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-4">Performance Reviews</h3>
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-slate-500">No reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {reviews.slice(0, 5).map((r) => (
                <div key={r.reviewID} className="border border-gray-100 dark:border-gray-800 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{format(new Date(r.reviewDate), 'MMM yyyy')}</span>
                    <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full font-medium">
                      ★ {r.rating}/5
                    </span>
                  </div>
                  {r.comments && <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2">{r.comments}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Career Plans */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-4">Career Plans</h3>
          {careerPlans.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-slate-500">No career plans yet.</p>
          ) : (
            <div className="space-y-3">
              {careerPlans.map((cp) => (
                <div key={cp.planID} className="border border-gray-100 dark:border-gray-800 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{cp.title}</p>
                    <StatusBadge status={cp.status} />
                  </div>
                  {cp.description && <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2">{cp.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
