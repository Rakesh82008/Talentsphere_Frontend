// Audits Page
//
// HR/Admin manages internal audit records — descriptions of audit
// activity tied to an audit date and a status (Active / Completed /
// Archived). For the system activity log, see AuditLogsPage.

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

import { auditsApi } from '../../api/audits'

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
  { value: 'Active', label: 'Active' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Archived', label: 'Archived' },
]

// Today's date in YYYY-MM-DD — used as the default for new audits.
const getTodayDateString = () => new Date().toISOString().split('T')[0]

export default function AuditsPage() {
  // ----- List + loading -----
  const [audits, setAudits] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // ----- Modal state -----
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [auditBeingEdited, setAuditBeingEdited] = useState(null)
  const [auditIdToDelete, setAuditIdToDelete] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  // -----------------------------------------------------------------
  // API call: load audits.
  // -----------------------------------------------------------------
  const fetchAudits = async () => {
    setIsLoading(true)
    try {
      const auditsList = await auditsApi.getAll()
      setAudits(auditsList)
    } catch {
      toast.error('Failed to load audits')
    } finally {
      setIsLoading(false)
    }
  }

  // useEffect: load on mount.
  useEffect(() => {
    fetchAudits()
  }, [])

  // useEffect: pre-fill the form for edit, defaults for create.
  useEffect(() => {
    if (auditBeingEdited) {
      reset({
        description: auditBeingEdited.description,
        auditDate: auditBeingEdited.auditDate?.split('T')[0],
        status: auditBeingEdited.status,
      })
    } else {
      reset({ status: 'Active', auditDate: getTodayDateString() })
    }
  }, [auditBeingEdited, isCreateModalOpen, reset])

  // -----------------------------------------------------------------
  // Handler: open the create modal with sensible defaults.
  // -----------------------------------------------------------------
  const handleOpenCreateModal = () => {
    reset({ status: 'Active', auditDate: getTodayDateString() })
    setIsCreateModalOpen(true)
  }

  // -----------------------------------------------------------------
  // Form submit — handles both create and edit.
  // -----------------------------------------------------------------
  const handleFormSubmit = async (formData) => {
    setIsSaving(true)
    try {
      if (auditBeingEdited) {
        await auditsApi.update(auditBeingEdited.auditID, formData)
        toast.success('Audit updated')
        setAuditBeingEdited(null)
      } else {
        await auditsApi.create(formData)
        toast.success('Audit created')
        setIsCreateModalOpen(false)
      }
      fetchAudits()
    } catch {
      toast.error('Failed to save audit')
    } finally {
      setIsSaving(false)
    }
  }

  // -----------------------------------------------------------------
  // Handler: delete after confirmation.
  // -----------------------------------------------------------------
  const handleDelete = async () => {
    if (!auditIdToDelete) return

    setIsDeleting(true)
    try {
      await auditsApi.remove(auditIdToDelete)
      toast.success('Audit deleted')
      setAuditIdToDelete(null)
      fetchAudits()
    } catch {
      toast.error('Failed to delete audit')
    } finally {
      setIsDeleting(false)
    }
  }

  // -----------------------------------------------------------------
  // Reusable form (both modals).
  // -----------------------------------------------------------------
  const renderAuditForm = () => (
    <form className="space-y-4">
      <div>
        <label className="form-label">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          className="input min-h-[80px]"
          {...register('description', { required: 'Description is required' })}
        />
        {errors.description && (
          <p className="form-error">{errors.description.message}</p>
        )}
      </div>
      <Input
        label="Audit Date"
        type="date"
        required
        error={errors.auditDate?.message}
        {...register('auditDate', { required: 'Date is required' })}
      />
      <Select label="Status" options={STATUS_OPTIONS} {...register('status')} />
    </form>
  )

  return (
    <div>
      <PageHeader
        title="Audits"
        subtitle="Manage internal audit records and compliance activities"
        actions={
          <Button
            leftIcon={<PlusIcon className="h-4 w-4" />}
            onClick={handleOpenCreateModal}
          >
            New Audit
          </Button>
        }
      />

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : audits.length === 0 ? (
          <EmptyState
            title="No audits"
            description="Create your first audit record."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-th">Description</th>
                  <th className="table-th">Audit Date</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Created</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {audits.map((audit) => (
                  <tr key={audit.auditID} className="hover:bg-gray-50">
                    <td className="table-td font-medium max-w-xs truncate">
                      {audit.description}
                    </td>
                    <td className="table-td text-gray-600 dark:text-slate-400">
                      {format(new Date(audit.auditDate), 'MMM d, yyyy')}
                    </td>
                    <td className="table-td">
                      <StatusBadge status={audit.status} />
                    </td>
                    <td className="table-td text-gray-500 dark:text-slate-400">
                      {format(new Date(audit.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="table-td">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setAuditBeingEdited(audit)}
                          className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg text-amber-500"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setAuditIdToDelete(audit.auditID)}
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
        title="New Audit"
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
        {renderAuditForm()}
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!auditBeingEdited}
        onClose={() => setAuditBeingEdited(null)}
        title="Edit Audit"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAuditBeingEdited(null)}>
              Cancel
            </Button>
            <Button loading={isSaving} onClick={handleSubmit(handleFormSubmit)}>
              Save
            </Button>
          </>
        }
      >
        {renderAuditForm()}
      </Modal>

      <ConfirmDialog
        open={!!auditIdToDelete}
        onClose={() => setAuditIdToDelete(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </div>
  )
}
