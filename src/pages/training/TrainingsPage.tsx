import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon, AcademicCapIcon, UserGroupIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { trainingsApi } from '../../api/trainings'
import type { TrainingResponse, TrainingStatsDTO } from '../../types'
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
import { format } from 'date-fns'

type TForm = {
  title: string
  description: string
  trainingType: string
  deliveryMode: string
  trainingLink: string
  location: string
  instructorName: string
  classStartTime: string
  classEndTime: string
  maxCapacity: string
  startDate: string
  endDate: string
  status: string
}

const TRAINING_TYPES = [
  { value: 'Mandatory', label: 'Mandatory' },
  { value: 'Onboarding', label: 'Onboarding' },
  { value: 'Technical', label: 'Technical' },
  { value: 'Leadership', label: 'Leadership' },
  { value: 'Certification', label: 'Certification' },
  { value: 'Other', label: 'Other' },
]

const DELIVERY_MODES = [
  { value: 'InPerson', label: 'In Person (Classroom)' },
  { value: 'Online', label: 'Online / Self-Paced' },
  { value: 'Virtual', label: 'Virtual (Zoom/Teams)' },
  { value: 'OnJob', label: 'On-the-Job' },
  { value: 'Assessment', label: 'Assessment / Test' },
]

const STATUSES = [
  { value: 'Planned', label: 'Planned' },
  { value: 'Active', label: 'Active' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
]

const deliveryModeLabel = (mode: string) =>
  DELIVERY_MODES.find((d) => d.value === mode)?.label ?? mode

export default function TrainingsPage() {
  const { can } = usePermissions()
  const [trainings, setTrainings] = useState<TrainingResponse[]>([])
  const [stats, setStats] = useState<TrainingStatsDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editTraining, setEditTraining] = useState<TrainingResponse | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<TForm>()
  const deliveryMode = watch('deliveryMode')

  const load = async () => {
    setLoading(true)
    try {
      const [t, s] = await Promise.allSettled([trainingsApi.getAll(), can('MANAGE_TRAININGS') ? trainingsApi.getStats() : Promise.reject()])
      if (t.status === 'fulfilled') setTrainings(t.value)
      if (s.status === 'fulfilled') setStats(s.value)
    } catch { toast.error('Failed to load trainings') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (editTraining) {
      reset({
        title: editTraining.title,
        description: editTraining.description ?? '',
        trainingType: editTraining.trainingType,
        deliveryMode: editTraining.deliveryMode,
        trainingLink: editTraining.trainingLink ?? '',
        location: editTraining.location ?? '',
        instructorName: editTraining.instructorName ?? '',
        classStartTime: editTraining.classStartTime ?? '',
        classEndTime: editTraining.classEndTime ?? '',
        maxCapacity: editTraining.maxCapacity?.toString() ?? '',
        startDate: editTraining.startDate?.split('T')[0],
        endDate: editTraining.endDate?.split('T')[0],
        status: editTraining.status,
      })
    } else {
      reset({ trainingType: 'Technical', deliveryMode: 'Online', status: 'Planned' })
    }
  }, [editTraining, showCreate, reset])

  const onSubmit = async (data: TForm) => {
    setSaving(true)
    try {
      const payload = {
        ...data,
        maxCapacity: data.maxCapacity ? parseInt(data.maxCapacity) : undefined,
      }
      if (editTraining) {
        await trainingsApi.update(editTraining.trainingID, payload)
        toast.success('Training updated')
        setEditTraining(null)
      } else {
        await trainingsApi.create(payload as any)
        toast.success('Training created')
        setShowCreate(false)
      }
      load()
    } catch { toast.error('Failed to save training') }
    finally { setSaving(false) }
  }

  const onDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await trainingsApi.remove(deleteId)
      toast.success('Training deleted')
      setDeleteId(null)
      load()
    } catch { toast.error('Failed to delete training') }
    finally { setDeleting(false) }
  }

  const filtered = trainings.filter((t) => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase())
    const matchType = !filterType || t.trainingType === filterType
    return matchSearch && matchType
  })

  const TrainingForm = () => (
    <form className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Training Title" required error={errors.title?.message}
          {...register('title', { required: 'Title is required' })} />
        <Select label="Training Type" required options={TRAINING_TYPES} {...register('trainingType')} />
      </div>
      <div><label className="form-label">Description</label>
        <textarea className="input min-h-[70px]" placeholder="What will employees learn?" {...register('description')} /></div>
      <div className="grid grid-cols-2 gap-4">
        <Select label="Delivery Mode" required options={DELIVERY_MODES} {...register('deliveryMode')} />
        <Input label="Instructor / Trainer Name" placeholder="e.g. John Smith" {...register('instructorName')} />
      </div>
      {(deliveryMode === 'Online' || deliveryMode === 'Virtual') && (
        <Input label="Meeting / Training Link" type="url" placeholder="https://zoom.us/j/... or https://udemy.com/course/..."
          {...register('trainingLink')} />
      )}
      {deliveryMode === 'InPerson' && (
        <Input label="Location / Room" placeholder="e.g. Conference Room A, 3rd Floor" {...register('location')} />
      )}
      <div className="grid grid-cols-2 gap-4">
        <Input label="Class Start Time" type="time" {...register('classStartTime')} />
        <Input label="Class End Time" type="time" {...register('classEndTime')} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Start Date"
          type="date"
          required error={errors.startDate?.message}
          {...register('startDate', { required: 'Start date is required' })}
        />
        <Input
          label="End Date"
          type="date"
          required error={errors.endDate?.message}
          {...register('endDate', { required: 'End date is required' })}
        />
        <Input label="Max Capacity" type="number" placeholder="Leave blank for unlimited" {...register('maxCapacity')} />
      </div>
      <Select label="Status" options={STATUSES} {...register('status')} />
    </form>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trainings"
        subtitle="Manage training programs and track employee learning"
        actions={can('MANAGE_TRAININGS') && (
          <Button leftIcon={<PlusIcon className="h-4 w-4" />} onClick={() => { reset({ trainingType: 'Technical', deliveryMode: 'Online', status: 'Planned' }); setShowCreate(true) }}>
            New Training
          </Button>
        )}
      />

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Trainings', value: stats.totalTrainings, icon: <AcademicCapIcon className="h-5 w-5" />, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' },
            { label: 'Total Enrollments', value: stats.totalEnrollments, icon: <UserGroupIcon className="h-5 w-5" />, color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30' },
            { label: 'Completed', value: stats.completedEnrollments, icon: <CheckCircleIcon className="h-5 w-5" />, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30' },
            { label: 'Overdue', value: stats.overdueEnrollments, icon: <ExclamationTriangleIcon className="h-5 w-5" />, color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30' },
          ].map((s) => (
            <div key={s.label} className="card p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {stats && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Overall Completion Rate</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">{stats.completionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${stats.completionRate}%` }} />
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search trainings…" className="w-72" />
          <select className="input w-48" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            {TRAINING_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No trainings" description="Create your first training program." />
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
                  {can('MANAGE_TRAININGS') && <th className="table-th">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((t) => (
                  <tr key={t.trainingID} className="hover:bg-gray-50">
                    <td className="table-td">
                      <p className="font-medium text-gray-900 dark:text-slate-100">{t.title}</p>
                      {t.instructorName && <p className="text-xs text-gray-400 dark:text-slate-500">👤 {t.instructorName}</p>}
                      {t.location && <p className="text-xs text-gray-400 dark:text-slate-500">📍 {t.location}</p>}
                      {t.trainingLink && (
                        <a href={t.trainingLink} target="_blank" rel="noreferrer" className="text-xs text-blue-500 dark:text-blue-400 hover:underline">🔗 Open Link</a>
                      )}
                    </td>
                    <td className="table-td">
                      <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">{t.trainingType}</span>
                    </td>
                    <td className="table-td text-gray-600 dark:text-slate-400 text-sm">{deliveryModeLabel(t.deliveryMode)}</td>
                    <td className="table-td text-gray-500 dark:text-slate-400 text-xs whitespace-nowrap">
                      {`${format(new Date(t.startDate), 'MMM d')} – ${format(new Date(t.endDate), 'MMM d, yyyy')}`}
                      {t.classStartTime && t.classEndTime && (
                        <p className="text-blue-600 dark:text-blue-400 font-medium mt-0.5">🕐 {t.classStartTime} – {t.classEndTime}</p>
                      )}
                    </td>
                    <td className="table-td text-gray-500 dark:text-slate-400 text-sm">{t.durationDays}d</td>
                    <td className="table-td"><StatusBadge status={t.status} /></td>
                    {can('MANAGE_TRAININGS') && (
                      <td className="table-td">
                        <div className="flex gap-2">
                          <button onClick={() => setEditTraining(t)} className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg text-amber-500"><PencilIcon className="h-4 w-4" /></button>
                          <button onClick={() => setDeleteId(t.trainingID)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500"><TrashIcon className="h-4 w-4" /></button>
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

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Training" size="lg"
        footer={<><Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>Create</Button></>}>
        <TrainingForm />
      </Modal>
      <Modal open={!!editTraining} onClose={() => setEditTraining(null)} title="Edit Training" size="lg"
        footer={<><Button variant="secondary" onClick={() => setEditTraining(null)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>Save</Button></>}>
        <TrainingForm />
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={onDelete} loading={deleting} title="Delete Training" />
    </div>
  )
}
