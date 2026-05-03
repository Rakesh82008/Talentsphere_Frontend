import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { screeningsApi } from '../../api/screenings'
import { applicationsApi } from '../../api/applications'
import type { ScreeningResponse, CreateScreeningDTO, ApplicationResponse } from '../../types'
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

type ScreenForm = { applicationID: string; result: string; feedback: string }

export default function ScreeningsPage() {
  const [screenings, setScreenings] = useState<ScreeningResponse[]>([])
  const [applications, setApplications] = useState<ApplicationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editScreening, setEditScreening] = useState<ScreeningResponse | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ScreenForm>()

  const load = async () => {
    setLoading(true)
    try {
      const [s, a] = await Promise.allSettled([screeningsApi.getAll(), applicationsApi.getAll({ page: 1, pageSize: 100 })])
      if (s.status === 'fulfilled') setScreenings(Array.isArray(s.value) ? s.value : [])
      if (a.status === 'fulfilled') setApplications(a.value?.data ?? [])
    } catch { toast.error('Failed to load screenings') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    if (editScreening) reset({ applicationID: String(editScreening.applicationID), result: editScreening.result, feedback: editScreening.feedback ?? '' })
    else reset({ result: 'Pending' })
  }, [editScreening, showCreate, reset])

  const onSubmit = async (data: ScreenForm) => {
    setSaving(true)
    try {
      if (editScreening) {
        await screeningsApi.update(editScreening.screeningID, { result: data.result as ScreeningResponse['result'], feedback: data.feedback })
        toast.success('Screening updated')
        setEditScreening(null)
      } else {
        await screeningsApi.create({ applicationID: parseInt(data.applicationID), result: data.result as CreateScreeningDTO['result'], feedback: data.feedback })
        toast.success('Screening created')
        setShowCreate(false)
      }
      load()
    } catch { toast.error('Failed to save screening') }
    finally { setSaving(false) }
  }

  const onDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await screeningsApi.remove(deleteId)
      toast.success('Screening deleted')
      setDeleteId(null)
      load()
    } catch { toast.error('Failed to delete screening') }
    finally { setDeleting(false) }
  }

  const filtered = screenings.filter((s) =>
    !search || s.candidateName?.toLowerCase().includes(search.toLowerCase()) || s.jobTitle?.toLowerCase().includes(search.toLowerCase())
  )

  const ScreenForm = () => (
    <form className="space-y-4">
      {!editScreening && (
        <Select label="Application" required placeholder="Select application" error={errors.applicationID?.message}
          options={applications.map((a) => ({ value: a.applicationID, label: `${a.candidateName ?? 'Candidate'} — ${a.jobTitle ?? 'Job #' + a.jobID}` }))}
          {...register('applicationID', { required: 'Application is required' })} />
      )}
      <Select label="Result" required options={[{value:'Pending',label:'Pending'},{value:'Pass',label:'Pass'},{value:'Fail',label:'Fail'}]}
        error={errors.result?.message} {...register('result', { required: true })} />
      <div>
        <label className="form-label">Feedback</label>
        <textarea className="input min-h-[80px]" {...register('feedback')} />
      </div>
    </form>
  )

  return (
    <div>
      <PageHeader
        title="Screening"
        subtitle="Review and screen job applications"
        actions={<Button leftIcon={<PlusIcon className="h-4 w-4" />} onClick={() => { reset({ result: 'Pending' }); setShowCreate(true) }}>New Screening</Button>}
      />

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by candidate or job…" className="w-80" />
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No screenings yet" description="Start screening applications." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-th">Candidate</th>
                  <th className="table-th">Job</th>
                  <th className="table-th">Result</th>
                  <th className="table-th">Feedback</th>
                  <th className="table-th">Date</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((s) => (
                  <tr key={s.screeningID} className="hover:bg-gray-50">
                    <td className="table-td font-medium">{s.candidateName ?? `Application #${s.applicationID}`}</td>
                    <td className="table-td">{s.jobTitle ?? '—'}</td>
                    <td className="table-td"><StatusBadge status={s.result} /></td>
                    <td className="table-td text-gray-500 max-w-xs truncate">{s.feedback ?? '—'}</td>
                    <td className="table-td text-gray-500">{format(new Date(s.createdAt), 'MMM d, yyyy')}</td>
                    <td className="table-td">
                      <div className="flex gap-2">
                        <button onClick={() => setEditScreening(s)} className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-500"><PencilIcon className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteId(s.screeningID)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><TrashIcon className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Screening"
        footer={<><Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>Save</Button></>}>
        <ScreenForm />
      </Modal>
      <Modal open={!!editScreening} onClose={() => setEditScreening(null)} title="Edit Screening"
        footer={<><Button variant="secondary" onClick={() => setEditScreening(null)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>Update</Button></>}>
        <ScreenForm />
      </Modal>
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={onDelete} loading={deleting} />
    </div>
  )
}
