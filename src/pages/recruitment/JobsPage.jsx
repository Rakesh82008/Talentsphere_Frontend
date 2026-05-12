// Jobs Page
//
// Lists all job postings with server-side pagination + search + status
// filter. HR/Admin/Recruiter (MANAGE_JOBS) can post new jobs and edit
// existing ones. Admin only (DELETE_JOB) can permanently delete.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

import { jobsApi } from '../../api/jobs'
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

const PAGE_SIZE = 10

const STATUS_OPTIONS = [
  { value: 'Open', label: 'Open' },
  { value: 'Closed', label: 'Closed' },
]

export default function JobsPage() {
  const navigate = useNavigate()
  const { can } = usePermissions()
  const canManageJobs = can('MANAGE_JOBS')
  const canDeleteJob = can('DELETE_JOB')

  // ----- List + pagination -----
  const [jobs, setJobs] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  // ----- Filters -----
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [isLoading, setIsLoading] = useState(true)

  // ----- Modal state -----
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [jobBeingEdited, setJobBeingEdited] = useState(null)
  const [jobIdToDelete, setJobIdToDelete] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  // -----------------------------------------------------------------
  // API call: load jobs page from the server with the current search,
  // status filter and page number.
  // -----------------------------------------------------------------
  const fetchJobs = async () => {
    setIsLoading(true)
    try {
      const response = await jobsApi.getAll({
        search: searchText || undefined,
        status: statusFilter || undefined,
        page: currentPage,
        pageSize: PAGE_SIZE,
      })
      setJobs(response.data ?? [])
      setTotalPages(response.totalPages ?? 1)
      setTotalCount(response.totalCount ?? 0)
    } catch {
      toast.error('Failed to load jobs')
    } finally {
      setIsLoading(false)
    }
  }

  // useEffect: re-fetch whenever page, search or status filter changes.
  useEffect(() => {
    fetchJobs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchText, statusFilter])

  // useEffect: pre-fill the form when opening edit, or use defaults
  // when opening create.
  useEffect(() => {
    if (jobBeingEdited) {
      reset({
        title: jobBeingEdited.title,
        department: jobBeingEdited.department,
        description: jobBeingEdited.description,
        requirements: jobBeingEdited.requirements,
        status: jobBeingEdited.status,
      })
    } else {
      reset({ status: 'Open' })
    }
  }, [jobBeingEdited, isCreateModalOpen, reset])

  // -----------------------------------------------------------------
  // Handler: open the "Post Job" modal with default values.
  // -----------------------------------------------------------------
  const handleOpenCreateModal = () => {
    reset({ status: 'Open' })
    setIsCreateModalOpen(true)
  }

  // -----------------------------------------------------------------
  // Handler: change search box. Reset to page 1 so we don't ask the
  // server for page 8 of a 2-page filtered result set.
  // -----------------------------------------------------------------
  const handleSearchChange = (value) => {
    setSearchText(value)
    setCurrentPage(1)
  }

  // -----------------------------------------------------------------
  // Handler: change status dropdown. Same page-reset rule applies.
  // -----------------------------------------------------------------
  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value)
    setCurrentPage(1)
  }

  // -----------------------------------------------------------------
  // Handler: submit create or edit form.
  // -----------------------------------------------------------------
  const handleFormSubmit = async (formData) => {
    setIsSaving(true)
    try {
      if (jobBeingEdited) {
        await jobsApi.update(jobBeingEdited.jobID, formData)
        toast.success('Job updated')
        setJobBeingEdited(null)
      } else {
        await jobsApi.create(formData)
        toast.success('Job posted')
        setIsCreateModalOpen(false)
      }
      fetchJobs()
    } catch {
      toast.error('Failed to save job')
    } finally {
      setIsSaving(false)
    }
  }

  // -----------------------------------------------------------------
  // Handler: delete a job after the user confirms.
  // -----------------------------------------------------------------
  const handleDelete = async () => {
    if (!jobIdToDelete) return

    setIsDeleting(true)
    try {
      await jobsApi.remove(jobIdToDelete)
      toast.success('Job deleted')
      setJobIdToDelete(null)
      fetchJobs()
    } catch {
      toast.error('Failed to delete job')
    } finally {
      setIsDeleting(false)
    }
  }

  // -----------------------------------------------------------------
  // Render the create/edit form (used by both modals).
  // -----------------------------------------------------------------
  const renderJobForm = () => (
    <form className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Job Title"
          required
          error={errors.title?.message}
          {...register('title', { required: 'Title is required' })}
        />
        <Input
          label="Department"
          required
          error={errors.department?.message}
          {...register('department', { required: 'Department is required' })}
        />
      </div>

      <div>
        <label className="form-label">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          className="input min-h-[100px]"
          {...register('description', { required: 'Description is required' })}
        />
        {errors.description && (
          <p className="form-error">{errors.description.message}</p>
        )}
      </div>

      <div>
        <label className="form-label">
          Requirements <span className="text-red-500">*</span>
        </label>
        <textarea
          className="input min-h-[80px]"
          {...register('requirements', { required: 'Requirements are required' })}
        />
        {errors.requirements && (
          <p className="form-error">{errors.requirements.message}</p>
        )}
      </div>

      <Select label="Status" options={STATUS_OPTIONS} {...register('status')} />
    </form>
  )

  return (
    <div>
      <PageHeader
        title="Job Postings"
        subtitle="Create and manage job openings"
        actions={
          canManageJobs && (
            <Button
              leftIcon={<PlusIcon className="h-4 w-4" />}
              onClick={handleOpenCreateModal}
            >
              Post Job
            </Button>
          )
        }
      />

      <div className="card overflow-hidden">
        {/* Search + status filter */}
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-200">
          <SearchBar
            value={searchText}
            onChange={handleSearchChange}
            placeholder="Search jobs…"
            className="flex-1 min-w-48"
          />
          <select
            className="input w-36"
            value={statusFilter}
            onChange={handleStatusFilterChange}
          >
            <option value="">All Status</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState
            title="No jobs found"
            description="Post your first job opening."
          />
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
                  {jobs.map((job) => {
                    const postedDate = format(
                      new Date(job.postedDate || job.createdAt),
                      'MMM d, yyyy'
                    )

                    return (
                      <tr key={job.jobID} className="hover:bg-gray-50">
                        <td className="table-td font-medium text-gray-900 dark:text-slate-100">
                          {job.title}
                        </td>
                        <td className="table-td">{job.department}</td>
                        <td className="table-td">
                          <StatusBadge status={job.status} />
                        </td>
                        <td className="table-td text-gray-500 dark:text-slate-400">
                          {postedDate}
                        </td>
                        <td className="table-td">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/jobs/${job.jobID}`)}
                              className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-blue-500"
                              title="View"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>

                            {canManageJobs && (
                              <button
                                onClick={() => setJobBeingEdited(job)}
                                className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg text-amber-500"
                                title="Edit"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                            )}

                            {canManageJobs && canDeleteJob && (
                              <button
                                onClick={() => setJobIdToDelete(job.jobID)}
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500"
                                title="Delete"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              page={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* Create modal */}
      <Modal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Post New Job"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button loading={isSaving} onClick={handleSubmit(handleFormSubmit)}>
              Post Job
            </Button>
          </>
        }
      >
        {renderJobForm()}
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!jobBeingEdited}
        onClose={() => setJobBeingEdited(null)}
        title="Edit Job Posting"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setJobBeingEdited(null)}>
              Cancel
            </Button>
            <Button loading={isSaving} onClick={handleSubmit(handleFormSubmit)}>
              Save
            </Button>
          </>
        }
      >
        {renderJobForm()}
      </Modal>

      <ConfirmDialog
        open={!!jobIdToDelete}
        onClose={() => setJobIdToDelete(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title="Delete Job"
        message="This will permanently delete this job posting."
      />
    </div>
  )
}
