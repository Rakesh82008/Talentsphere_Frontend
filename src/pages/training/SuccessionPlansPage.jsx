// Succession Plans Page
//
// HR/Admin/Manager defines who should take over each key role. Each
// plan links an Employee (the role-holder) to a Successor (another
// employee being groomed for that role) with a status.

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

import { successionsApi } from '../../api/successions'
import { employeesApi } from '../../api/employees'

import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
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
]

export default function SuccessionPlansPage() {
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
  // API call: load succession plans + employees (used in dropdowns).
  // -----------------------------------------------------------------
  const fetchPlans = async () => {
    setIsLoading(true)
    try {
      const [plansList, employeesList] = await Promise.all([
        successionsApi.getAll(),
        employeesApi.getAll(),
      ])
      setPlans(plansList)
      setEmployees(employeesList)
    } catch {
      toast.error('Failed to load succession plans')
    } finally {
      setIsLoading(false)
    }
  }

  // useEffect: load on mount.
  useEffect(() => {
    fetchPlans()
  }, [])

  // useEffect: pre-fill form for edit, defaults for create.
  useEffect(() => {
    if (planBeingEdited) {
      reset({
        employeeID: String(planBeingEdited.employeeID),
        successorID: String(planBeingEdited.successorID),
        status: planBeingEdited.status,
      })
    } else {
      reset({ status: 'Planned' })
    }
  }, [planBeingEdited, isCreateModalOpen, reset])

  // -----------------------------------------------------------------
  // Handler: open the create modal.
  // -----------------------------------------------------------------
  const handleOpenCreateModal = () => {
    reset({ status: 'Planned' })
    setIsCreateModalOpen(true)
  }

  // -----------------------------------------------------------------
  // Form submit — handles both create and edit.
  // Note: only successorID + status can change in edit mode.
  // -----------------------------------------------------------------
  const handleFormSubmit = async (formData) => {
    setIsSaving(true)
    try {
      if (planBeingEdited) {
        await successionsApi.update(planBeingEdited.successionID, {
          successorID: parseInt(formData.successorID),
          status: formData.status,
        })
        toast.success('Succession plan updated')
        setPlanBeingEdited(null)
      } else {
        await successionsApi.create({
          employeeID: parseInt(formData.employeeID),
          successorID: parseInt(formData.successorID),
          status: formData.status,
        })
        toast.success('Succession plan created')
        setIsCreateModalOpen(false)
      }
      fetchPlans()
    } catch {
      toast.error('Failed to save succession plan')
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
      await successionsApi.remove(planIdToDelete)
      toast.success('Succession plan deleted')
      setPlanIdToDelete(null)
      fetchPlans()
    } catch {
      toast.error('Failed to delete succession plan')
    } finally {
      setIsDeleting(false)
    }
  }

  // Employee dropdown options — used for both "Employee" and "Successor".
  const employeeOptions = employees.map((employee) => ({
    value: employee.employeeID,
    label: employee.name,
  }))

  // -----------------------------------------------------------------
  // Reusable form (both modals).
  // -----------------------------------------------------------------
  const renderPlanForm = () => (
    <form className="space-y-4">
      <Select
        label="Employee (for)"
        required
        placeholder="Select employee"
        error={errors.employeeID?.message}
        options={employeeOptions}
        {...register('employeeID', { required: 'Employee is required' })}
      />
      <Select
        label="Successor"
        required
        placeholder="Select successor"
        error={errors.successorID?.message}
        options={employeeOptions}
        {...register('successorID', { required: 'Successor is required' })}
      />
      <Select label="Status" options={STATUS_OPTIONS} {...register('status')} />
    </form>
  )

  return (
    <div>
      <PageHeader
        title="Succession Plans"
        subtitle="Plan leadership continuity and employee succession"
        actions={
          <Button
            leftIcon={<PlusIcon className="h-4 w-4" />}
            onClick={handleOpenCreateModal}
          >
            New Plan
          </Button>
        }
      />

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : plans.length === 0 ? (
          <EmptyState
            title="No succession plans"
            description="Create your first succession plan."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-th">Employee</th>
                  <th className="table-th">Successor</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Created</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {plans.map((plan) => (
                  <tr key={plan.successionID} className="hover:bg-gray-50">
                    <td className="table-td font-medium">
                      {plan.employeeName ?? `Employee #${plan.employeeID}`}
                    </td>
                    <td className="table-td">
                      {plan.successorName ?? `Employee #${plan.successorID}`}
                    </td>
                    <td className="table-td">
                      <StatusBadge status={plan.status} />
                    </td>
                    <td className="table-td text-gray-500 dark:text-slate-400">
                      {format(new Date(plan.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="table-td">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPlanBeingEdited(plan)}
                          className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg text-amber-500"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setPlanIdToDelete(plan.successionID)}
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
        title="New Succession Plan"
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
        {renderPlanForm()}
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!planBeingEdited}
        onClose={() => setPlanBeingEdited(null)}
        title="Edit Succession Plan"
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
        {renderPlanForm()}
      </Modal>

      <ConfirmDialog
        open={!!planIdToDelete}
        onClose={() => setPlanIdToDelete(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title="Delete Succession Plan"
      />
    </div>
  )
}
