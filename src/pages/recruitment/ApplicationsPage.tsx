import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PencilIcon, DocumentTextIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { applicationsApi } from '../../api/applications'
import { resumesApi } from '../../api/resumes'
import type { ApplicationResponse, ResumeResponse } from '../../types'
import { usePermissions } from '../../hooks/usePermissions'
import PageHeader from '../../components/common/PageHeader'
import Select from '../../components/common/Select'
import Modal from '../../components/common/Modal'
import Button from '../../components/common/Button'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import SearchBar from '../../components/common/SearchBar'
import Pagination from '../../components/common/Pagination'
import { format } from 'date-fns'

export default function ApplicationsPage() {
  const { can } = usePermissions()
  const [applications, setApplications] = useState<ApplicationResponse[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [editApp, setEditApp] = useState<ApplicationResponse | null>(null)
  const [saving, setSaving] = useState(false)

  // Resume viewer state
  const [resumeApp, setResumeApp] = useState<ApplicationResponse | null>(null)
  const [resume, setResume] = useState<ResumeResponse | null>(null)
  const [resumeLoading, setResumeLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const { register, handleSubmit, reset } = useForm<{ status: string }>()

  const load = async () => {
    setLoading(true)
    try {
      const res = await applicationsApi.getAll({ status: statusFilter || undefined, page, pageSize: 10 })
      setApplications(res.data ?? [])
      setTotalPages(res.totalPages ?? 1)
      setTotalCount(res.totalCount ?? 0)
    } catch { toast.error('Failed to load applications') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [page, statusFilter])
  useEffect(() => { if (editApp) reset({ status: editApp.status }) }, [editApp, reset])

  const onUpdateStatus = async (data: { status: string }) => {
    if (!editApp) return
    setSaving(true)
    try {
      await applicationsApi.update(editApp.applicationID, { status: data.status as ApplicationResponse['status'] })
      toast.success('Status updated')
      setEditApp(null)
      load()
    } catch { toast.error('Failed to update status') }
    finally { setSaving(false) }
  }

  const openResumeViewer = async (app: ApplicationResponse) => {
    setResumeApp(app)
    setResume(null)
    setResumeLoading(true)
    try {
      const list = await resumesApi.getByCandidate(app.candidateID)
      const resumes = Array.isArray(list) ? list : []
      setResume(resumes[0] ?? null)
    } catch {
      setResume(null)
    } finally {
      setResumeLoading(false)
    }
  }

  const onDownload = async () => {
    if (!resume) return
    setDownloading(true)
    try {
      const blob = await resumesApi.download(resume.resumeID)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = resume.fileURI.split('/').pop() ?? 'resume'
      a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Failed to download resume') }
    finally { setDownloading(false) }
  }

  const filtered = applications.filter((a) =>
    !search ||
    a.candidateName?.toLowerCase().includes(search.toLowerCase()) ||
    a.jobTitle?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <PageHeader title="Applications" subtitle="Manage job applications from candidates" />

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-200">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by candidate or job…" className="flex-1 min-w-48" />
          <select className="input w-44" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
            <option value="">All Status</option>
            {['Pending','Submitted','Reviewed','Accepted','Rejected'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No applications found" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-th">Candidate</th>
                    <th className="table-th">Job Title</th>
                    <th className="table-th">Submitted</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((a) => (
                    <tr key={a.applicationID} className="hover:bg-gray-50">
                      <td className="table-td font-medium text-gray-900">{a.candidateName ?? `Candidate #${a.candidateID}`}</td>
                      <td className="table-td">{a.jobTitle ?? `Job #${a.jobID}`}</td>
                      <td className="table-td text-gray-500">{format(new Date(a.submittedDate || a.createdAt), 'MMM d, yyyy')}</td>
                      <td className="table-td"><StatusBadge status={a.status} /></td>
                      <td className="table-td">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openResumeViewer(a)}
                            className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500"
                            title="View Resume"
                          >
                            <DocumentTextIcon className="h-4 w-4" />
                          </button>
                          {can('UPDATE_APPLICATION_STATUS') && (
                            <button onClick={() => setEditApp(a)} className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-500" title="Update Status">
                              <PencilIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} totalCount={totalCount} pageSize={10} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Resume Viewer Modal */}
      <Modal
        open={!!resumeApp}
        onClose={() => { setResumeApp(null); setResume(null) }}
        title={`Resume — ${resumeApp?.candidateName ?? 'Candidate'}`}
        footer={
          <div className="flex justify-between w-full">
            <Button variant="secondary" onClick={() => { setResumeApp(null); setResume(null) }}>Close</Button>
            {resume && (
              <Button leftIcon={<ArrowDownTrayIcon className="h-4 w-4" />} loading={downloading} onClick={onDownload}>
                Download
              </Button>
            )}
          </div>
        }
      >
        {resumeLoading ? (
          <div className="flex justify-center py-8"><LoadingSpinner size="md" /></div>
        ) : resume ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <DocumentTextIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{resume.fileURI.split('/').pop() ?? 'Resume'}</p>
                <p className="text-sm text-gray-500">
                  Uploaded {format(new Date(resume.uploadedDate || resume.createdAt), 'MMMM d, yyyy')}
                </p>
              </div>
              <StatusBadge status={resume.status} />
            </div>
            <p className="text-sm text-gray-500 text-center">Click Download to save a copy of this resume.</p>
          </div>
        ) : (
          <div className="py-8 text-center">
            <DocumentTextIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-500">No resume uploaded</p>
            <p className="text-xs text-gray-400 mt-1">This candidate has not uploaded a resume yet.</p>
          </div>
        )}
      </Modal>

      {/* Update Status Modal */}
      <Modal open={!!editApp} onClose={() => setEditApp(null)} title="Update Application Status"
        footer={<><Button variant="secondary" onClick={() => setEditApp(null)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onUpdateStatus)}>Update</Button></>}>
        <form className="space-y-4">
          <p className="text-sm text-gray-500">
            Candidate: <strong>{editApp?.candidateName}</strong><br />
            Job: <strong>{editApp?.jobTitle}</strong>
          </p>
          <Select label="New Status" options={[
            {value:'Pending',label:'Pending'},{value:'Submitted',label:'Submitted'},
            {value:'Reviewed',label:'Reviewed'},{value:'Accepted',label:'Accepted'},{value:'Rejected',label:'Rejected'},
          ]} {...register('status')} />
        </form>
      </Modal>
    </div>
  )
}
