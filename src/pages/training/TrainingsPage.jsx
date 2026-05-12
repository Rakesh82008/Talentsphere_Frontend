// Trainings Page
//
// Lists all training programs. HR/Admin (MANAGE_TRAININGS permission)
// can create new trainings, edit existing ones, delete them and see
// statistics across the company. Other roles only see the list.

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

import { trainingsApi } from '../../api/trainings'
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

// Dropdown options used both in the create/edit form and in the
// "filter by type" select at the top of the table.
const TRAINING_TYPE_OPTIONS = [
  { value: 'Mandatory', label: 'Mandatory' },
  { value: 'Onboarding', label: 'Onboarding' },
  { value: 'Technical', label: 'Technical' },
  { value: 'Leadership', label: 'Leadership' },
  { value: 'Certification', label: 'Certification' },
  { value: 'Other', label: 'Other' },
]

const DELIVERY_MODE_OPTIONS = [
  { value: 'InPerson', label: 'In Person (Classroom)' },
  { value: 'Online', label: 'Online / Self-Paced' },
  { value: 'Virtual', label: 'Virtual (Zoom/Teams)' },
  { value: 'OnJob', label: 'On-the-Job' },
  { value: 'Assessment', label: 'Assessment / Test' },
]

const STATUS_OPTIONS = [
  { value: 'Planned', label: 'Planned' },
  { value: 'Active', label: 'Active' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
]

// Default values used when opening the "New Training" modal.
const DEFAULT_FORM_VALUES = {
  trainingType: 'Technical',
  deliveryMode: 'Online',
  status: 'Planned',
}

// Find the human-readable label for a delivery mode code.
const getDeliveryModeLabel = (mode) => {
  const match = DELIVERY_MODE_OPTIONS.find((option) => option.value === mode)
  return match ? match.label : mode
}

export default function TrainingsPage() {
  const { can } = usePermissions()
  const canManageTrainings = can('MANAGE_TRAININGS')

  // ----- List state -----
  const [trainings, setTrainings] = useState([])
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // ----- Filter state (search + type dropdown) -----
  const [searchText, setSearchText] = useState('')
  const [filterType, setFilterType] = useState('')

  // ----- Modal / dialog state -----
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [trainingBeingEdited, setTrainingBeingEdited] = useState(null)
  const [trainingIdToDelete, setTrainingIdToDelete] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // React Hook Form for the create / edit form.
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm()

  // Watched so the form can conditionally show the link or location field.
  const selectedDeliveryMode = watch('deliveryMode')

  // -----------------------------------------------------------------
  // API call: load the list of trainings, and (for HR/Admin) the stats.
  // -----------------------------------------------------------------
  const fetchTrainings = async () => {
    setIsLoading(true)
    try {
      // Always load the training list.
      const trainingList = await trainingsApi.getAll()
      setTrainings(trainingList)

      // Only HR/Admin sees the dashboard-style stats.
      if (canManageTrainings) {
        try {
          const statsData = await trainingsApi.getStats()
          setStats(statsData)
        } catch {
          // Stats are optional — silently ignore if not allowed.
        }
      }
    } catch {
      toast.error('Failed to load trainings')
    } finally {
      setIsLoading(false)
    }
  }

  // useEffect: fetch trainings once when the page mounts.
  useEffect(() => {
    fetchTrainings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // -----------------------------------------------------------------
  // useEffect: whenever we open the form (create or edit), reset the
  // form fields. Edit pre-fills with the existing training's values;
  // create uses the empty defaults.
  // -----------------------------------------------------------------
  useEffect(() => {
    if (trainingBeingEdited) {
      reset({
        title: trainingBeingEdited.title,
        description: trainingBeingEdited.description ?? '',
        trainingType: trainingBeingEdited.trainingType,
        deliveryMode: trainingBeingEdited.deliveryMode,
        trainingLink: trainingBeingEdited.trainingLink ?? '',
        location: trainingBeingEdited.location ?? '',
        instructorName: trainingBeingEdited.instructorName ?? '',
        classStartTime: trainingBeingEdited.classStartTime ?? '',
        classEndTime: trainingBeingEdited.classEndTime ?? '',
        maxCapacity: trainingBeingEdited.maxCapacity?.toString() ?? '',
        // Server returns ISO dates; the <input type="date"> needs YYYY-MM-DD.
        startDate: trainingBeingEdited.startDate?.split('T')[0],
        endDate: trainingBeingEdited.endDate?.split('T')[0],
        status: trainingBeingEdited.status,
      })
    } else {
      reset(DEFAULT_FORM_VALUES)
    }
  }, [trainingBeingEdited, isCreateModalOpen, reset])

  // -----------------------------------------------------------------
  // Handler: open the "New Training" modal with fresh default values.
  // -----------------------------------------------------------------
  const handleOpenCreateModal = () => {
    reset(DEFAULT_FORM_VALUES)
    setIsCreateModalOpen(true)
  }

  // -----------------------------------------------------------------
  // Form submit handler — runs for BOTH create and edit because the
  // same <TrainingForm /> is rendered inside both modals.
  // -----------------------------------------------------------------
  const handleFormSubmit = async (formData) => {
    setIsSaving(true)
    try {
      // maxCapacity comes in as a string from the input; convert to int
      // or leave as undefined if the user left it blank.
      const payload = {
        ...formData,
        maxCapacity: formData.maxCapacity
          ? parseInt(formData.maxCapacity)
          : undefined,
      }

      if (trainingBeingEdited) {
        await trainingsApi.update(trainingBeingEdited.trainingID, payload)
        toast.success('Training updated')
        setTrainingBeingEdited(null)
      } else {
        await trainingsApi.create(payload)
        toast.success('Training created')
        setIsCreateModalOpen(false)
      }

      fetchTrainings()
    } catch {
      toast.error('Failed to save training')
    } finally {
      setIsSaving(false)
    }
  }

  // -----------------------------------------------------------------
  // Handler: delete a training after the user confirms in the dialog.
  // -----------------------------------------------------------------
  const handleDelete = async () => {
    if (!trainingIdToDelete) return

    setIsDeleting(true)
    try {
      await trainingsApi.remove(trainingIdToDelete)
      toast.success('Training deleted')
      setTrainingIdToDelete(null)
      fetchTrainings()
    } catch {
      toast.error('Failed to delete training')
    } finally {
      setIsDeleting(false)
    }
  }

  // -----------------------------------------------------------------
  // Apply the search-box and "type" filter to the trainings list.
  // -----------------------------------------------------------------
  const filteredTrainings = trainings.filter((training) => {
    const matchesSearch =
      !searchText ||
      training.title.toLowerCase().includes(searchText.toLowerCase())
    const matchesType = !filterType || training.trainingType === filterType
    return matchesSearch && matchesType
  })

  // Stat cards shown above the table for HR/Admin only.
  const statCards = stats
    ? [
        {
          label: 'Total Trainings',
          value: stats.totalTrainings,
          icon: <AcademicCapIcon className="h-5 w-5" />,
          color:
            'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30',
        },
        {
          label: 'Total Enrollments',
          value: stats.totalEnrollments,
          icon: <UserGroupIcon className="h-5 w-5" />,
          color:
            'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30',
        },
        {
          label: 'Completed',
          value: stats.completedEnrollments,
          icon: <CheckCircleIcon className="h-5 w-5" />,
          color:
            'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30',
        },
        {
          label: 'Overdue',
          value: stats.overdueEnrollments,
          icon: <ExclamationTriangleIcon className="h-5 w-5" />,
          color:
            'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30',
        },
      ]
    : []

  // -----------------------------------------------------------------
  // The create/edit form is rendered inside two different modals, so
  // we define it once here and reuse it.
  // -----------------------------------------------------------------
  const renderTrainingForm = () => (
    <form className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Training Title"
          required
          error={errors.title?.message}
          {...register('title', { required: 'Title is required' })}
        />
        <Select
          label="Training Type"
          required
          options={TRAINING_TYPE_OPTIONS}
          {...register('trainingType')}
        />
      </div>

      <div>
        <label className="form-label">Description</label>
        <textarea
          className="input min-h-[70px]"
          placeholder="What will employees learn?"
          {...register('description')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Delivery Mode"
          required
          options={DELIVERY_MODE_OPTIONS}
          {...register('deliveryMode')}
        />
        <Input
          label="Instructor / Trainer Name"
          placeholder="e.g. John Smith"
          {...register('instructorName')}
        />
      </div>

      {/* Show meeting link field for Online/Virtual deliveries */}
      {(selectedDeliveryMode === 'Online' ||
        selectedDeliveryMode === 'Virtual') && (
        <Input
          label="Meeting / Training Link"
          type="url"
          placeholder="https://zoom.us/j/... or https://udemy.com/course/..."
          {...register('trainingLink')}
        />
      )}

      {/* Show physical location field only for in-person trainings */}
      {selectedDeliveryMode === 'InPerson' && (
        <Input
          label="Location / Room"
          placeholder="e.g. Conference Room A, 3rd Floor"
          {...register('location')}
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input label="Class Start Time" type="time" {...register('classStartTime')} />
        <Input label="Class End Time" type="time" {...register('classEndTime')} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Start Date"
          type="date"
          required
          error={errors.startDate?.message}
          {...register('startDate', { required: 'Start date is required' })}
        />
        <Input
          label="End Date"
          type="date"
          required
          error={errors.endDate?.message}
          {...register('endDate', { required: 'End date is required' })}
        />
        <Input
          label="Max Capacity"
          type="number"
          placeholder="Leave blank for unlimited"
          {...register('maxCapacity')}
        />
      </div>

      <Select label="Status" options={STATUS_OPTIONS} {...register('status')} />
    </form>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trainings"
        subtitle="Manage training programs and track employee learning"
        actions={
          canManageTrainings && (
            <Button
              leftIcon={<PlusIcon className="h-4 w-4" />}
              onClick={handleOpenCreateModal}
            >
              New Training
            </Button>
          )
        }
      />

      {/* Stat cards — visible to HR/Admin only */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className="card p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.color}`}>{card.icon}</div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {card.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {card.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Overall completion progress bar — HR/Admin only */}
      {stats && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
              Overall Completion Rate
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {stats.completionRate}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        {/* Search + type filter */}
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-3">
          <SearchBar
            value={searchText}
            onChange={setSearchText}
            placeholder="Search trainings…"
            className="w-72"
          />
          <select
            className="input w-48"
            value={filterType}
            onChange={(event) => setFilterType(event.target.value)}
          >
            <option value="">All Types</option>
            {TRAINING_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredTrainings.length === 0 ? (
          <EmptyState
            title="No trainings"
            description="Create your first training program."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-th">Title</th>
                  <th className="table-th">Type</th>
                  <th className="table-th">Delivery</th>
                  <th className="table-th">Period</th>
                  <th className="table-th">Duration</th>
                  <th className="table-th">Status</th>
                  {canManageTrainings && <th className="table-th">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTrainings.map((training) => (
                  <tr key={training.trainingID} className="hover:bg-gray-50">
                    <td className="table-td">
                      <p className="font-medium text-gray-900 dark:text-slate-100">
                        {training.title}
                      </p>
                      {training.instructorName && (
                        <p className="text-xs text-gray-400 dark:text-slate-500">
                          👤 {training.instructorName}
                        </p>
                      )}
                      {training.location && (
                        <p className="text-xs text-gray-400 dark:text-slate-500">
                          📍 {training.location}
                        </p>
                      )}
                      {training.trainingLink && (
                        <a
                          href={training.trainingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-500 dark:text-blue-400 hover:underline"
                        >
                          🔗 Open Link
                        </a>
                      )}
                    </td>

                    <td className="table-td">
                      <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">
                        {training.trainingType}
                      </span>
                    </td>

                    <td className="table-td text-gray-600 dark:text-slate-400 text-sm">
                      {getDeliveryModeLabel(training.deliveryMode)}
                    </td>

                    <td className="table-td text-gray-500 dark:text-slate-400 text-xs whitespace-nowrap">
                      {format(new Date(training.startDate), 'MMM d')}
                      {' – '}
                      {format(new Date(training.endDate), 'MMM d, yyyy')}
                      {training.classStartTime && training.classEndTime && (
                        <p className="text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                          🕐 {training.classStartTime} – {training.classEndTime}
                        </p>
                      )}
                    </td>

                    <td className="table-td text-gray-500 dark:text-slate-400 text-sm">
                      {training.durationDays}d
                    </td>

                    <td className="table-td">
                      <StatusBadge status={training.status} />
                    </td>

                    {canManageTrainings && (
                      <td className="table-td">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setTrainingBeingEdited(training)}
                            className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg text-amber-500"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setTrainingIdToDelete(training.trainingID)}
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
        title="New Training"
        size="lg"
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
        {renderTrainingForm()}
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!trainingBeingEdited}
        onClose={() => setTrainingBeingEdited(null)}
        title="Edit Training"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTrainingBeingEdited(null)}>
              Cancel
            </Button>
            <Button loading={isSaving} onClick={handleSubmit(handleFormSubmit)}>
              Save
            </Button>
          </>
        }
      >
        {renderTrainingForm()}
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!trainingIdToDelete}
        onClose={() => setTrainingIdToDelete(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title="Delete Training"
      />
    </div>
  )
}
