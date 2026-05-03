import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { careerPlansApi } from '../../api/careerPlans'
import { employeesApi } from '../../api/employees'
import type { CareerPlanResponse, EmployeeResponse } from '../../types'
import { useAuth } from '../../hooks/useAuth'
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
import { format } from 'date-fns'

type PlanForm = { employeeID: string; title: string; description: string; status: string }

export default function CareerPlansPage() {
  const { can } = usePermissions()
  const { isEmployee, user } = useAuth()
  const [plans, setPlans] = useState<CareerPlanResponse[]>([])
  const [employees, setEmployees] = useState<EmployeeResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editPlan, setEditPlan] = useState<CareerPlanResponse | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PlanForm>()

  const load = async () => {
    setLoading(true)
    try {
      if (isEmployee()) {
        const emp = await employeesApi.getMe().catch(() => null)
        if (emp) {
          const data = await careerPlansApi.getByEmployee(emp.employeeID)
          setPlans(data)
        }
      } else {
        const [p, e] = await Promise.allSettled([
          careerPlansApi.getAll(),
          employeesApi.getAll(),
        ])
        if (p.status === 'fulfilled') setPlans(p.value)
        if (e.status === 'fulfilled') setEmployees(e.value)
      }
    } catch { toast.error('Failed to load career plans') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    if (editPlan) reset({ employeeID: String(editPlan.employeeID), title: editPlan.title, description: editPlan.description ?? '', status: editPlan.status })
    else reset({ status: 'Planned' })
  }, [editPlan, showCreate, reset])

  const onSubmit = async (data: PlanForm) => {
    setSaving(true)
    try {
      if (editPlan) {
        await careerPlansApi.update(editPlan.planID, { title: data.title, description: data.description, status: data.status as CareerPlanResponse['status'] })
        toast.success('Career plan updated')
        setEditPlan(null)
      } else {
        await careerPlansApi.create({ employeeID: parseInt(data.employeeID), title: data.title, description: data.description, status: data.status as CareerPlanResponse['status'] })
        toast.success('Career plan created')
        setShowCreate(false)
      }
      load()
    } catch { toast.error('Failed to save career plan') }
    finally { setSaving(false) }
  }

  const onDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await careerPlansApi.remove(deleteId)
      toast.success('Career plan deleted')
      setDeleteId(null)
      load()
    } catch { toast.error('Failed to delete career plan') }
    finally { setDeleting(false) }
  }

  return (
    <div>
      <PageHeader
        title={isEmployee() ? 'My Career Plans' : 'Career Plans'}
        subtitle="Track employee career development goals"
        actions={can('MANAGE_CAREER_PLANS') && (
          <Button leftIcon={<PlusIcon className="h-4 w-4" />} onClick={() => { reset({ status: 'Planned' }); setShowCreate(true) }}>
            New Plan
          </Button>
        )}
      />

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : plans.length === 0 ? (
        <div className="card"><EmptyState title="No career plans" description="Create the first career development plan." /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((p) => (
            <div key={p.planID} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{p.title}</h3>
                  {!isEmployee() && <p className="text-sm text-gray-500">{p.employeeName ?? `Employee #${p.employeeID}`}</p>}
                </div>
                <StatusBadge status={p.status} />
              </div>
              {p.description && <p className="text-sm text-gray-600 mb-4 line-clamp-3">{p.description}</p>}
              <div className="flex items-center justify-between text-xs text-gray-400 mt-auto">
                <span>{format(new Date(p.createdAt), 'MMM d, yyyy')}</span>
                {can('MANAGE_CAREER_PLANS') && (
                  <div className="flex gap-1">
                    <button onClick={() => setEditPlan(p)} className="p-1.5 hover:bg-amber-50 rounded text-amber-500"><PencilIcon className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleteId(p.planID)} className="p-1.5 hover:bg-red-50 rounded text-red-500"><TrashIcon className="h-3.5 w-3.5" /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Career Plan"
        footer={<><Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>Create</Button></>}>
        <form className="space-y-4">
          <Select label="Employee" required placeholder="Select employee" error={errors.employeeID?.message}
            options={employees.map((e) => ({ value: e.employeeID, label: e.name }))}
            {...register('employeeID', { required: 'Employee is required' })} />
          <Input label="Plan Title" required error={errors.title?.message} {...register('title', { required: 'Title is required' })} />
          <div><label className="form-label">Description</label><textarea className="input min-h-[80px]" {...register('description')} /></div>
          <Select label="Status" options={[{value:'Planned',label:'Planned'},{value:'InProgress',label:'In Progress'},{value:'Completed',label:'Completed'},{value:'OnHold',label:'On Hold'}]} {...register('status')} />
        </form>
      </Modal>

      <Modal open={!!editPlan} onClose={() => setEditPlan(null)} title="Edit Career Plan"
        footer={<><Button variant="secondary" onClick={() => setEditPlan(null)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>Save</Button></>}>
        <form className="space-y-4">
          <Input label="Plan Title" required error={errors.title?.message} {...register('title', { required: 'Title is required' })} />
          <div><label className="form-label">Description</label><textarea className="input min-h-[80px]" {...register('description')} /></div>
          <Select label="Status" options={[{value:'Planned',label:'Planned'},{value:'InProgress',label:'In Progress'},{value:'Completed',label:'Completed'},{value:'OnHold',label:'On Hold'}]} {...register('status')} />
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={onDelete} loading={deleting} title="Delete Career Plan" />
    </div>
  )
}
