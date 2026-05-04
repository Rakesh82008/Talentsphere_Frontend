import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { jobsApi } from '../../api/jobs'
import type { JobResponse, CreateJobDTO, UpdateJobDTO } from '../../types'
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
import Pagination from '../../components/common/Pagination'
import { format } from 'date-fns'

type JobForm = { title: string; department: string; description: string; requirements: string; status: string }

export default function JobsPage() {
  const navigate = useNavigate()
  const { can } = usePermissions()
  const [jobs, setJobs] = useState<JobResponse[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editJob, setEditJob] = useState<JobResponse | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<JobForm>()

  const load = async () => {
    setLoading(true)
    try {
      const res = await jobsApi.getAll({ search: search || undefined, status: (statusFilter as 'Open' | 'Closed') || undefined, page, pageSize: 10 })
      setJobs(res.data ?? [])
      setTotalPages(res.totalPages ?? 1)
      setTotalCount(res.totalCount ?? 0)
    } catch { toast.error('Failed to load jobs') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [page, search, statusFilter])

  useEffect(() => {
    if (editJob) reset({ title: editJob.title, department: editJob.department, description: editJob.description, requirements: editJob.requirements, status: editJob.status })
    else reset({ status: 'Open' })
  }, [editJob, showCreate, reset])

  const onSubmit = async (data: JobForm) => {
    setSaving(true)
    try {
      if (editJob) {
        await jobsApi.update(editJob.jobID, data as UpdateJobDTO)
        toast.success('Job updated')
        setEditJob(null)
      } else {
        await jobsApi.create(data as CreateJobDTO)
        toast.success('Job posted')
        setShowCreate(false)
      }
      load()
    } catch { toast.error('Failed to save job') }
    finally { setSaving(false) }
  }

  const onDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await jobsApi.remove(deleteId)
      toast.success('Job deleted')
      setDeleteId(null)
      load()
    } catch { toast.error('Failed to delete job') }
    finally { setDeleting(false) }
  }

  const JobForm = () => (
    <form className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Job Title" required error={errors.title?.message} {...register('title', { required: 'Title is required' })} />
        <Input label="Department" required error={errors.department?.message} {...register('department', { required: 'Department is required' })} />
      </div>
      <div>
        <label className="form-label">Description <span className="text-red-500">*</span></label>
        <textarea className="input min-h-[100px]" {...register('description', { required: 'Description is required' })} />
        {errors.description && <p className="form-error">{errors.description.message}</p>}
      </div>
      <div>
        <label className="form-label">Requirements <span className="text-red-500">*</span></label>
        <textarea className="input min-h-[80px]" {...register('requirements', { required: 'Requirements are required' })} />
        {errors.requirements && <p className="form-error">{errors.requirements.message}</p>}
      </div>
      <Select label="Status" options={[{value:'Open',label:'Open'},{value:'Closed',label:'Closed'}]} {...register('status')} />
    </form>
  )

  return (
    <div>
      <PageHeader
        title="Job Postings"
        subtitle="Create and manage job openings"
        actions={can('MANAGE_JOBS') && (
          <Button leftIcon={<PlusIcon className="h-4 w-4" />} onClick={() => { reset({ status: 'Open' }); setShowCreate(true) }}>
            Post Job
          </Button>
        )}
      />

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-200">
          <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search jobs…" className="flex-1 min-w-48" />
          <select className="input w-36" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
            <option value="">All Status</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : jobs.length === 0 ? (
          <EmptyState title="No jobs found" description="Post your first job opening." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-th">Title</th>
                    <th className="table-th">Department</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Posted</th>
                    <th className="table-th">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {jobs.map((j) => (
                    <tr key={j.jobID} className="hover:bg-gray-50">
                      <td className="table-td font-medium text-gray-900 dark:text-slate-100">{j.title}</td>
                      <td className="table-td">{j.department}</td>
                      <td className="table-td"><StatusBadge status={j.status} /></td>
                      <td className="table-td text-gray-500 dark:text-slate-400">{format(new Date(j.postedDate || j.createdAt), 'MMM d, yyyy')}</td>
                      <td className="table-td">
                        <div className="flex items-center gap-2">
                          <button onClick={() => navigate(`/jobs/${j.jobID}`)} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-blue-500" title="View"><EyeIcon className="h-4 w-4" /></button>
                          {can('MANAGE_JOBS') && <>
                            <button onClick={() => setEditJob(j)} className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg text-amber-500" title="Edit"><PencilIcon className="h-4 w-4" /></button>
                            {can('DELETE_JOB') && <button onClick={() => setDeleteId(j.jobID)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500" title="Delete"><TrashIcon className="h-4 w-4" /></button>}
                          </>}
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

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Post New Job" size="lg"
        footer={<><Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>Post Job</Button></>}>
        <JobForm />
      </Modal>

      <Modal open={!!editJob} onClose={() => setEditJob(null)} title="Edit Job Posting" size="lg"
        footer={<><Button variant="secondary" onClick={() => setEditJob(null)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>Save</Button></>}>
        <JobForm />
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={onDelete} loading={deleting}
        title="Delete Job" message="This will permanently delete this job posting." />
    </div>
  )
}
