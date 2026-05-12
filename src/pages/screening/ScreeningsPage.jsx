// Screenings Page
//
// HR/Admin/Recruiter screen incoming applications. Each application
// gets one screening row (Pending → Pass / Fail) plus optional feedback.
// Only applications without an existing screening can have one created.

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

import { screeningsApi } from '../../api/screenings'
import { applicationsApi } from '../../api/applications'

import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Select from '../../components/common/Select'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import SearchBar from '../../components/common/SearchBar'

const RESULT_OPTIONS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Pass', label: 'Pass' },
  { value: 'Fail', label: 'Fail' },
]

export default function ScreeningsPage() {
  // ----- List + dropdown data -----
  const [screenings, setScreenings] = useState([])
  const [applications, setApplications] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // ----- Search -----
  const [searchText, setSearchText] = useState('')

  // ----- Modal state -----
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [screeningBeingEdited, setScreeningBeingEdited] = useState(null)
  const [screeningIdToDelete, setScreeningIdToDelete] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  // -----------------------------------------------------------------
  // API call: load screenings + applications in parallel. Applications
  // are needed so the "New Screening" modal can offer them in a dropdown.
  // -----------------------------------------------------------------
  const fetchScreenings = async () => {
    setIsLoading(true)
    try {
      const [screeningsResult, applicationsResult] = await Promise.allSettled([
        screeningsApi.getAll(),
        applicationsApi.getAll({ page: 1, pageSize: 100 }),
      ])

      if (screeningsResult.status === 'fulfilled') {
        const value = screeningsResult.value
        setScreenings(Array.isArray(value) ? value : [])
      }
      if (applicationsResult.status === 'fulfilled') {
        setApplications(applicationsResult.value?.data ?? [])
      }
    } catch {
      toast.error('Failed to load screenings')
    } finally {
      setIsLoading(false)
    }
  }

  // useEffect: load all data once on mount.
  useEffect(() => {
    fetchScreenings()
  }, [])

  // useEffect: pre-fill the form when opening edit, or use defaults
  // when opening create.
  useEffect(() => {
    if (screeningBeingEdited) {
      reset({
        applicationID: String(screeningBeingEdited.applicationID),
        result: screeningBeingEdited.result,
        feedback: screeningBeingEdited.feedback ?? '',
      })
    } else {
      reset({ result: 'Pending' })
    }
  }, [screeningBeingEdited, isCreateModalOpen, reset])

  // -----------------------------------------------------------------
  // Handler: open the "New Screening" modal.
  // -----------------------------------------------------------------
  const handleOpenCreateModal = () => {
    reset({ result: 'Pending' })
    setIsCreateModalOpen(true)
  }

  // -----------------------------------------------------------------
  // Form submit — handles both create and edit.
  // -----------------------------------------------------------------
  const handleFormSubmit = async (formData) => {
    setIsSaving(true)
    try {
      if (screeningBeingEdited) {
        // Edit: cannot change which application a screening belongs to.
        await screeningsApi.update(screeningBeingEdited.screeningID, {
          result: formData.result,
          feedback: formData.feedback,
        })
        toast.success('Screening updated')
        setScreeningBeingEdited(null)
      } else {
        await screeningsApi.create({
          applicationID: parseInt(formData.applicationID),
          result: formData.result,
          feedback: formData.feedback,
        })
        toast.success('Screening created')
        setIsCreateModalOpen(false)
      }

      fetchScreenings()
    } catch {
      toast.error('Failed to save screening')
    } finally {
      setIsSaving(false)
    }
  }

  // -----------------------------------------------------------------
  // Handler: delete a screening after the user confirms.
  // -----------------------------------------------------------------
  const handleDelete = async () => {
    if (!screeningIdToDelete) return

    setIsDeleting(true)
    try {
      await screeningsApi.remove(screeningIdToDelete)
      toast.success('Screening deleted')
      setScreeningIdToDelete(null)
      fetchScreenings()
    } catch {
      toast.error('Failed to delete screening')
    } finally {
      setIsDeleting(false)
    }
  }

  // Filter by candidate name or job title.
  const filteredScreenings = screenings.filter((screening) => {
    if (!searchText) return true
    const lowerSearch = searchText.toLowerCase()
    return (
      screening.candidateName?.toLowerCase().includes(lowerSearch) ||
      screening.jobTitle?.toLowerCase().includes(lowerSearch)
    )
  })

  // -----------------------------------------------------------------
  // Eligible applications for a NEW screening: status must be Submitted
  // or Reviewed, and they must not already have a screening row.
  // -----------------------------------------------------------------
  const eligibleApplicationOptions = applications
    .filter((application) => {
      const hasEligibleStatus = ['Submitted', 'Reviewed'].includes(
        application.status
      )
      if (!hasEligibleStatus) return false

      const alreadyScreened = screenings.some(
        (screening) => screening.applicationID === application.applicationID
      )
      return !alreadyScreened
    })
    .map((application) => {
      const candidateLabel = application.candidateName ?? 'Candidate'
      const jobLabel = application.jobTitle ?? `Job #${application.jobID}`
      return {
        value: application.applicationID,
        label: `${candidateLabel} — ${jobLabel} (${application.status})`,
      }
    })

  // -----------------------------------------------------------------
  // Render the create/edit form (used by both modals).
  // -----------------------------------------------------------------
  const renderScreeningForm = () => (
    <form className="space-y-4">
      {/* Application field only shown in Create mode */}
      {!screeningBeingEdited && (
        <Select
          label="Application"
          required
          placeholder="Select application"
          error={errors.applicationID?.message}
          options={eligibleApplicationOptions}
          {...register('applicationID', { required: 'Application is required' })}
        />
      )}

      <Select
        label="Result"
        required
        options={RESULT_OPTIONS}
        error={errors.result?.message}
        {...register('result', { required: true })}
      />

      <div>
        <label className="form-label">Feedback</label>
        <textarea className="input min-h-[80px]" {...register('feedback')} />
      </div>
    </form>
  )

  return (
    <div>
      <PageHeader
        title="Screening"
        subtitle="Review and screen job applications"
        actions={
          <Button
            leftIcon={<PlusIcon className="h-4 w-4" />}
            onClick={handleOpenCreateModal}
          >
            New Screening
          </Button>
        }
      />

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <SearchBar
            value={searchText}
            onChange={setSearchText}
            placeholder="Search by candidate or job…"
            className="w-80"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredScreenings.length === 0 ? (
          <EmptyState
            title="No screenings yet"
            description="Start screening applications."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-th">Candidate</th>
                  <th className="table-th">Job</th>
                  <th className="table-th">Result</th>
                  <th className="table-th">Feedback</th>
                  <th className="table-th">Date</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredScreenings.map((screening) => (
                  <tr key={screening.screeningID} className="hover:bg-gray-50">
                    <td className="table-td font-medium">
                      {screening.candidateName ??
                        `Application #${screening.applicationID}`}
                    </td>
                    <td className="table-td">{screening.jobTitle ?? '—'}</td>
                    <td className="table-td">
                      <StatusBadge status={screening.result} />
                    </td>
                    <td className="table-td text-gray-500 dark:text-slate-400 max-w-xs truncate">
                      {screening.feedback ?? '—'}
                    </td>
                    <td className="table-td text-gray-500 dark:text-slate-400">
                      {format(new Date(screening.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="table-td">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setScreeningBeingEdited(screening)}
                          className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg text-amber-500"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setScreeningIdToDelete(screening.screeningID)}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
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
        title="New Screening"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button loading={isSaving} onClick={handleSubmit(handleFormSubmit)}>
              Save
            </Button>
          </>
        }
      >
        {renderScreeningForm()}
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!screeningBeingEdited}
        onClose={() => setScreeningBeingEdited(null)}
        title="Edit Screening"
        footer={
          <>
            <Button variant="secondary" onClick={() => setScreeningBeingEdited(null)}>
              Cancel
            </Button>
            <Button loading={isSaving} onClick={handleSubmit(handleFormSubmit)}>
              Update
            </Button>
          </>
        }
      >
        {renderScreeningForm()}
      </Modal>

      <ConfirmDialog
        open={!!screeningIdToDelete}
        onClose={() => setScreeningIdToDelete(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </div>
  )
}
