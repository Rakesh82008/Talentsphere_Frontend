// Career Plans Page
//
// Track each employee's career development goals (one card per plan).
// - Employees see only their own plans (read-only).
// - HR/Admin/Manager (MANAGE_CAREER_PLANS) can create, edit and delete.

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

import { careerPlansApi } from '../../api/careerPlans'
import { employeesApi } from '../../api/employees'
import { useAuth } from '../../contexts/AuthContext'
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

const STATUS_OPTIONS = [
  { value: 'Planned', label: 'Planned' },
  { value: 'InProgress', label: 'In Progress' },
  { value: 'Completed', label: 'Completed' },
  { value: 'OnHold', label: 'On Hold' },
]

export default function CareerPlansPage() {
  const { can } = usePermissions()
  const { isEmployee } = useAuth()

  const canManagePlans = can('MANAGE_CAREER_PLANS')
  const viewingAsEmployee = isEmployee()

  // ----- List + dropdown data -----
  const [plans, setPlans] = useState([])
  const [employees, setEmployees] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // ----- Modal state -----
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [planBeingEdited, setPlanBeingEdited] = useState(null)
  const [planIdToDelete, setPlanIdToDelete] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  // -----------------------------------------------------------------
  // API call: load plans. Employees see only their own; everyone else
  // sees all plans plus the employee list for the dropdown.
  // -----------------------------------------------------------------
  const fetchPlans = async () => {
    setIsLoading(true)
    try {
      if (viewingAsEmployee) {
        const myEmployee = await employeesApi.getMe().catch(() => null)
        if (myEmployee) {
          const myPlans = await careerPlansApi.getByEmployee(myEmployee.employeeID)
          setPlans(myPlans)
        }
      } else {
        const [plansResult, employeesResult] = await Promise.allSettled([
          careerPlansApi.getAll(),
          employeesApi.getAll(),
        ])
        if (plansResult.status === 'fulfilled') setPlans(plansResult.value)
        if (employeesResult.status === 'fulfilled') {
          setEmployees(employeesResult.value)
        }
      }
    } catch {
      toast.error('Failed to load career plans')
    } finally {
      setIsLoading(false)
    }
  }

  // useEffect: load once on mount.
  useEffect(() => {
    fetchPlans()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // useEffect: pre-fill the form for edit, defaults for create.
  useEffect(() => {
    if (planBeingEdited) {
      reset({
        employeeID: String(planBeingEdited.employeeID),
        title: planBeingEdited.title,
        description: planBeingEdited.description ?? '',
        status: planBeingEdited.status,
      })
    } else {
      reset({ status: 'Planned' })
    }
  }, [planBeingEdited, isCreateModalOpen, reset])

  // -----------------------------------------------------------------
  // Handler: open the create modal with defaults.
  // -----------------------------------------------------------------
  const handleOpenCreateModal = () => {
    reset({ status: 'Planned' })
    setIsCreateModalOpen(true)
  }

  // -----------------------------------------------------------------
  // Handler: submit create or edit form.
  // -----------------------------------------------------------------
  const handleFormSubmit = async (formData) => {
    setIsSaving(true)
    try {
      const sharedFields = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
      }

      if (planBeingEdited) {
        // Can't change which employee a plan belongs to.
        await careerPlansApi.update(planBeingEdited.planID, sharedFields)
        toast.success('Career plan updated')
        setPlanBeingEdited(null)
      } else {
        await careerPlansApi.create({
          employeeID: parseInt(formData.employeeID),
          ...sharedFields,
        })
        toast.success('Career plan created')
        setIsCreateModalOpen(false)
      }

      fetchPlans()
    } catch {
      toast.error('Failed to save career plan')
    } finally {
      setIsSaving(false)
    }
  }

  // -----------------------------------------------------------------
  // Handler: delete after confirmation.
  // -----------------------------------------------------------------
  const handleDelete = async () => {
    if (!planIdToDelete) return

    setIsDeleting(true)
    try {
      await careerPlansApi.remove(planIdToDelete)
      toast.success('Career plan deleted')
      setPlanIdToDelete(null)
      fetchPlans()
    } catch {
      toast.error('Failed to delete career plan')
    } finally {
      setIsDeleting(false)
    }
  }

  // Employee dropdown options for the create form.
  const employeeOptions = employees.map((employee) => ({
    value: employee.employeeID,
    label: employee.name,
  }))

  return (
    <div>
      <PageHeader
        title={viewingAsEmployee ? 'My Career Plans' : 'Career Plans'}
        subtitle="Track employee career development goals"
        actions={
          canManagePlans && (
            <Button
              leftIcon={<PlusIcon className="h-4 w-4" />}
              onClick={handleOpenCreateModal}
            >
              New Plan
            </Button>
          )
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : plans.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No career plans"
            description="Create the first career development plan."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div key={plan.planID} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                    {plan.title}
                  </h3>
                  {!viewingAsEmployee && (
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {plan.employeeName ?? `Employee #${plan.employeeID}`}
                    </p>
                  )}
                </div>
                <StatusBadge status={plan.status} />
              </div>

              {plan.description && (
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-4 line-clamp-3">
                  {plan.description}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-400 dark:text-slate-500 mt-auto">
                <span>{format(new Date(plan.createdAt), 'MMM d, yyyy')}</span>

                {canManagePlans && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => setPlanBeingEdited(plan)}
                      className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded text-amber-500"
                      title="Edit"
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setPlanIdToDelete(plan.planID)}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-500"
                      title="Delete"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal — includes Employee selector */}
      <Modal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="New Career Plan"
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
            label="Plan Title"
            required
            error={errors.title?.message}
            {...register('title', { required: 'Title is required' })}
          />
          <div>
            <label className="form-label">Description</label>
            <textarea
              className="input min-h-[80px]"
              {...register('description')}
            />
          </div>
          <Select label="Status" options={STATUS_OPTIONS} {...register('status')} />
        </form>
      </Modal>

      {/* Edit modal — Employee is fixed */}
      <Modal
        open={!!planBeingEdited}
        onClose={() => setPlanBeingEdited(null)}
        title="Edit Career Plan"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPlanBeingEdited(null)}>
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
            label="Plan Title"
            required
            error={errors.title?.message}
            {...register('title', { required: 'Title is required' })}
          />
          <div>
            <label className="form-label">Description</label>
            <textarea
              className="input min-h-[80px]"
              {...register('description')}
            />
          </div>
          <Select label="Status" options={STATUS_OPTIONS} {...register('status')} />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!planIdToDelete}
        onClose={() => setPlanIdToDelete(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title="Delete Career Plan"
      />
    </div>
  )
}
