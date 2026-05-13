// Interviews Page
//
// Schedule interviews for applications that have passed screening, and
// update the status of existing interviews (Scheduled → Completed →
// Passed/Failed). HR/Admin/Recruiter (MANAGE_INTERVIEWS) can edit and
// delete. Managers can be selected as interviewers.

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

import { interviewsApi } from '../../api/interviews'
import { applicationsApi } from '../../api/applications'
import { screeningsApi } from '../../api/screenings'
import { usersApi } from '../../api/users'
import { usePermissions } from '../../hooks/usePermissions'

import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import SearchBar from '../../components/common/SearchBar'

// Allowed next statuses for each current status. Used by the
// "Update Status" modal so the user only sees valid transitions.
const NEXT_STATUSES_BY_CURRENT = {
  Pending: [
    { value: 'Scheduled', label: 'Scheduled' },
    { value: 'Cancelled', label: 'Cancelled' },
  ],
  Scheduled: [
    { value: 'Completed', label: 'Completed' },
    { value: 'Passed', label: 'Passed' },
    { value: 'Failed', label: 'Failed' },
    { value: 'Cancelled', label: 'Cancelled' },
  ],
  Completed: [
    { value: 'Passed', label: 'Passed' },
    { value: 'Failed', label: 'Failed' },
  ],
  Passed: [],
  Failed: [],
  Cancelled: [],
}

