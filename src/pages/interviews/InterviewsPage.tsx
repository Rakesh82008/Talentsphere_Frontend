import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { interviewsApi } from '../../api/interviews'
import { applicationsApi } from '../../api/applications'
import { usersApi } from '../../api/users'
import type { InterviewResponse, ApplicationResponse, UserResponse } from '../../types'
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

type IForm = { applicationID: string; date: string; time: string; location: string; interviewerID: string }
type StatusForm = { status: string; feedback: string }

const NEXT_STATUSES: Record<string, { value: string; label: string }[]> = {
  Pending:   [{ value: 'Scheduled', label: 'Scheduled' }, { value: 'Cancelled', label: 'Cancelled' }],
  Scheduled: [{ value: 'Completed', label: 'Completed' }, { value: 'Passed', label: 'Passed' }, { value: 'Failed', label: 'Failed' }, { value: 'Cancelled', label: 'Cancelled' }],
  Completed: [{ value: 'Passed', label: 'Passed' }, { value: 'Failed', label: 'Failed' }],
  Passed:    [],
  Failed:    [],
  Cancelled: [],
}

export default function InterviewsPage() {
  const { can } = usePermissions()
  const [interviews, setInterviews] = useState<InterviewResponse[]>([])
  const [applications, setApplications] = useState<ApplicationResponse[]>([])
  const [users, setUsers] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [statusInterview, setStatusInterview] = useState<InterviewResponse | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<IForm>()
  const { register: regStatus, handleSubmit: handleStatusSubmit, reset: resetStatus } = useForm<StatusForm>()

  const load = async () => {
    setLoading(true)
    try {
      const [iv, apps, u] = await Promise.allSettled([
        interviewsApi.getAll(),
        applicationsApi.getAll({ page: 1, pageSize: 100 }),
        usersApi.getAll(),
      ])
      if (iv.status === 'fulfilled') setInterviews(Array.isArray(iv.value) ? iv.value : [])
      if (apps.status === 'fulfilled') setApplications(apps.value?.data ?? [])
      if (u.status === 'fulfilled') setUsers(Array.isArray(u.value) ? u.value : [])
    } catch { toast.error('Failed to load interviews') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { if (statusInterview) resetStatus({ status: statusInterview.status, feedback: statusInterview.feedback ?? '' }) }, [statusInterview, resetStatus])

  const onSchedule = async (data: IForm) => {
    setSaving(true)
    try {
      await interviewsApi.schedule({
        applicationID: parseInt(data.applicationID),
        date: data.date,
        time: data.time,
        location: data.location,
        interviewerID: parseInt(data.interviewerID),
      })
      toast.success('Interview scheduled')
      setShowCreate(false)
      reset()
      load()
    } catch { toast.error('Failed to schedule interview') }
    finally { setSaving(false) }
  }

  const onUpdateStatus = async (data: StatusForm) => {
    if (!statusInterview) return
    setSaving(true)
    try {
      await interviewsApi.updateStatus(statusInterview.interviewID, {
        status: data.status as InterviewResponse['status'],
        feedback: data.feedback,
      })
      toast.success('Status updated')
      setStatusInterview(null)
      load()
    } catch { toast.error('Failed to update status') }
    finally { setSaving(false) }
  }

  const onDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await interviewsApi.remove(deleteId)
      toast.success('Interview deleted')
      setDeleteId(null)
      load()
    } catch { toast.error('Failed to delete interview') }
    finally { setDeleting(false) }
  }

  const filtered = interviews.filter((i) =>
    !search ||
    i.candidateName?.toLowerCase().includes(search.toLowerCase()) ||
    i.jobTitle?.toLowerCase().includes(search.toLowerCase()) ||
    i.interviewerName?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PageHeader
        title="Interviews"
        subtitle="Schedule and manage candidate interviews"
        actions={can('MANAGE_INTERVIEWS') && (
          <Button leftIcon={<PlusIcon className="h-4 w-4" />} onClick={() => { reset(); setShowCreate(true) }}>
            Schedule Interview
          </Button>
        )}
      />

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <SearchBar value={search} onChange={setSearch} placeholder="Search interviews…" className="w-80" />
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No interviews scheduled" description="Schedule your first interview." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-th">Candidate</th>
                  <th className="table-th">Job</th>
                  <th className="table-th">Date & Time</th>
                  <th className="table-th">Location</th>
                  <th className="table-th">Interviewer</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((i) => (
                  <tr key={i.interviewID} className="hover:bg-gray-50">
                    <td className="table-td font-medium">{i.candidateName ?? `App #${i.applicationID}`}</td>
                    <td className="table-td">{i.jobTitle ?? '—'}</td>
                    <td className="table-td text-gray-600 dark:text-slate-400">{format(new Date(i.date), 'MMM d, yyyy')} {i.time}</td>
                    <td className="table-td">{i.location}</td>
                    <td className="table-td">{i.interviewerName ?? `User #${i.interviewerID}`}</td>
                    <td className="table-td"><StatusBadge status={i.status} /></td>
                    <td className="table-td">
                      <div className="flex gap-2">
                        {can('MANAGE_INTERVIEWS') && <>
                          <button onClick={() => setStatusInterview(i)} className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg text-amber-500" title="Update Status"><PencilIcon className="h-4 w-4" /></button>
                          <button onClick={() => setDeleteId(i.interviewID)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500" title="Delete"><TrashIcon className="h-4 w-4" /></button>
                        </>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Schedule Interview" size="lg"
        footer={<><Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSchedule)}>Schedule</Button></>}>
        <form className="space-y-4">
          <Select label="Application" required placeholder="Select application" error={errors.applicationID?.message}
            options={applications
              .filter((a) => a.status !== 'Rejected' && a.status !== 'Accepted')
              .map((a) => ({ value: a.applicationID, label: `${a.candidateName ?? 'Candidate'} — ${a.jobTitle ?? 'Job #' + a.jobID}` }))}
            {...register('applicationID', { required: 'Application is required' })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" type="date" required error={errors.date?.message} {...register('date', { required: 'Date is required' })} />
            <Input label="Time" type="time" required error={errors.time?.message} {...register('time', { required: 'Time is required' })} />
          </div>
          <Input label="Location / Link" required error={errors.location?.message} {...register('location', { required: 'Location is required' })} />
          <Select label="Interviewer" required placeholder="Select interviewer" error={errors.interviewerID?.message}
            options={users.map((u) => ({ value: u.userID, label: `${u.name} (${u.email})` }))}
            {...register('interviewerID', { required: 'Interviewer is required' })} />
        </form>
      </Modal>

      {/* Update Status Modal */}
      <Modal open={!!statusInterview} onClose={() => setStatusInterview(null)} title="Update Interview Status"
        footer={<><Button variant="secondary" onClick={() => setStatusInterview(null)}>Cancel</Button><Button loading={saving} onClick={handleStatusSubmit(onUpdateStatus)} disabled={!NEXT_STATUSES[statusInterview?.status ?? '']?.length}>Update</Button></>}>
        <form className="space-y-4">
          {statusInterview && NEXT_STATUSES[statusInterview.status]?.length ? (
            <>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Current status: <span className="font-medium text-gray-700 dark:text-slate-300">{statusInterview.status}</span>
              </p>
              <Select
                label="New Status"
                options={NEXT_STATUSES[statusInterview.status]}
                {...regStatus('status')}
              />
              <div>
                <label className="form-label">Feedback</label>
                <textarea className="input min-h-[80px]" {...regStatus('feedback')} />
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500 dark:text-slate-400 py-4 text-center">
              This interview is <strong>{statusInterview?.status}</strong> and cannot be updated further.
            </p>
          )}
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={onDelete} loading={deleting} title="Delete Interview" />
    </div>
  )
}
