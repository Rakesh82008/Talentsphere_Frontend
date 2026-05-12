// Performance Reviews Page
//
// Two views depending on the user's role:
//   - Employee: sees only their own reviews (read-only).
//   - HR/Admin/Manager (MANAGE_REVIEWS): sees all reviews and can
//     create, edit and delete them.
//
// Each review captures a date, a 1-5 star rating, and free-text comments.

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

import { performanceApi } from '../../api/performance'
import { employeesApi } from '../../api/employees'
import { useAuth } from '../../hooks/useAuth'
import { usePermissions } from '../../hooks/usePermissions'

import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import SearchBar from '../../components/common/SearchBar'

// 1–5 rating dropdown options.
const RATING_OPTIONS = [1, 2, 3, 4, 5].map((number) => ({
  value: number,
  label: `${number} Star${number > 1 ? 's' : ''}`,
}))

// -------------------------------------------------------------------
// Small presentational component: ★★★★☆ rating display.
// -------------------------------------------------------------------
function RatingStars({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2, 3, 4].map((index) => {
        const isFilled = index < rating
        const starClassName = isFilled
          ? 'text-yellow-400'
          : 'text-gray-200 dark:text-gray-600'
        return (
          <span key={index} className={`text-base ${starClassName}`}>
            ★
          </span>
        )
      })}
      <span className="text-xs text-gray-500 dark:text-slate-400 ml-1">
        {rating}/5
      </span>
    </div>
  )
}

