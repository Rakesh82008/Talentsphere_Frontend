import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusIcon } from '@heroicons/react/24/outline'
import { selectionsApi } from '../../api/selections'
import { applicationsApi } from '../../api/applications'
import type { SelectionResponse, ApplicationResponse } from '../../types'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Select from '../../components/common/Select'
import Modal from '../../components/common/Modal'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import SearchBar from '../../components/common/SearchBar'
import { format } from 'date-fns'

type DecisionForm = { applicationID: string; decision: string; notes: string }

export default function SelectionsPage() {
  const [selections, setSelections] = useState<SelectionResponse[]>([])
  const [applications, setApplications] = useState<ApplicationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showDecide, setShowDecide] = useState(false)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DecisionForm>()

  const load = async () => {
    setLoading(true)
    try {
      const [s, a] = await Promise.allSettled([
        selectionsApi.getDetailed(),
        applicationsApi.getAll({ page: 1, pageSize: 200 }),
      ])
      const decidedIds = new Set(
        s.status === 'fulfilled' ? (s.value ?? []).map((sel) => sel.applicationID) : []
      )
      if (s.status === 'fulfilled') setSelections(s.value ?? [])
      if (a.status === 'fulfilled') {
        const all = a.value.data ?? []
        setApplications(
          all.filter((app) => !decidedIds.has(app.applicationID))
        )
      }
    } catch { toast.error('Failed to load selections') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const onDecide = async (data: DecisionForm) => {
    setSaving(true)
    try {
      await selectionsApi.decide({
        applicationID: parseInt(data.applicationID),
        decision: data.decision as 'Selected' | 'Rejected',
        notes: data.notes,
      })
      toast.success(data.decision === 'Selected' ? 'Candidate selected! Employee record created.' : 'Candidate rejected. Notification sent.')
      setShowDecide(false)
      reset()
      load()
    } catch { toast.error('Failed to make decision') }
    finally { setSaving(false) }
  }

  const filtered = selections.filter((s) =>
    !search ||
    s.candidateName?.toLowerCase().includes(search.toLowerCase()) ||
    s.jobTitle?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PageHeader
        title="Final Selections"
        subtitle="Make hiring decisions — selecting a candidate auto-creates an employee record"
        actions={<Button leftIcon={<PlusIcon className="h-4 w-4" />} onClick={() => { reset({ decision: 'Selected' }); setShowDecide(true) }}>Make Decision</Button>}
      />

      <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
        <strong>Workflow:</strong> When you select a candidate, the system automatically creates an Employee record and promotes the user role from Candidate to Employee.
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <SearchBar value={search} onChange={setSearch} placeholder="Search selections…" className="w-80" />
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No selections yet" description="Make your first hiring decision." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-th">Candidate</th>
                  <th className="table-th">Job</th>
                  <th className="table-th">Decision</th>
                  <th className="table-th">Notes</th>
                  <th className="table-th">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((s) => (
                  <tr key={s.selectionID} className="hover:bg-gray-50">
                    <td className="table-td font-medium">{s.candidateName ?? `Application #${s.applicationID}`}</td>
                    <td className="table-td">{s.jobTitle ?? '—'}</td>
                    <td className="table-td"><StatusBadge status={s.decision} /></td>
                    <td className="table-td text-gray-500 max-w-xs truncate">{s.notes ?? '—'}</td>
                    <td className="table-td text-gray-500">{format(new Date(s.date || s.createdAt), 'MMM d, yyyy')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showDecide} onClose={() => setShowDecide(false)} title="Make Selection Decision" size="lg"
        footer={<><Button variant="secondary" onClick={() => setShowDecide(false)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onDecide)}>Confirm Decision</Button></>}>
        <form className="space-y-4">
          <Select label="Application" required placeholder="Select application" error={errors.applicationID?.message}
            options={applications.map((a) => ({ value: a.applicationID, label: `${a.candidateName ?? 'Candidate'} — ${a.jobTitle ?? 'Job #' + a.jobID}` }))}
            {...register('applicationID', { required: 'Application is required' })} />
          <Select label="Decision" required options={[{value:'Selected',label:'✓ Selected — Create Employee'},{value:'Rejected',label:'✗ Rejected — Notify Candidate'}]}
            error={errors.decision?.message} {...register('decision', { required: 'Decision is required' })} />
          <div>
            <label className="form-label">Notes</label>
            <textarea className="input min-h-[80px]" placeholder="Optional notes about the decision…" {...register('notes')} />
          </div>
        </form>
      </Modal>
    </div>
  )
}
