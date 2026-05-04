import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { complianceApi } from '../../api/compliance'
import { employeesApi } from '../../api/employees'
import type { ComplianceRecordResponse, EmployeeResponse } from '../../types'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Select from '../../components/common/Select'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import SearchBar from '../../components/common/SearchBar'
import { format } from 'date-fns'

type CForm = { employeeID: string; recordType: string; description: string }

export default function CompliancePage() {
  const [records, setRecords] = useState<ComplianceRecordResponse[]>([])
  const [employees, setEmployees] = useState<EmployeeResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editRecord, setEditRecord] = useState<ComplianceRecordResponse | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CForm>()

  const load = async () => {
    setLoading(true)
    try {
      const [c, e] = await Promise.all([complianceApi.getAll(), employeesApi.getAll()])
      setRecords(c)
      setEmployees(e)
    } catch { toast.error('Failed to load compliance records') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    if (editRecord) reset({ employeeID: String(editRecord.employeeID), recordType: editRecord.recordType, description: editRecord.description ?? '' })
    else reset({ recordType: 'Certificate' })
  }, [editRecord, showCreate, reset])

  const onSubmit = async (data: CForm) => {
    setSaving(true)
    try {
      if (editRecord) {
        await complianceApi.update(editRecord.complianceID, { employeeID: parseInt(data.employeeID), recordType: data.recordType as ComplianceRecordResponse['recordType'], description: data.description })
        toast.success('Record updated')
        setEditRecord(null)
      } else {
        await complianceApi.create({ employeeID: parseInt(data.employeeID), recordType: data.recordType as ComplianceRecordResponse['recordType'], description: data.description })
        toast.success('Compliance record added')
        setShowCreate(false)
      }
      load()
    } catch { toast.error('Failed to save compliance record') }
    finally { setSaving(false) }
  }

  const onDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await complianceApi.remove(deleteId)
      toast.success('Record deleted')
      setDeleteId(null)
      load()
    } catch { toast.error('Failed to delete record') }
    finally { setDeleting(false) }
  }

  const filtered = records.filter((r) =>
    !search || r.employeeName?.toLowerCase().includes(search.toLowerCase()) || r.recordType.toLowerCase().includes(search.toLowerCase())
  )

  const RecordForm = () => (
    <form className="space-y-4">
      <Select label="Employee" required placeholder="Select employee" error={errors.employeeID?.message}
        options={employees.map((e) => ({ value: e.employeeID, label: e.name }))}
        {...register('employeeID', { required: 'Employee is required' })} />
      <Select label="Record Type" required options={[{value:'Certificate',label:'Certificate'},{value:'License',label:'License'},{value:'Training',label:'Training'},{value:'Background',label:'Background'}]}
        error={errors.recordType?.message} {...register('recordType', { required: true })} />
      <div><label className="form-label">Description</label><textarea className="input min-h-[80px]" {...register('description')} /></div>
    </form>
  )

  const typeColors: Record<string, string> = {
    Certificate: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    License: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    Training: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    Background: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  }

  return (
    <div>
      <PageHeader
        title="Compliance Records"
        subtitle="Track employee compliance certifications and requirements"
        actions={<Button leftIcon={<PlusIcon className="h-4 w-4" />} onClick={() => { reset({ recordType: 'Certificate' }); setShowCreate(true) }}>Add Record</Button>}
      />

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by employee or type…" className="w-80" />
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No compliance records" description="Add your first compliance record." />
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
                {filtered.map((r) => (
                  <tr key={r.complianceID} className="hover:bg-gray-50">
                    <td className="table-td font-medium">{r.employeeName ?? `Employee #${r.employeeID}`}</td>
                    <td className="table-td">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[r.recordType] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'}`}>{r.recordType}</span>
                    </td>
                    <td className="table-td text-gray-500 dark:text-slate-400 max-w-xs truncate">{r.description ?? '—'}</td>
                    <td className="table-td text-gray-500 dark:text-slate-400">{format(new Date(r.createdAt), 'MMM d, yyyy')}</td>
                    <td className="table-td">
                      <div className="flex gap-2">
                        <button onClick={() => setEditRecord(r)} className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg text-amber-500"><PencilIcon className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteId(r.complianceID)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500"><TrashIcon className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Compliance Record"
        footer={<><Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>Add</Button></>}>
        <RecordForm />
      </Modal>
      <Modal open={!!editRecord} onClose={() => setEditRecord(null)} title="Edit Compliance Record"
        footer={<><Button variant="secondary" onClick={() => setEditRecord(null)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>Save</Button></>}>
        <RecordForm />
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={onDelete} loading={deleting} />
    </div>
  )
}