export default function PerformanceReviewsPage() {
  const { can } = usePermissions()
  const { isEmployee } = useAuth()

  const canManageReviews = can('MANAGE_REVIEWS')
  const viewingAsEmployee = isEmployee()

  // ----- List + dropdown data -----
  const [reviews, setReviews] = useState([])
  const [employees, setEmployees] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // ----- Search -----
  const [searchText, setSearchText] = useState('')

  // ----- Modal state -----
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [reviewBeingEdited, setReviewBeingEdited] = useState(null)
  const [reviewIdToDelete, setReviewIdToDelete] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  // -----------------------------------------------------------------
  // API call: load reviews + (for non-employees) the employee list
  // used in the create form's dropdown.
  // -----------------------------------------------------------------
  const fetchReviews = async () => {
    setIsLoading(true)
    try {
      if (viewingAsEmployee) {
        // Find the logged-in user's employee record so we only show
        // reviews for them.
        const myEmployee = await employeesApi.getMe().catch(() => null)
        const reviewsList = await performanceApi.getAll(myEmployee?.employeeID)
        setReviews(reviewsList)
      } else {
        const [reviewsResult, employeesResult] = await Promise.allSettled([
          performanceApi.getAll(undefined),
          employeesApi.getAll(),
        ])

        if (reviewsResult.status === 'fulfilled') {
          setReviews(reviewsResult.value)
        }
        if (employeesResult.status === 'fulfilled') {
          setEmployees(employeesResult.value)
        }
      }
    } catch {
      toast.error('Failed to load reviews')
    } finally {
      setIsLoading(false)
    }
  }

  // useEffect: load reviews once on mount.
  useEffect(() => {
    fetchReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // useEffect: pre-fill the form when opening edit, or use defaults
  // when opening create.
  useEffect(() => {
    if (reviewBeingEdited) {
      reset({
        employeeID: String(reviewBeingEdited.employeeID),
        // Server returns ISO datetime; <input type="date"> wants YYYY-MM-DD.
        reviewDate: reviewBeingEdited.reviewDate?.split('T')[0],
        rating: String(reviewBeingEdited.rating),
        comments: reviewBeingEdited.comments ?? '',
      })
    } else {
      reset({ rating: '3' })
    }
  }, [reviewBeingEdited, isCreateModalOpen, reset])

  // -----------------------------------------------------------------
  // Handler: open the "New Review" modal with a default 3-star rating.
  // -----------------------------------------------------------------
  const handleOpenCreateModal = () => {
    reset({ rating: '3' })
    setIsCreateModalOpen(true)
  }

  // -----------------------------------------------------------------
  // Form submit — handles both create and edit.
  // -----------------------------------------------------------------
  const handleFormSubmit = async (formData) => {
    setIsSaving(true)
    try {
      const sharedFields = {
        reviewDate: formData.reviewDate,
        rating: parseInt(formData.rating),
        comments: formData.comments,
      }

      if (reviewBeingEdited) {
        // Edit: you cannot change the employee on an existing review.
        await performanceApi.update(reviewBeingEdited.reviewID, sharedFields)
        toast.success('Review updated')
        setReviewBeingEdited(null)
      } else {
        await performanceApi.create({
          employeeID: parseInt(formData.employeeID),
          ...sharedFields,
        })
        toast.success('Review created')
        setIsCreateModalOpen(false)
      }

      fetchReviews()
    } catch {
      toast.error('Failed to save review')
    } finally {
      setIsSaving(false)
    }
  }

  // -----------------------------------------------------------------
  // Handler: delete a review after the user confirms.
  // -----------------------------------------------------------------
  const handleDelete = async () => {
    if (!reviewIdToDelete) return

    setIsDeleting(true)
    try {
      await performanceApi.remove(reviewIdToDelete)
      toast.success('Review deleted')
      setReviewIdToDelete(null)
      fetchReviews()
    } catch {
      toast.error('Failed to delete review')
    } finally {
      setIsDeleting(false)
    }
  }

  // Filter reviews by employee name (only matters for HR/Admin/Manager).
  const filteredReviews = reviews.filter((review) => {
    if (!searchText) return true
    return review.employeeName
      ?.toLowerCase()
      .includes(searchText.toLowerCase())
  })

  // Employee dropdown options for the create form.
  const employeeOptions = employees.map((employee) => ({
    value: employee.employeeID,
    label: employee.name,
  }))

  return (
    <div>
      <PageHeader
        title={viewingAsEmployee ? 'My Performance Reviews' : 'Performance Reviews'}
        subtitle="Track and manage employee performance evaluations"
        actions={
          canManageReviews && (
            <Button
              leftIcon={<PlusIcon className="h-4 w-4" />}
              onClick={handleOpenCreateModal}
            >
              New Review
            </Button>
          )
        }
      />

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <SearchBar
            value={searchText}
            onChange={setSearchText}
            placeholder="Search by employee name…"
            className="w-80"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredReviews.length === 0 ? (
          <EmptyState
            title="No reviews found"
            description="Create the first performance review."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {!viewingAsEmployee && <th className="table-th">Employee</th>}
                  <th className="table-th">Review Date</th>
                  <th className="table-th">Rating</th>
                  <th className="table-th">Comments</th>
                  {canManageReviews && <th className="table-th">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReviews.map((review) => (
                  <tr key={review.reviewID} className="hover:bg-gray-50">
                    {!viewingAsEmployee && (
                      <td className="table-td font-medium">
                        {review.employeeName ?? `Employee #${review.employeeID}`}
                      </td>
                    )}
                    <td className="table-td text-gray-600 dark:text-slate-400">
                      {format(new Date(review.reviewDate), 'MMM d, yyyy')}
                    </td>
                    <td className="table-td">
                      <RatingStars rating={review.rating} />
                    </td>
                    <td className="table-td text-gray-500 dark:text-slate-400 max-w-xs truncate">
                      {review.comments ?? '—'}
                    </td>
                    {canManageReviews && (
                      <td className="table-td">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setReviewBeingEdited(review)}
                            className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg text-amber-500"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setReviewIdToDelete(review.reviewID)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="New Performance Review"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button loading={isSaving} onClick={handleSubmit(handleFormSubmit)}>
              Create
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Select
            label="Employee"
            required
            placeholder="Select employee"
            error={errors.employeeID?.message}
            options={employeeOptions}
            {...register('employeeID', { required: 'Employee is required' })}
          />
          <Input
            label="Review Date"
            type="date"
            required
            error={errors.reviewDate?.message}
            {...register('reviewDate', { required: 'Date is required' })}
          />
          <Select label="Rating" options={RATING_OPTIONS} {...register('rating')} />
          <div>
            <label className="form-label">Comments</label>
            <textarea
              className="input min-h-[80px]"
              {...register('comments')}
            />
          </div>
        </form>
      </Modal>

      {/* Edit modal — employee field is omitted because it cannot change */}
      <Modal
        open={!!reviewBeingEdited}
        onClose={() => setReviewBeingEdited(null)}
        title="Edit Review"
        footer={
          <>
            <Button variant="secondary" onClick={() => setReviewBeingEdited(null)}>
              Cancel
            </Button>
            <Button loading={isSaving} onClick={handleSubmit(handleFormSubmit)}>
              Save
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input
            label="Review Date"
            type="date"
            required
            error={errors.reviewDate?.message}
            {...register('reviewDate', { required: 'Date is required' })}
          />
          <Select label="Rating" options={RATING_OPTIONS} {...register('rating')} />
          <div>
            <label className="form-label">Comments</label>
            <textarea
              className="input min-h-[80px]"
              {...register('comments')}
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!reviewIdToDelete}
        onClose={() => setReviewIdToDelete(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title="Delete Review"
      />
    </div>
  )
}
