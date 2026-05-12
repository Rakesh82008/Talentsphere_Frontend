// Applications Page
//
// HR/Admin/Recruiter/Manager view to manage incoming job applications.
// Features:
//   - Search by candidate name / job title
//   - Filter by status, paginated server-side
//   - View resume in a side modal, download as file
//   - Update application status (Pending → Reviewed → Accepted/Rejected)

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  PencilIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

import { applicationsApi } from '../../api/applications'
import { resumesApi } from '../../api/resumes'
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

const PAGE_SIZE = 10

// Options for the status-filter dropdown and the update-status form.
const STATUS_VALUES = ['Pending', 'Submitted', 'Reviewed', 'Accepted', 'Rejected']
const STATUS_OPTIONS = STATUS_VALUES.map((value) => ({ value, label: value }))

export default function ApplicationsPage() {
  const { can } = usePermissions()
  const canViewResumes = can('VIEW_ALL_RESUMES')
  const canUpdateStatus = can('UPDATE_APPLICATION_STATUS')

  // ----- List + pagination state -----
  const [applications, setApplications] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  // ----- Filters -----
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [isLoading, setIsLoading] = useState(true)

  // ----- Update-status modal -----
  const [applicationBeingEdited, setApplicationBeingEdited] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  // ----- Resume viewer modal -----
  const [applicationForResume, setApplicationForResume] = useState(null)
  const [resume, setResume] = useState(null)
  const [isResumeLoading, setIsResumeLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const { register, handleSubmit, reset } = useForm()

  // -----------------------------------------------------------------
  // API call: load applications for the current page and filter.
  // -----------------------------------------------------------------
  const fetchApplications = async () => {
    setIsLoading(true)
    try {
      const response = await applicationsApi.getAll({
        status: statusFilter || undefined,
        page: currentPage,
        pageSize: PAGE_SIZE,
      })
      setApplications(response.data ?? [])
      setTotalPages(response.totalPages ?? 1)
      setTotalCount(response.totalCount ?? 0)
    } catch {
      toast.error('Failed to load applications')
    } finally {
      setIsLoading(false)
    }
  }

  // useEffect: re-fetch when the page or status filter changes.
  useEffect(() => {
    fetchApplications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter])

  // useEffect: when the user opens the status-edit modal, pre-fill it.
  useEffect(() => {
    if (applicationBeingEdited) {
      reset({ status: applicationBeingEdited.status })
    }
  }, [applicationBeingEdited, reset])

  // -----------------------------------------------------------------
  // Handler: change status filter and reset to page 1.
  // -----------------------------------------------------------------
  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value)
    setCurrentPage(1)
  }

  // -----------------------------------------------------------------
  // Handler: submit the new status from the update modal.
  // -----------------------------------------------------------------
  const handleUpdateStatus = async (formData) => {
    if (!applicationBeingEdited) return

    setIsSaving(true)
    try {
      await applicationsApi.update(applicationBeingEdited.applicationID, {
        status: formData.status,
      })
      toast.success('Status updated')
      setApplicationBeingEdited(null)
      fetchApplications()
    } catch {
      toast.error('Failed to update status')
    } finally {
      setIsSaving(false)
    }
  }

  // -----------------------------------------------------------------
  // Handler: open the resume viewer for a given application, then
  // fetch that candidate's most recent resume.
  // -----------------------------------------------------------------
  const handleOpenResumeViewer = async (application) => {
    setApplicationForResume(application)
    setResume(null)
    setIsResumeLoading(true)
    try {
      const response = await resumesApi.getByCandidate(application.candidateID)
      const resumeList = Array.isArray(response) ? response : []
      setResume(resumeList[0] ?? null)
    } catch {
      setResume(null)
    } finally {
      setIsResumeLoading(false)
    }
  }

  // -----------------------------------------------------------------
  // Handler: close the resume viewer and clear its data.
  // -----------------------------------------------------------------
  const handleCloseResumeViewer = () => {
    setApplicationForResume(null)
    setResume(null)
  }

  // -----------------------------------------------------------------
  // Handler: download the currently-viewed resume as a file.
  //
  // We fetch the file as a Blob, build a temporary download URL with
  // URL.createObjectURL, then trigger a hidden <a> click to save it.
  // -----------------------------------------------------------------
  const handleDownloadResume = async () => {
    if (!resume) return

    setIsDownloading(true)
    try {
      const blob = await resumesApi.download(resume.resumeID)
      const downloadUrl = URL.createObjectURL(blob)

      const downloadLink = document.createElement('a')
      downloadLink.href = downloadUrl
      downloadLink.download = resume.fileURI.split('/').pop() ?? 'resume'
      downloadLink.click()

      URL.revokeObjectURL(downloadUrl)
    } catch {
      toast.error('Failed to download resume')
    } finally {
      setIsDownloading(false)
    }
  }

  // -----------------------------------------------------------------
  // Apply the search-text filter on top of the paginated results.
  // -----------------------------------------------------------------
  const filteredApplications = applications.filter((application) => {
    if (!searchText) return true

    const lowerSearch = searchText.toLowerCase()
    return (
      application.candidateName?.toLowerCase().includes(lowerSearch) ||
      application.jobTitle?.toLowerCase().includes(lowerSearch)
    )
  })

  return (
    <div>
      <PageHeader
        title="Applications"
        subtitle="Manage job applications from candidates"
      />

      <div className="card overflow-hidden">
        {/* Search + status filter */}
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-200">
          <SearchBar
            value={searchText}
            onChange={setSearchText}
            placeholder="Search by candidate or job…"
            className="flex-1 min-w-48"
          />
          <select
            className="input w-44"
            value={statusFilter}
            onChange={handleStatusFilterChange}
          >
            <option value="">All Status</option>
            {STATUS_VALUES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredApplications.length === 0 ? (
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
                  {filteredApplications.map((application) => {
                    const submittedDate = format(
                      new Date(application.submittedDate || application.createdAt),
                      'MMM d, yyyy'
                    )

                    return (
                      <tr key={application.applicationID} className="hover:bg-gray-50">
                        <td className="table-td font-medium text-gray-900 dark:text-slate-100">
                          {application.candidateName ?? `Candidate #${application.candidateID}`}
                        </td>
                        <td className="table-td">
                          {application.jobTitle ?? `Job #${application.jobID}`}
                        </td>
                        <td className="table-td text-gray-500 dark:text-slate-400">
                          {submittedDate}
                        </td>
                        <td className="table-td">
                          <StatusBadge status={application.status} />
                        </td>
                        <td className="table-td">
                          <div className="flex items-center gap-1">
                            {canViewResumes && (
                              <button
                                onClick={() => handleOpenResumeViewer(application)}
                                className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-blue-500"
                                title="View Resume"
                              >
                                <DocumentTextIcon className="h-4 w-4" />
                              </button>
                            )}

                            {canUpdateStatus && (
                              <button
                                onClick={() => setApplicationBeingEdited(application)}
                                className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg text-amber-500"
                                title="Update Status"
                              >
                                <PencilIcon className="h-4 w-4" />
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

      {/* Resume Viewer Modal */}
      <Modal
        open={!!applicationForResume}
        onClose={handleCloseResumeViewer}
        title={`Resume — ${applicationForResume?.candidateName ?? 'Candidate'}`}
        footer={
          <div className="flex justify-between w-full">
            <Button variant="secondary" onClick={handleCloseResumeViewer}>
              Close
            </Button>
            {resume && (
              <Button
                leftIcon={<ArrowDownTrayIcon className="h-4 w-4" />}
                loading={isDownloading}
                onClick={handleDownloadResume}
              >
                Download
              </Button>
            )}
          </div>
        }
      >
        {isResumeLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : resume ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <DocumentTextIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-slate-100 truncate">
                  {resume.fileURI.split('/').pop() ?? 'Resume'}
                </p>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Uploaded{' '}
                  {format(
                    new Date(resume.uploadedDate || resume.createdAt),
                    'MMMM d, yyyy'
                  )}
                </p>
              </div>
              <StatusBadge status={resume.status} />
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-400 text-center">
              Click Download to save a copy of this resume.
            </p>
          </div>
        ) : (
          <div className="py-8 text-center">
            <DocumentTextIcon className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400">
              No resume uploaded
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
              This candidate has not uploaded a resume yet.
            </p>
          </div>
        )}
      </Modal>

      {/* Update Status Modal */}
      <Modal
        open={!!applicationBeingEdited}
        onClose={() => setApplicationBeingEdited(null)}
        title="Update Application Status"
        footer={
          <>
            <Button variant="secondary" onClick={() => setApplicationBeingEdited(null)}>
              Cancel
            </Button>
            <Button loading={isSaving} onClick={handleSubmit(handleUpdateStatus)}>
              Update
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Candidate: <strong>{applicationBeingEdited?.candidateName}</strong>
            <br />
            Job: <strong>{applicationBeingEdited?.jobTitle}</strong>
          </p>
          <Select
            label="New Status"
            options={STATUS_OPTIONS}
            {...register('status')}
          />
        </form>
      </Modal>
    </div>
  )
}
