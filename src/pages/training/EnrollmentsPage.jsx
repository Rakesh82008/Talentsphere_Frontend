// Enrollments Page
//
// Two modes depending on the logged-in user:
//   - Employee: sees "My Training" — read-only list of own enrollments.
//   - HR/Admin/Manager: sees all enrollments with options to enroll
//     employees in trainings, mark complete, and remove enrollments.

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  PlusIcon,
  CheckCircleIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

import { enrollmentsApi } from '../../api/enrollments'
import { trainingsApi } from '../../api/trainings'
import { employeesApi } from '../../api/employees'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'

import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Select from '../../components/common/Select'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'

// Small helper: render the "Overdue" red badge, or fall back to the
// standard status badge.
function EnrollmentStatusBadge({ enrollment }) {
  if (enrollment.isOverdue) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
        <ExclamationTriangleIcon className="h-3 w-3" /> Overdue
      </span>
    )
  }
  return <StatusBadge status={enrollment.status} />
}

export default function EnrollmentsPage() {
  const { can } = usePermissions()
  const { isEmployee } = useAuth()
  const canManageEnrollments = can('MANAGE_ENROLLMENTS')
  const viewingAsEmployee = isEmployee()

  // ----- List + dropdown data -----
  const [enrollments, setEnrollments] = useState([])
  const [trainings, setTrainings] = useState([])
  const [employees, setEmployees] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // ----- Modal state -----
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false)
  const [enrollmentIdToComplete, setEnrollmentIdToComplete] = useState(null)
  const [enrollmentIdToDelete, setEnrollmentIdToDelete] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Two separate React Hook Form instances: one for the enroll form
  // and one for the "mark complete" form.
  const enrollForm = useForm()
  const completeForm = useForm()

  // -----------------------------------------------------------------
  // API call: load enrollments + supporting data.
  // Employees only see their own enrollments. HR/Admin/Manager see
  // all enrollments and the full employee + training lists for the
  // "Enroll Employee" dropdown.
  // -----------------------------------------------------------------
  const fetchEnrollments = async () => {
    setIsLoading(true)
    try {
      if (viewingAsEmployee) {
        // 1. Find out who the logged-in employee is.
        const myEmployee = await employeesApi.getMe().catch(() => null)

        // 2. Load this employee's enrollments + all trainings (used
        //    for showing training details in each row).
        const [enrollmentsResult, trainingsResult] = await Promise.allSettled([
          myEmployee
            ? enrollmentsApi.getByEmployee(myEmployee.employeeID)
            : Promise.resolve([]),
          trainingsApi.getAll(),
        ])

        if (enrollmentsResult.status === 'fulfilled') {
          setEnrollments(enrollmentsResult.value)
        }
        if (trainingsResult.status === 'fulfilled') {
          setTrainings(trainingsResult.value)
        }
      } else {
        // HR/Admin/Manager — load everything.
        const [enrollmentsResult, trainingsResult, employeesResult] =
          await Promise.allSettled([
            enrollmentsApi.getAll(),
            trainingsApi.getAll(),
            employeesApi.getAll(),
          ])

        if (enrollmentsResult.status === 'fulfilled') {
          setEnrollments(enrollmentsResult.value)
        }
        if (trainingsResult.status === 'fulfilled') {
          setTrainings(trainingsResult.value)
        }
        if (employeesResult.status === 'fulfilled') {
          setEmployees(employeesResult.value)
        }
      }
    } catch {
      toast.error('Failed to load enrollments')
    } finally {
      setIsLoading(false)
    }
  }

  // useEffect: load enrollments once on mount.
  useEffect(() => {
    fetchEnrollments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // -----------------------------------------------------------------
  // Handler: open the "Enroll Employee" modal.
  // -----------------------------------------------------------------
  const handleOpenEnrollModal = () => {
    enrollForm.reset()
    setIsEnrollModalOpen(true)
  }

  // -----------------------------------------------------------------
  // Handler: submit the enroll form to create a new enrollment.
  // -----------------------------------------------------------------
  const handleEnroll = async (formData) => {
    setIsSaving(true)
    try {
      await enrollmentsApi.create({
        employeeID: parseInt(formData.employeeID),
        trainingID: parseInt(formData.trainingID),
      })
      toast.success('Enrolled successfully')
      setIsEnrollModalOpen(false)
      enrollForm.reset()
      fetchEnrollments()
    } catch {
      toast.error('Failed to enroll')
    } finally {
      setIsSaving(false)
    }
  }

  // -----------------------------------------------------------------
  // Handler: open the "Mark Complete" modal for a specific enrollment.
  // -----------------------------------------------------------------
  const handleOpenCompleteModal = (enrollmentId) => {
    completeForm.reset()
    setEnrollmentIdToComplete(enrollmentId)
  }

  // -----------------------------------------------------------------
  // Handler: submit the complete form. Score / notes / certificate
  // are all optional.
  // -----------------------------------------------------------------
  const handleMarkComplete = async (formData) => {
    if (!enrollmentIdToComplete) return

    setIsSaving(true)
    try {
      await enrollmentsApi.complete(enrollmentIdToComplete, {
        score: formData.score ? parseInt(formData.score) : undefined,
        notes: formData.notes || undefined,
        certificateUrl: formData.certificateUrl || undefined,
      })
      toast.success('Marked as completed')
      setEnrollmentIdToComplete(null)
      completeForm.reset()
      fetchEnrollments()
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ?? 'Failed to complete'
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  // -----------------------------------------------------------------
  // Handler: delete an enrollment after the user confirms.
  // -----------------------------------------------------------------
  const handleDelete = async () => {
    if (!enrollmentIdToDelete) return

    setIsDeleting(true)
    try {
      await enrollmentsApi.remove(enrollmentIdToDelete)
      toast.success('Enrollment removed')
      setEnrollmentIdToDelete(null)
      fetchEnrollments()
    } catch {
      toast.error('Failed to remove enrollment')
    } finally {
      setIsDeleting(false)
    }
  }

  // Dropdown options for the enroll modal.
  const employeeOptions = employees.map((employee) => ({
    value: employee.employeeID,
    label: employee.name,
  }))

  const trainingOptions = trainings.map((training) => ({
    value: training.trainingID,
    label: `${training.title} (${training.trainingType})`,
  }))

  return (
    <div>
      <PageHeader
        title={viewingAsEmployee ? 'My Training' : 'Enrollments'}
        subtitle="Track employee training progress and completion"
        actions={
          canManageEnrollments && (
            <Button
              leftIcon={<PlusIcon className="h-4 w-4" />}
              onClick={handleOpenEnrollModal}
            >
              Enroll Employee
            </Button>
          )
        }
      />

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : enrollments.length === 0 ? (
          <EmptyState
            title="No enrollments"
            description="Enroll employees in training programs to get started."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {!viewingAsEmployee && <th className="table-th">Employee</th>}
                  <th className="table-th">Training</th>
                  <th className="table-th">Type / Mode</th>
                  <th className="table-th">Enrolled</th>
                  <th className="table-th">Progress</th>
                  <th className="table-th">Status</th>
                  {!viewingAsEmployee && <th className="table-th">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {enrollments.map((enrollment) => {
                  // Derived flags for cleaner JSX below.
                  const isOnline =
                    enrollment.deliveryMode === 'Online' ||
                    enrollment.deliveryMode === 'Virtual'
                  const showJoinButton = isOnline && enrollment.trainingLink
                  const isOpenForCompletion =
                    enrollment.status !== 'Completed' &&
                    enrollment.status !== 'Cancelled'
                  const rowClassName = `hover:bg-gray-50 ${
                    enrollment.isOverdue ? 'bg-red-50/30 dark:bg-red-900/10' : ''
                  }`

                  return (
                    <tr key={enrollment.enrollmentID} className={rowClassName}>
                      {!viewingAsEmployee && (
                        <td className="table-td font-medium">
                          {enrollment.employeeName ?? `#${enrollment.employeeID}`}
                        </td>
                      )}

                      <td className="table-td">
                        <p className="font-medium text-gray-900 dark:text-slate-100">
                          {enrollment.trainingTitle ??
                            `Training #${enrollment.trainingID}`}
                        </p>

                        {enrollment.trainingStartDate &&
                          enrollment.trainingEndDate && (
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                              📅 {format(new Date(enrollment.trainingStartDate), 'MMM d')}
                              {' – '}
                              {format(new Date(enrollment.trainingEndDate), 'MMM d, yyyy')}
                            </p>
                          )}

                        {enrollment.classStartTime &&
                          enrollment.classEndTime && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                              🕐 {enrollment.classStartTime} – {enrollment.classEndTime}
                            </p>
                          )}

                        {showJoinButton && (
                          <a
                            href={enrollment.trainingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                          >
                            <VideoCameraIcon className="h-3 w-3" />
                            Join Training
                          </a>
                        )}
                      </td>

                      <td className="table-td">
                        {enrollment.trainingType && (
                          <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-full block w-fit mb-0.5">
                            {enrollment.trainingType}
                          </span>
                        )}
                        {enrollment.deliveryMode && (
                          <span className="text-xs text-gray-500 dark:text-slate-400">
                            {enrollment.deliveryMode}
                          </span>
                        )}
                      </td>

                      <td className="table-td text-gray-500 dark:text-slate-400 text-sm">
                        {format(new Date(enrollment.createdAt), 'MMM d, yyyy')}
                      </td>

                      <td className="table-td text-xs text-gray-500 dark:text-slate-400">
                        {/* Show one of: completed date, started date, or "Not started" */}
                        {enrollment.completedAt ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            ✓ {format(new Date(enrollment.completedAt), 'MMM d, yyyy')}
                          </span>
                        ) : enrollment.startedAt ? (
                          <span className="text-blue-600 dark:text-blue-400">
                            Started {format(new Date(enrollment.startedAt), 'MMM d')}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-slate-500">
                            Not started
                          </span>
                        )}

                        {enrollment.score != null && (
                          <p className="text-gray-700 dark:text-slate-300 font-medium">
                            Score: {enrollment.score}/100
                          </p>
                        )}
                      </td>

                      <td className="table-td">
                        <EnrollmentStatusBadge enrollment={enrollment} />
                      </td>

                      {!viewingAsEmployee && (
                        <td className="table-td">
                          <div className="flex gap-1.5">
                            {canManageEnrollments && isOpenForCompletion && (
                              <button
                                onClick={() =>
                                  handleOpenCompleteModal(enrollment.enrollmentID)
                                }
                                className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-500"
                                title="Mark Complete"
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                              </button>
                            )}

                            {canManageEnrollments && (
                              <button
                                onClick={() =>
                                  setEnrollmentIdToDelete(enrollment.enrollmentID)
                                }
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500"
                                title="Remove"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Enroll Modal */}
      <Modal
        open={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        title="Enroll Employee in Training"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEnrollModalOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={isSaving}
              onClick={enrollForm.handleSubmit(handleEnroll)}
            >
              Enroll
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Select
            label="Employee"
            required
            placeholder="Select employee"
            error={enrollForm.formState.errors.employeeID?.message}
            options={employeeOptions}
            {...enrollForm.register('employeeID', {
              required: 'Employee is required',
            })}
          />
          <Select
            label="Training Program"
            required
            placeholder="Select training"
            error={enrollForm.formState.errors.trainingID?.message}
            options={trainingOptions}
            {...enrollForm.register('trainingID', {
              required: 'Training is required',
            })}
          />
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Employee will be notified when enrolled.
          </p>
        </form>
      </Modal>

      {/* Mark Complete Modal */}
      <Modal
        open={!!enrollmentIdToComplete}
        onClose={() => setEnrollmentIdToComplete(null)}
        title="Mark Training Complete"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEnrollmentIdToComplete(null)}>
              Cancel
            </Button>
            <Button
              loading={isSaving}
              onClick={completeForm.handleSubmit(handleMarkComplete)}
            >
              Mark Complete
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input
            label="Score (0–100, optional)"
            type="number"
            placeholder="e.g. 85"
            {...completeForm.register('score')}
          />
          <div>
            <label className="form-label">Notes (optional)</label>
            <textarea
              className="input min-h-[70px]"
              placeholder="Any notes about the completion..."
              {...completeForm.register('notes')}
            />
          </div>
          <Input
            label="Certificate URL (optional)"
            type="url"
            placeholder="https://..."
            {...completeForm.register('certificateUrl')}
          />
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Employee will receive a completion notification.
          </p>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!enrollmentIdToDelete}
        onClose={() => setEnrollmentIdToDelete(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title="Remove Enrollment"
      />
    </div>
  )
}
