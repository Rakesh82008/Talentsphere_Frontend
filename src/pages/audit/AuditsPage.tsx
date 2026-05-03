import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { auditsApi } from '../../api/audits'
import type { AuditResponse } from '../../types'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import { format } from 'date-fns'

type AForm = { description: string; auditDate: string; status: string }

export default function AuditsPage() {
  const [audits, setAudits] = useState<AuditResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editAudit, setEditAudit] = useState<AuditResponse | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AForm>()

  const load = async () => {
    setLoading(true)
    try { setAudits(await auditsApi.getAll()) }
    catch { toast.error('Failed to load audits') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    if (editAudit) reset({ description: editAudit.description, auditDate: editAudit.auditDate?.split('T')[0], status: editAudit.status })
    else reset({ status: 'Active', auditDate: new Date().toISOString().split('T')[0] })
  }, [editAudit, showCreate, reset])

  const onSubmit = async (data: AForm) => {
    setSaving(true)
    try {
      if (editAudit) {
        await auditsApi.update(editAudit.auditID, data as any)
        toast.success('Audit updated')
        setEditAudit(null)
      } else {
        await auditsApi.create(data as any)
        toast.success('Audit created')
        setShowCreate(false)
      }
      load()
    } catch { toast.error('Failed to save audit') }
    finally { setSaving(false) }
  }

  const onDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await auditsApi.remove(deleteId)
      toast.success('Audit deleted')
      setDeleteId(null)
      load()
    } catch { toast.error('Failed to delete audit') }
    finally { setDeleting(false) }
  }

  const AuditForm = () => (
    <form className="space-y-4">
      <div><label className="form-label">Description <span className="text-red-500">*</span></label>
        <textarea className="input min-h-[80px]" {...register('description', { required: 'Description is required' })} />
        {errors.description && <p className="form-error">{errors.description.message}</p>}
      </div>
      <Input label="Audit Date" type="date" required error={errors.auditDate?.message} {...register('auditDate', { required: 'Date is required' })} />
      <Select label="Status" options={[{value:'Active',label:'Active'},{value:'Completed',label:'Completed'},{value:'Archived',label:'Archived'}]} {...register('status')} />
    </form>
  )

  return (
    <div>
      <PageHeader
        title="Audits"
        subtitle="Manage internal audit records and compliance activities"
        actions={<Button leftIcon={<PlusIcon className="h-4 w-4" />} onClick={() => { reset({ status: 'Active', auditDate: new Date().toISOString().split('T')[0] }); setShowCreate(true) }}>New Audit</Button>}
      />

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : audits.length === 0 ? (
          <EmptyState title="No audits" description="Create your first audit record." />
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
                {audits.map((a) => (
                  <tr key={a.auditID} className="hover:bg-gray-50">
                    <td className="table-td font-medium max-w-xs truncate">{a.description}</td>
                    <td className="table-td text-gray-600">{format(new Date(a.auditDate), 'MMM d, yyyy')}</td>
                    <td className="table-td"><StatusBadge status={a.status} /></td>
                    <td className="table-td text-gray-500">{format(new Date(a.createdAt), 'MMM d, yyyy')}</td>
                    <td className="table-td">
                      <div className="flex gap-2">
                        <button onClick={() => setEditAudit(a)} className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-500"><PencilIcon className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteId(a.auditID)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><TrashIcon className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Audit"
        footer={<><Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>Create</Button></>}>
        <AuditForm />
      </Modal>
      <Modal open={!!editAudit} onClose={() => setEditAudit(null)} title="Edit Audit"
        footer={<><Button variant="secondary" onClick={() => setEditAudit(null)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>Save</Button></>}>
        <AuditForm />
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={onDelete} loading={deleting} />
    </div>
  )
}
