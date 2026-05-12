// Employee Detail Page
//
// Three-column read-only view of one employee:
//   1. Profile card (name, position, manager, etc.)
//   2. Performance Reviews (most recent 5)
//   3. Career Plans
//
// The URL can be either /employees/:id (HR/Admin/Manager view) or
// /my-profile (Employee view). When :id is missing we look up the
// logged-in user's employee record via /employees/me.

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DocumentTextIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

import { employeesApi } from '../../api/employees'
import { performanceApi } from '../../api/performance'
import { careerPlansApi } from '../../api/careerPlans'
import { useAuth } from '../../hooks/useAuth'

import LoadingSpinner from '../../components/common/LoadingSpinner'
import StatusBadge from '../../components/common/StatusBadge'
import Button from '../../components/common/Button'

export default function EmployeeDetailPage() {
  const { id: routeEmployeeId } = useParams()
  const navigate = useNavigate()
  const { isEmployee } = useAuth()

  const [employee, setEmployee] = useState(null)
  const [reviews, setReviews] = useState([])
  const [careerPlans, setCareerPlans] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // -----------------------------------------------------------------
  // useEffect: load the employee record, then fetch their reviews
  // and career plans using the correct employeeID.
  //
  // If there's no :id in the URL we hit /employees/me — this avoids
  // the common UserID vs EmployeeID mix-up.
  // -----------------------------------------------------------------
  useEffect(() => {
    const fetchEmployeeProfile = async () => {
      setIsLoading(true)
      try {
        // 1. Resolve which employee we're showing.
        const employeeRecord = routeEmployeeId
          ? await employeesApi.getById(parseInt(routeEmployeeId))
          : await employeesApi.getMe()

        if (!employeeRecord) return
        setEmployee(employeeRecord)

        // 2. Fetch related data in parallel.
        const [reviewsResult, careerPlansResult] = await Promise.allSettled([
          performanceApi.getAll(employeeRecord.employeeID),
          careerPlansApi.getByEmployee(employeeRecord.employeeID),
        ])

        if (reviewsResult.status === 'fulfilled') {
          setReviews(reviewsResult.value)
        }
        if (careerPlansResult.status === 'fulfilled') {
          setCareerPlans(careerPlansResult.value)
        }
      } catch (error) {
        const status = error?.response?.status
        const message = error?.response?.data?.message
        toast.error(
          `Failed to load profile (${status ?? 'network error'}): ${message ?? ''}`
        )
        console.error('Failed to load employee profile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEmployeeProfile()
  }, [routeEmployeeId])

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-700 dark:text-slate-300 font-medium mb-2">
          Employee profile not found.
        </p>
        <p className="text-sm text-gray-400 dark:text-slate-500">
          Your employee record hasn't been set up yet. Please contact HR or
          your administrator.
        </p>
      </div>
    )
  }

  // First letter of the employee's name, used as a placeholder avatar.
  const avatarInitial = employee.name[0]

  // Where the "View Documents" button should take the user.
  const documentsPath = isEmployee()
    ? '/my-documents'
    : `/employees/${employee.employeeID}/documents`

  // Static profile fields shown in the left card.
  const profileFields = [
    { label: 'Department', value: employee.department },
    { label: 'Join Date', value: format(new Date(employee.joinDate), 'MMM d, yyyy') },
    { label: 'Manager', value: employee.managerName ?? 'N/A' },
    { label: 'Email', value: employee.email ?? 'N/A' },
  ]

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white mb-6"
      >
        <ArrowLeftIcon className="h-4 w-4" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="card p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
              <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {avatarInitial}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {employee.name}
            </h2>
            <p className="text-gray-500 dark:text-slate-400">
              {employee.position}
            </p>
            <StatusBadge status={employee.status} className="mt-2" />
          </div>

          <dl className="space-y-3 text-sm">
            {profileFields.map((field) => (
              <div
                key={field.label}
                className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2"
              >
                <dt className="text-gray-500 dark:text-slate-400">{field.label}</dt>
                <dd className="font-medium text-gray-900 dark:text-slate-100 text-right">
                  {field.value}
                </dd>
              </div>
            ))}
          </dl>

          <Button
            variant="secondary"
            className="w-full mt-5"
            leftIcon={<DocumentTextIcon className="h-4 w-4" />}
            onClick={() => navigate(documentsPath)}
          >
            View Documents
          </Button>
        </div>

        {/* Performance Reviews */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-4">
            Performance Reviews
          </h3>
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-slate-500">
              No reviews yet.
            </p>
          ) : (
            <div className="space-y-3">
              {reviews.slice(0, 5).map((review) => (
                <div
                  key={review.reviewID}
                  className="border border-gray-100 dark:border-gray-800 rounded-lg p-3"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">
                      {format(new Date(review.reviewDate), 'MMM yyyy')}
                    </span>
                    <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full font-medium">
                      ★ {review.rating}/5
                    </span>
                  </div>
                  {review.comments && (
                    <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2">
                      {review.comments}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Career Plans */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-4">
            Career Plans
          </h3>
          {careerPlans.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-slate-500">
              No career plans yet.
            </p>
          ) : (
            <div className="space-y-3">
              {careerPlans.map((plan) => (
                <div
                  key={plan.planID}
                  className="border border-gray-100 dark:border-gray-800 rounded-lg p-3"
                >
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                      {plan.title}
                    </p>
                    <StatusBadge status={plan.status} />
                  </div>
                  {plan.description && (
                    <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2">
                      {plan.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
