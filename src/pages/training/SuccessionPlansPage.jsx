import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
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
import { format } from 'date-fns'

export default function SuccessionPlansPage() {
  const [plans, setPlans] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editPlan, setEditPlan] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const load = async () => {
    setLoading(true)
    try {
      const [s, e] = await Promise.all([successionsApi.getAll(), employeesApi.getAll()])
      setPlans(s)
      setEmployees(e)
    } catch { toast.error('Failed to load succession plans') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    if (editPlan) reset({ employeeID: String(editPlan.employeeID), successorID: String(editPlan.successorID), status: editPlan.status })
    else reset({ status: 'Planned' })
  }, [editPlan, showCreate, reset])

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      if (editPlan) {
        await successionsApi.update(editPlan.successionID, { successorID: parseInt(data.successorID), status: data.status })
        toast.success('Succession plan updated')
        setEditPlan(null)
      } else {
        await successionsApi.create({ employeeID: parseInt(data.employeeID), successorID: parseInt(data.successorID), status: data.status })
        toast.success('Succession plan created')
        setShowCreate(false)
      }
      load()
    } catch { toast.error('Failed to save succession plan') }
    finally { setSaving(false) }
  }

  const onDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await successionsApi.remove(deleteId)
      toast.success('Succession plan deleted')
      setDeleteId(null)
      load()
    } catch { toast.error('Failed to delete succession plan') }
    finally { setDeleting(false) }
  }

  const PlanForm = () => (
    <form className="space-y-4">
      <Select label="Employee (for)" required placeholder="Select employee" error={errors.employeeID?.message}
        options={employees.map((e) => ({ value: e.employeeID, label: e.name }))}
        {...register('employeeID', { required: 'Employee is required' })} />
      <Select label="Successor" required placeholder="Select successor" error={errors.successorID?.message}
        options={employees.map((e) => ({ value: e.employeeID, label: e.name }))}
        {...register('successorID', { required: 'Successor is required' })} />
      <Select label="Status" options={[{value:'Planned',label:'Planned'},{value:'InProgress',label:'In Progress'},{value:'Completed',label:'Completed'}]} {...register('status')} />
    </form>
  )

  return (
    <div>
      <PageHeader
        title="Succession Plans"
        subtitle="Plan leadership continuity and employee succession"
        actions={<Button leftIcon={<PlusIcon className="h-4 w-4" />} onClick={() => { reset({ status: 'Planned' }); setShowCreate(true) }}>New Plan</Button>}
      />

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : plans.length === 0 ? (
          <EmptyState title="No succession plans" description="Create your first succession plan." />
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
                {plans.map((p) => (
                  <tr key={p.successionID} className="hover:bg-gray-50">
                    <td className="table-td font-medium">{p.employeeName ?? `Employee #${p.employeeID}`}</td>
                    <td className="table-td">{p.successorName ?? `Employee #${p.successorID}`}</td>
                    <td className="table-td"><StatusBadge status={p.status} /></td>
                    <td className="table-td text-gray-500 dark:text-slate-400">{format(new Date(p.createdAt), 'MMM d, yyyy')}</td>
                    <td className="table-td">
                      <div className="flex gap-2">
                        <button onClick={() => setEditPlan(p)} className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg text-amber-500"><PencilIcon className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteId(p.successionID)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500"><TrashIcon className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Succession Plan"
        footer={<><Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>Create</Button></>}>
        <PlanForm />
      </Modal>
      <Modal open={!!editPlan} onClose={() => setEditPlan(null)} title="Edit Succession Plan"
        footer={<><Button variant="secondary" onClick={() => setEditPlan(null)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>Save</Button></>}>
        <PlanForm />
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={onDelete} loading={deleting} title="Delete Succession Plan" />
    </div>
  )
}
