// Compliance Page
//
// HR/Admin tracks compliance items per employee — certificates,
// licenses, completed trainings and background checks. Each item is
// a simple record that can be edited or deleted.

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

import { complianceApi } from '../../api/compliance'
import { employeesApi } from '../../api/employees'

import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Select from '../../components/common/Select'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import SearchBar from '../../components/common/SearchBar'

const RECORD_TYPE_OPTIONS = [
  { value: 'Certificate', label: 'Certificate' },
  { value: 'License', label: 'License' },
  { value: 'Training', label: 'Training' },
  { value: 'Background', label: 'Background' },
]

// Pill colors for each record type, used in the table.
const TYPE_COLOR_CLASSES = {
  Certificate: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  License: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  Training: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  Background: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
}
const DEFAULT_TYPE_COLOR =
  'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'

export default function CompliancePage() {
  // ----- List + dropdown data -----
  const [records, setRecords] = useState([])
  const [employees, setEmployees] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // ----- Search -----
  const [searchText, setSearchText] = useState('')

  // ----- Modal state -----
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [recordBeingEdited, setRecordBeingEdited] = useState(null)
  const [recordIdToDelete, setRecordIdToDelete] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  // -----------------------------------------------------------------
  // API call: load compliance records + the employee list used by
  // the form's "Employee" dropdown.
  // -----------------------------------------------------------------
  const fetchRecords = async () => {
    setIsLoading(true)
    try {
      const [recordsList, employeesList] = await Promise.all([
        complianceApi.getAll(),
        employeesApi.getAll(),
      ])
      setRecords(recordsList)
      setEmployees(employeesList)
    } catch {
      toast.error('Failed to load compliance records')
    } finally {
      setIsLoading(false)
    }
  }

  // useEffect: load once on mount.
  useEffect(() => {
    fetchRecords()
  }, [])

  // useEffect: pre-fill form for edit, or reset for create.
  useEffect(() => {
    if (recordBeingEdited) {
      reset({
        employeeID: String(recordBeingEdited.employeeID),
        recordType: recordBeingEdited.recordType,
        description: recordBeingEdited.description ?? '',
      })
    } else {
      reset({ recordType: 'Certificate' })
    }
  }, [recordBeingEdited, isCreateModalOpen, reset])

  // -----------------------------------------------------------------
  // Handler: open the create modal.
  // -----------------------------------------------------------------
  const handleOpenCreateModal = () => {
    reset({ recordType: 'Certificate' })
    setIsCreateModalOpen(true)
  }

  // -----------------------------------------------------------------
  // Handler: submit create or edit form.
  // -----------------------------------------------------------------
  const handleFormSubmit = async (formData) => {
    setIsSaving(true)
    try {
      const payload = {
        employeeID: parseInt(formData.employeeID),
        recordType: formData.recordType,
        description: formData.description,
      }

      if (recordBeingEdited) {
        await complianceApi.update(recordBeingEdited.complianceID, payload)
        toast.success('Record updated')
        setRecordBeingEdited(null)
      } else {
        await complianceApi.create(payload)
        toast.success('Compliance record added')
        setIsCreateModalOpen(false)
      }

      fetchRecords()
    } catch {
      toast.error('Failed to save compliance record')
    } finally {
      setIsSaving(false)
    }
  }

  // -----------------------------------------------------------------
  // Handler: delete a record after the user confirms.
  // -----------------------------------------------------------------
  const handleDelete = async () => {
    if (!recordIdToDelete) return

    setIsDeleting(true)
    try {
      await complianceApi.remove(recordIdToDelete)
      toast.success('Record deleted')
      setRecordIdToDelete(null)
      fetchRecords()
    } catch {
      toast.error('Failed to delete record')
    } finally {
      setIsDeleting(false)
    }
  }

  // Filter records by employee name or record type.
  const filteredRecords = records.filter((record) => {
    if (!searchText) return true
    const lowerSearch = searchText.toLowerCase()
    return (
      record.employeeName?.toLowerCase().includes(lowerSearch) ||
      record.recordType.toLowerCase().includes(lowerSearch)
    )
  })

  // Dropdown options used in the form.
  const employeeOptions = employees.map((employee) => ({
    value: employee.employeeID,
    label: employee.name,
  }))

  // -----------------------------------------------------------------
  // Reusable form (both modals).
  // -----------------------------------------------------------------
  const renderRecordForm = () => (
    <form className="space-y-4">
      <Select
        label="Employee"
        required
        placeholder="Select employee"
        error={errors.employeeID?.message}
        options={employeeOptions}
        {...register('employeeID', { required: 'Employee is required' })}
      />
      <Select
        label="Record Type"
        required
        options={RECORD_TYPE_OPTIONS}
        error={errors.recordType?.message}
        {...register('recordType', { required: true })}
      />
      <div>
        <label className="form-label">Description</label>
        <textarea className="input min-h-[80px]" {...register('description')} />
      </div>
    </form>
  )

  return (
    <div>
      <PageHeader
        title="Compliance Records"
        subtitle="Track employee compliance certifications and requirements"
        actions={
          <Button
            leftIcon={<PlusIcon className="h-4 w-4" />}
            onClick={handleOpenCreateModal}
          >
            Add Record
          </Button>
        }
      />

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <SearchBar
            value={searchText}
            onChange={setSearchText}
            placeholder="Search by employee or type…"
            className="w-80"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredRecords.length === 0 ? (
          <EmptyState
            title="No compliance records"
            description="Add your first compliance record."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-th">Employee</th>
                  <th className="table-th">Type</th>
                  <th className="table-th">Description</th>
                  <th className="table-th">Recorded</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecords.map((record) => {
                  const typeColor =
                    TYPE_COLOR_CLASSES[record.recordType] ?? DEFAULT_TYPE_COLOR

                  return (
                    <tr key={record.complianceID} className="hover:bg-gray-50">
                      <td className="table-td font-medium">
                        {record.employeeName ?? `Employee #${record.employeeID}`}
                      </td>
                      <td className="table-td">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColor}`}
                        >
                          {record.recordType}
                        </span>
                      </td>
                      <td className="table-td text-gray-500 dark:text-slate-400 max-w-xs truncate">
                        {record.description ?? '—'}
                      </td>
                      <td className="table-td text-gray-500 dark:text-slate-400">
                        {format(new Date(record.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="table-td">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setRecordBeingEdited(record)}
                            className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg text-amber-500"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setRecordIdToDelete(record.complianceID)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Compliance Record"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button loading={isSaving} onClick={handleSubmit(handleFormSubmit)}>
              Add
            </Button>
          </>
        }
      >
        {renderRecordForm()}
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!recordBeingEdited}
        onClose={() => setRecordBeingEdited(null)}
        title="Edit Compliance Record"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRecordBeingEdited(null)}>
              Cancel
            </Button>
            <Button loading={isSaving} onClick={handleSubmit(handleFormSubmit)}>
              Save
            </Button>
          </>
        }
      >
        {renderRecordForm()}
      </Modal>

      <ConfirmDialog
        open={!!recordIdToDelete}
        onClose={() => setRecordIdToDelete(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </div>
  )
}
