// Selections Page
//
// HR/Admin makes final hiring decisions on candidates who passed
// their interview. Selecting a candidate auto-creates an Employee
// record and promotes the user's role from Candidate to Employee.

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

import { selectionsApi } from '../../api/selections'
import { applicationsApi } from '../../api/applications'
import { interviewsApi } from '../../api/interviews'
import { usePermissions } from '../../hooks/usePermissions'

import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Select from '../../components/common/Select'
import Modal from '../../components/common/Modal'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import SearchBar from '../../components/common/SearchBar'

const DECISION_OPTIONS = [
  { value: 'Selected', label: '✓ Selected — Create Employee' },
  { value: 'Rejected', label: '✗ Rejected — Notify Candidate' },
]

export default function SelectionsPage() {
  const { can } = usePermissions()
  const canManageSelections = can('MANAGE_SELECTIONS')

  // ----- List + dropdown data -----
  const [selections, setSelections] = useState([])
  const [eligibleApplications, setEligibleApplications] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // ----- Search + modal state -----
  const [searchText, setSearchText] = useState('')
  const [isDecideModalOpen, setIsDecideModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  // -----------------------------------------------------------------
  // API call: load selections, applications and interviews together.
  //
  // Eligible applications for a NEW decision must:
  //   - Have a Passed interview
  //   - NOT already have a selection decision
  // -----------------------------------------------------------------
  const fetchSelections = async () => {
    setIsLoading(true)
    try {
      const [selectionsResult, applicationsResult, interviewsResult] =
        await Promise.allSettled([
          selectionsApi.getDetailed(),
          applicationsApi.getAll({ page: 1, pageSize: 200 }),
          interviewsApi.getAll(),
        ])

      // 1. Selections list.
      const selectionsList = Array.isArray(selectionsResult.value)
        ? selectionsResult.value
        : []
      if (selectionsResult.status === 'fulfilled') {
        setSelections(selectionsList)
      }

      // 2. Build the "applications eligible for a decision" set.
      if (applicationsResult.status === 'fulfilled') {
        const allApplications = applicationsResult.value?.data ?? []

        const alreadyDecidedAppIds = new Set(
          selectionsList.map((selection) => selection.applicationID)
        )

        // Find applications that have a passed interview.
        const passedInterviewAppIds = new Set()
        if (interviewsResult.status === 'fulfilled') {
          const interviewsList = Array.isArray(interviewsResult.value)
            ? interviewsResult.value
            : []
          interviewsList.forEach((interview) => {
            if (interview.status === 'Passed') {
              passedInterviewAppIds.add(interview.applicationID)
            }
          })
        }

        const eligible = allApplications.filter((application) => {
          return (
            passedInterviewAppIds.has(application.applicationID) &&
            !alreadyDecidedAppIds.has(application.applicationID)
          )
        })
        setEligibleApplications(eligible)
      }
    } catch {
      toast.error('Failed to load selections')
    } finally {
      setIsLoading(false)
    }
  }

  // useEffect: load on mount.
  useEffect(() => {
    fetchSelections()
  }, [])

  // -----------------------------------------------------------------
  // Handler: open the "Make Decision" modal.
  // -----------------------------------------------------------------
  const handleOpenDecideModal = () => {
    reset({ decision: 'Selected' })
    setIsDecideModalOpen(true)
  }

  // -----------------------------------------------------------------
  // Handler: submit the decision.
  // -----------------------------------------------------------------
  const handleDecide = async (formData) => {
    setIsSaving(true)
    try {
      await selectionsApi.decide({
        applicationID: parseInt(formData.applicationID),
        decision: formData.decision,
        notes: formData.notes,
      })

      const successMessage =
        formData.decision === 'Selected'
          ? 'Candidate selected! Employee record created.'
          : 'Candidate rejected. Notification sent.'
      toast.success(successMessage)

      setIsDecideModalOpen(false)
      reset()
      fetchSelections()
    } catch {
      toast.error('Failed to make decision')
    } finally {
      setIsSaving(false)
    }
  }

  // Filter the selections list by candidate name or job title.
  const filteredSelections = selections.filter((selection) => {
    if (!searchText) return true
    const lowerSearch = searchText.toLowerCase()
    return (
      selection.candidateName?.toLowerCase().includes(lowerSearch) ||
      selection.jobTitle?.toLowerCase().includes(lowerSearch)
    )
  })

  // Application dropdown options for the decide modal.
  const applicationOptions = eligibleApplications.map((application) => {
    const candidateLabel = application.candidateName ?? 'Candidate'
    const jobLabel = application.jobTitle ?? `Job #${application.jobID}`
    return {
      value: application.applicationID,
      label: `${candidateLabel} — ${jobLabel}`,
    }
  })

  return (
    <div>
      <PageHeader
        title="Final Selections"
        subtitle="Make hiring decisions — selecting a candidate auto-creates an employee record"
        actions={
          canManageSelections && (
            <Button
              leftIcon={<PlusIcon className="h-4 w-4" />}
              onClick={handleOpenDecideModal}
            >
              Make Decision
            </Button>
          )
        }
      />

      <div className="mb-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
        <strong>Workflow:</strong> When you select a candidate, the system
        automatically creates an Employee record and promotes the user role
        from Candidate to Employee.
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <SearchBar
            value={searchText}
            onChange={setSearchText}
            placeholder="Search selections…"
            className="w-80"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredSelections.length === 0 ? (
          <EmptyState
            title="No selections yet"
            description="Make your first hiring decision."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-th">Candidate</th>
                  <th className="table-th">Job</th>
                  <th className="table-th">Decision</th>
                  <th className="table-th">Notes</th>
                  <th className="table-th">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSelections.map((selection) => {
                  const decisionDate = format(
                    new Date(selection.date || selection.createdAt),
                    'MMM d, yyyy'
                  )

                  return (
                    <tr key={selection.selectionID} className="hover:bg-gray-50">
                      <td className="table-td font-medium">
                        {selection.candidateName ??
                          `Application #${selection.applicationID}`}
                      </td>
                      <td className="table-td">{selection.jobTitle ?? '—'}</td>
                      <td className="table-td">
                        <StatusBadge status={selection.decision} />
                      </td>
                      <td className="table-td text-gray-500 dark:text-slate-400 max-w-xs truncate">
                        {selection.notes ?? '—'}
                      </td>
                      <td className="table-td text-gray-500 dark:text-slate-400">
                        {decisionDate}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Make Decision Modal */}
      <Modal
        open={isDecideModalOpen}
        onClose={() => setIsDecideModalOpen(false)}
        title="Make Selection Decision"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDecideModalOpen(false)}>
              Cancel
            </Button>
            <Button loading={isSaving} onClick={handleSubmit(handleDecide)}>
              Confirm Decision
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Select
            label="Application"
            required
            placeholder="Select application"
            error={errors.applicationID?.message}
            options={applicationOptions}
            {...register('applicationID', { required: 'Application is required' })}
          />
          <Select
            label="Decision"
            required
            options={DECISION_OPTIONS}
            error={errors.decision?.message}
            {...register('decision', { required: 'Decision is required' })}
          />
          <div>
            <label className="form-label">Notes</label>
            <textarea
              className="input min-h-[80px]"
              placeholder="Optional notes about the decision…"
              {...register('notes')}
            />
          </div>
        </form>
      </Modal>
    </div>
  )
}
