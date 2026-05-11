import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusIcon, CheckCircleIcon, TrashIcon, ExclamationTriangleIcon, VideoCameraIcon } from '@heroicons/react/24/outline'
import { enrollmentsApi } from '../../api/enrollments'
import { trainingsApi } from '../../api/trainings'
import { employeesApi } from '../../api/employees'
import { useAuth } from '../../hooks/useAuth'
import { usePermissions } from '../../hooks/usePermissions'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Select from '../../components/common/Select'
import Input from '../../components/common/Input'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import { format } from 'date-fns'

export default function EnrollmentsPage() {
  const { can } = usePermissions()
  const { isEmployee } = useAuth()
  const [enrollments, setEnrollments] = useState([])
  const [trainings, setTrainings] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [completeId, setCompleteId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const enrollForm = useForm()
  const completeForm = useForm()

  const load = async () => {
    setLoading(true)
    try {
      if (isEmployee()) {
        const emp = await employeesApi.getMe().catch(() => null)
        const [e, t] = await Promise.allSettled([
          emp ? enrollmentsApi.getByEmployee(emp.employeeID) : Promise.resolve([]),
          trainingsApi.getAll(),
        ])
        if (e.status === 'fulfilled') setEnrollments(e.value)
        if (t.status === 'fulfilled') setTrainings(t.value)
      } else {
        const [e, t, emp] = await Promise.allSettled([
          enrollmentsApi.getAll(),
          trainingsApi.getAll(),
          employeesApi.getAll(),
        ])
        if (e.status === 'fulfilled') setEnrollments(e.value)
        if (t.status === 'fulfilled') setTrainings(t.value)
        if (emp.status === 'fulfilled') setEmployees(emp.value)
      }
    } catch { toast.error('Failed to load enrollments') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const onEnroll = async (data) => {
    setSaving(true)
    try {
      await enrollmentsApi.create({
        employeeID: parseInt(data.employeeID),
        trainingID: parseInt(data.trainingID),
      })
      toast.success('Enrolled successfully')
      setShowCreate(false)
      enrollForm.reset()
      load()
    } catch { toast.error('Failed to enroll') }
    finally { setSaving(false) }
  }

  const onComplete = async (data) => {
    if (!completeId) return
    setSaving(true)
    try {
      await enrollmentsApi.complete(completeId, {
        score: data.score ? parseInt(data.score) : undefined,
        notes: data.notes || undefined,
        certificateUrl: data.certificateUrl || undefined,
      })
      toast.success('Marked as completed')
      setCompleteId(null)
      completeForm.reset()
      load()
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to complete')
    } finally { setSaving(false) }
  }

  const onDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await enrollmentsApi.remove(deleteId)
      toast.success('Enrollment removed')
      setDeleteId(null)
      load()
    } catch { toast.error('Failed to remove enrollment') }
    finally { setDeleting(false) }
  }

  const getStatusBadge = (e) => {
    if (e.isOverdue) return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
        <ExclamationTriangleIcon className="h-3 w-3" /> Overdue
      </span>
    )
    return <StatusBadge status={e.status} />
  }

  return (
    <div>
      <PageHeader
        title={isEmployee() ? 'My Training' : 'Enrollments'}
        subtitle="Track employee training progress and completion"
        actions={can('MANAGE_ENROLLMENTS') && (
          <Button leftIcon={<PlusIcon className="h-4 w-4" />} onClick={() => { enrollForm.reset(); setShowCreate(true) }}>
            Enroll Employee
          </Button>
        )}
      />

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : enrollments.length === 0 ? (
          <EmptyState title="No enrollments" description="Enroll employees in training programs to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {!isEmployee() && <th className="table-th">Employee</th>}
                  <th className="table-th">Training</th>
                  <th className="table-th">Type / Mode</th>
                  <th className="table-th">Enrolled</th>
                  <th className="table-th">Progress</th>
                  <th className="table-th">Status</th>
                  {!isEmployee() && <th className="table-th">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {enrollments.map((e) => (
                  <tr key={e.enrollmentID} className={`hover:bg-gray-50 ${e.isOverdue ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                    {!isEmployee() && <td className="table-td font-medium">{e.employeeName ?? `#${e.employeeID}`}</td>}
                    <td className="table-td">
                      <p className="font-medium text-gray-900 dark:text-slate-100">{e.trainingTitle ?? `Training #${e.trainingID}`}</p>
                      {e.trainingStartDate && e.trainingEndDate && (
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                          📅 {format(new Date(e.trainingStartDate), 'MMM d')} – {format(new Date(e.trainingEndDate), 'MMM d, yyyy')}
                        </p>
                      )}
                      {e.classStartTime && e.classEndTime && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                          🕐 {e.classStartTime} – {e.classEndTime}
                        </p>
                      )}
                      {(e.deliveryMode === 'Online' || e.deliveryMode === 'Virtual') && e.trainingLink && (
                        <a
                          href={e.trainingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                        >
                          <VideoCameraIcon className="h-3 w-3" />
                          Join Training
                        </a>
                      )}
                    </td>
                    <td className="table-td">
                      {e.trainingType && <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-full block w-fit mb-0.5">{e.trainingType}</span>}
                      {e.deliveryMode && <span className="text-xs text-gray-500 dark:text-slate-400">{e.deliveryMode}</span>}
                    </td>
                    <td className="table-td text-gray-500 dark:text-slate-400 text-sm">
                      {format(new Date(e.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="table-td text-xs text-gray-500 dark:text-slate-400">
                      {e.completedAt ? (
                        <span className="text-emerald-600 dark:text-emerald-400">✓ {format(new Date(e.completedAt), 'MMM d, yyyy')}</span>
                      ) : e.startedAt ? (
                        <span className="text-blue-600 dark:text-blue-400">Started {format(new Date(e.startedAt), 'MMM d')}</span>
                      ) : (
                        <span className="text-gray-400 dark:text-slate-500">Not started</span>
                      )}
                      {e.score != null && <p className="text-gray-700 dark:text-slate-300 font-medium">Score: {e.score}/100</p>}
                    </td>
                    <td className="table-td">{getStatusBadge(e)}</td>
                    {!isEmployee() && (
                      <td className="table-td">
                        <div className="flex gap-1.5">
                          {can('MANAGE_ENROLLMENTS') && e.status !== 'Completed' && e.status !== 'Cancelled' && (
                            <button
                              onClick={() => { completeForm.reset(); setCompleteId(e.enrollmentID) }}
                              className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-500"
                              title="Mark Complete"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                            </button>
                          )}
                          {can('MANAGE_ENROLLMENTS') && (
                            <button onClick={() => setDeleteId(e.enrollmentID)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500" title="Remove">
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
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

      {/* Enroll Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Enroll Employee in Training"
        footer={<><Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button loading={saving} onClick={enrollForm.handleSubmit(onEnroll)}>Enroll</Button></>}>
        <form className="space-y-4">
          <Select label="Employee" required placeholder="Select employee" error={enrollForm.formState.errors.employeeID?.message}
            options={employees.map((e) => ({ value: e.employeeID, label: e.name }))}
            {...enrollForm.register('employeeID', { required: 'Employee is required' })} />
          <Select label="Training Program" required placeholder="Select training" error={enrollForm.formState.errors.trainingID?.message}
            options={trainings.map((t) => ({ value: t.trainingID, label: `${t.title} (${t.trainingType})` }))}
            {...enrollForm.register('trainingID', { required: 'Training is required' })} />
          <p className="text-xs text-gray-500 dark:text-slate-400">Employee will be notified when enrolled.</p>
        </form>
      </Modal>

      {/* Complete Modal */}
      <Modal open={!!completeId} onClose={() => setCompleteId(null)} title="Mark Training Complete"
        footer={<><Button variant="secondary" onClick={() => setCompleteId(null)}>Cancel</Button><Button loading={saving} onClick={completeForm.handleSubmit(onComplete)}>Mark Complete</Button></>}>
        <form className="space-y-4">
          <Input label="Score (0–100, optional)" type="number" placeholder="e.g. 85" {...completeForm.register('score')} />
          <div>
            <label className="form-label">Notes (optional)</label>
            <textarea className="input min-h-[70px]" placeholder="Any notes about the completion..." {...completeForm.register('notes')} />
          </div>
          <Input label="Certificate URL (optional)" type="url" placeholder="https://..." {...completeForm.register('certificateUrl')} />
          <p className="text-xs text-gray-500 dark:text-slate-400">Employee will receive a completion notification.</p>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={onDelete} loading={deleting} title="Remove Enrollment" />
    </div>
  )
}