export default function InterviewsPage() {
  const { can } = usePermissions()
  const canManageInterviews = can('MANAGE_INTERVIEWS')

  // ----- List + lookup data -----
  const [interviews, setInterviews] = useState([])
  const [applications, setApplications] = useState([])
  const [managers, setManagers] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // ----- Search -----
  const [searchText, setSearchText] = useState('')

  // ----- Modal state -----
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [interviewBeingUpdated, setInterviewBeingUpdated] = useState(null)
  const [interviewIdToDelete, setInterviewIdToDelete] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Two separate forms — one for scheduling and one for status updates.
  const {
    register: registerScheduleField,
    handleSubmit: handleScheduleSubmit,
    reset: resetScheduleForm,
    formState: { errors: scheduleErrors },
  } = useForm()

  const {
    register: registerStatusField,
    handleSubmit: handleStatusSubmit,
    reset: resetStatusForm,
  } = useForm()

  // -----------------------------------------------------------------
  // API call: load interviews, applications and the list of managers
  // (used as interviewer options) all in parallel.
  //
  // We also load screenings to know which applications have passed
  // screening — only those are eligible for an interview.
  // -----------------------------------------------------------------
  const fetchInitialData = async () => {
    setIsLoading(true)
    try {
      // Everyone with VIEW_INTERVIEWS can fetch the list.
      // The rest of the calls are only needed by users who can schedule
      // new interviews (Admin/HR/Recruiter). Managers don't have
      // permission to hit /users, /user-roles, or /screenings — so we
      // skip those fetches for them to avoid 403 toasts.
      const baseRequests = [interviewsApi.getAll()]
      const scheduleRequests = canManageInterviews
        ? [
            applicationsApi.getAll({ page: 1, pageSize: 100 }),
            usersApi.getAll(),
            usersApi.getUserRoles(),
            screeningsApi.getAll(),
          ]
        : []

      const results = await Promise.allSettled([
        ...baseRequests,
        ...scheduleRequests,
      ])

      const [interviewsResult, applicationsResult, allUsersResult, userRolesResult, screeningsResult] = results

      // 1. Interviews list
      if (interviewsResult.status === 'fulfilled') {
        const value = interviewsResult.value
        const list = Array.isArray(value) ? value : value?.data ?? []
        setInterviews(list)
      }

      if (!canManageInterviews) {
        // Managers don't need the scheduling lookups.
        return
      }

      // 2. Applications — annotate each with `_screeningPassed`
      //    so the schedule modal can filter the dropdown.
      if (applicationsResult?.status === 'fulfilled') {
        const applicationList = applicationsResult.value?.data ?? []

        // Build a Set of applicationIDs that have a passing screening.
        const passedScreeningIds = new Set()
        if (screeningsResult?.status === 'fulfilled') {
          const screenings = screeningsResult.value ?? []
          screenings.forEach((screening) => {
            if (screening.result === 'Pass') {
              passedScreeningIds.add(screening.applicationID)
            }
          })
        }

        const annotatedApplications = applicationList.map((application) => ({
          ...application,
          _screeningPassed: passedScreeningIds.has(application.applicationID),
        }))
        setApplications(annotatedApplications)
      }

      // 3. Filter users down to managers only (used as interviewers).
      //    We don't have a single "/managers" endpoint, so we join
      //    /users with /user-roles client-side.
      if (
        allUsersResult?.status === 'fulfilled' &&
        userRolesResult?.status === 'fulfilled'
      ) {
        const allUsers = allUsersResult.value ?? []
        const userRoles = userRolesResult.value ?? []

        const managerUserIds = new Set(
          userRoles
            .filter(
              (userRole) =>
                !userRole.isDeleted &&
                userRole.roleName?.toLowerCase() === 'manager'
            )
            .map((userRole) => userRole.userId)
        )

        const managerUsers = allUsers.filter((user) =>
          managerUserIds.has(user.userID)
        )
        setManagers(managerUsers)
      } else if (allUsersResult?.status === 'fulfilled') {
        // Fallback — if roles endpoint failed, show all users.
        setManagers(allUsersResult.value ?? [])
      }
    } catch {
      toast.error('Failed to load interviews')
    } finally {
      setIsLoading(false)
    }
  }

  // useEffect: load all data once on mount.
  useEffect(() => {
    fetchInitialData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // useEffect: when the user opens the "Update Status" modal, pre-fill
  // the form with the current status and any existing feedback.
  useEffect(() => {
    if (interviewBeingUpdated) {
      resetStatusForm({
        status: interviewBeingUpdated.status,
        feedback: interviewBeingUpdated.feedback ?? '',
      })
    }
  }, [interviewBeingUpdated, resetStatusForm])

  // -----------------------------------------------------------------
  // Handler: open the schedule modal (clears any previous values).
  // -----------------------------------------------------------------
  const handleOpenScheduleModal = () => {
    resetScheduleForm()
    setIsScheduleModalOpen(true)
  }

  // -----------------------------------------------------------------
  // Handler: submit the schedule form to create a new interview.
  // -----------------------------------------------------------------
  const handleScheduleInterview = async (formData) => {
    setIsSaving(true)
    try {
      await interviewsApi.schedule({
        applicationID: parseInt(formData.applicationID),
        date: formData.date,
        time: formData.time,
        location: formData.location,
        interviewerID: parseInt(formData.interviewerID),
      })
      toast.success('Interview scheduled')
      setIsScheduleModalOpen(false)
      resetScheduleForm()
      fetchInitialData()
    } catch {
      toast.error('Failed to schedule interview')
    } finally {
      setIsSaving(false)
    }
  }

  // -----------------------------------------------------------------
  // Handler: submit the status form to update an interview status.
  // -----------------------------------------------------------------
  const handleUpdateStatus = async (formData) => {
    if (!interviewBeingUpdated) return

    setIsSaving(true)
    try {
      await interviewsApi.updateStatus(interviewBeingUpdated.interviewID, {
        status: formData.status,
        feedback: formData.feedback,
      })
      toast.success('Status updated')
      setInterviewBeingUpdated(null)
      fetchInitialData()
    } catch {
      toast.error('Failed to update status')
    } finally {
      setIsSaving(false)
    }
  }

  // -----------------------------------------------------------------
  // Handler: delete an interview after the user confirms.
  // -----------------------------------------------------------------
  const handleDelete = async () => {
    if (!interviewIdToDelete) return

    setIsDeleting(true)
    try {
      await interviewsApi.remove(interviewIdToDelete)
      toast.success('Interview deleted')
      setInterviewIdToDelete(null)
      fetchInitialData()
    } catch {
      toast.error('Failed to delete interview')
    } finally {
      setIsDeleting(false)
    }
  }

  // -----------------------------------------------------------------
  // Filter the interviews list by the search box (candidate name,
  // job title, or interviewer name).
  // -----------------------------------------------------------------
  const filteredInterviews = interviews.filter((interview) => {
    if (!searchText) return true

    const lowerSearch = searchText.toLowerCase()
    return (
      interview.candidateName?.toLowerCase().includes(lowerSearch) ||
      interview.jobTitle?.toLowerCase().includes(lowerSearch) ||
      interview.interviewerName?.toLowerCase().includes(lowerSearch)
    )
  })

  // -----------------------------------------------------------------
  // Build the application dropdown options for the schedule modal.
  // Rules:
  //   1. Application must be in Submitted or Reviewed status.
  //   2. Application must have a passing screening.
  //   3. Application must not already have an active interview.
  // -----------------------------------------------------------------
  const eligibleApplicationOptions = applications
    .filter((application) => {
      const isOpen = application.status === 'Accepted'
      if (!isOpen) return false

      if (!application._screeningPassed) return false

      const hasActiveInterview = interviews.some(
        (interview) =>
          interview.applicationID === application.applicationID &&
          interview.status !== 'Cancelled'
      )
      return !hasActiveInterview
    })
    .map((application) => {
      const candidateLabel = application.candidateName ?? 'Candidate'
      const jobLabel = application.jobTitle ?? `Job #${application.jobID}`
      return {
        value: application.applicationID,
        label: `${candidateLabel} — ${jobLabel} (${application.status})`,
      }
    })

  // Interviewer dropdown options.
  const interviewerOptions = managers.map((manager) => ({
    value: manager.userID,
    label: `${manager.name} (${manager.email})`,
  }))

  // Available status options for the currently-edited interview.
  const currentStatus = interviewBeingUpdated?.status ?? ''
  const availableNextStatuses = NEXT_STATUSES_BY_CURRENT[currentStatus] ?? []
  const canUpdateStatus = availableNextStatuses.length > 0

  return (
    <div>
      <PageHeader
        title="Interviews"
        subtitle="Schedule and manage candidate interviews"
        actions={
          canManageInterviews && (
            <Button
              leftIcon={<PlusIcon className="h-4 w-4" />}
              onClick={handleOpenScheduleModal}
            >
              Schedule Interview
            </Button>
          )
        }
      />

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <SearchBar
            value={searchText}
            onChange={setSearchText}
            placeholder="Search interviews…"
            className="w-80"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredInterviews.length === 0 ? (
          <EmptyState
            title="No interviews scheduled"
            description="Schedule your first interview."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-th">Candidate</th>
                  <th className="table-th">Job</th>
                  <th className="table-th">Date & Time</th>
                  <th className="table-th">Location</th>
                  <th className="table-th">Interviewer</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInterviews.map((interview) => (
                  <tr key={interview.interviewID} className="hover:bg-gray-50">
                    <td className="table-td font-medium">
                      {interview.candidateName ?? `App #${interview.applicationID}`}
                    </td>
                    <td className="table-td">{interview.jobTitle ?? '—'}</td>
                    <td className="table-td text-gray-600 dark:text-slate-400">
                      {format(new Date(interview.date), 'MMM d, yyyy')} {interview.time}
                    </td>
                    <td className="table-td">{interview.location}</td>
                    <td className="table-td">
                      {interview.interviewerName ?? `User #${interview.interviewerID}`}
                    </td>
                    <td className="table-td">
                      <StatusBadge status={interview.status} />
                    </td>
                    <td className="table-td">
                      <div className="flex gap-2">
                        {canManageInterviews && (
                          <>
                            <button
                              onClick={() => setInterviewBeingUpdated(interview)}
                              className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg text-amber-500"
                              title="Update Status"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setInterviewIdToDelete(interview.interviewID)}
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500"
                              title="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      <Modal
        open={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Schedule Interview"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsScheduleModalOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={isSaving}
              onClick={handleScheduleSubmit(handleScheduleInterview)}
            >
              Schedule
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Select
            label="Application"
            required
            placeholder="Select application"
            error={scheduleErrors.applicationID?.message}
            options={eligibleApplicationOptions}
            {...registerScheduleField('applicationID', {
              required: 'Application is required',
            })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              required
              error={scheduleErrors.date?.message}
              {...registerScheduleField('date', { required: 'Date is required' })}
            />
            <Input
              label="Time"
              type="time"
              required
              error={scheduleErrors.time?.message}
              {...registerScheduleField('time', { required: 'Time is required' })}
            />
          </div>

          <Input
            label="Location / Link"
            required
            error={scheduleErrors.location?.message}
            {...registerScheduleField('location', {
              required: 'Location is required',
            })}
          />

          <Select
            label="Interviewer"
            required
            placeholder="Select interviewer"
            error={scheduleErrors.interviewerID?.message}
            options={interviewerOptions}
            {...registerScheduleField('interviewerID', {
              required: 'Interviewer is required',
            })}
          />
        </form>
      </Modal>

      {/* Update Status Modal */}
      <Modal
        open={!!interviewBeingUpdated}
        onClose={() => setInterviewBeingUpdated(null)}
        title="Update Interview Status"
        footer={
          <>
            <Button variant="secondary" onClick={() => setInterviewBeingUpdated(null)}>
              Cancel
            </Button>
            <Button
              loading={isSaving}
              onClick={handleStatusSubmit(handleUpdateStatus)}
              disabled={!canUpdateStatus}
            >
              Update
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          {interviewBeingUpdated && canUpdateStatus ? (
            <>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Current status:{' '}
                <span className="font-medium text-gray-700 dark:text-slate-300">
                  {interviewBeingUpdated.status}
                </span>
              </p>
              <Select
                label="New Status"
                options={availableNextStatuses}
                {...registerStatusField('status')}
              />
              <div>
                <label className="form-label">Feedback</label>
                <textarea
                  className="input min-h-[80px]"
                  {...registerStatusField('feedback')}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500 dark:text-slate-400 py-4 text-center">
              This interview is{' '}
              <strong>{interviewBeingUpdated?.status}</strong> and cannot be
              updated further.
            </p>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={!!interviewIdToDelete}
        onClose={() => setInterviewIdToDelete(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title="Delete Interview"
      />
    </div>
  )
}
