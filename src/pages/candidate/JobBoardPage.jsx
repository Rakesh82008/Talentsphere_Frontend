// Job Board Page (candidate view)
//
// Lists all open job postings as cards. The candidate can search,
// view details, or apply directly from a card. A resume must already
// be uploaded before applying — otherwise we redirect them to the
// resume page.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { BriefcaseIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

import { jobsApi } from '../../api/jobs'
import { applicationsApi } from '../../api/applications'
import { resumesApi } from '../../api/resumes'
import { useAuth } from '../../contexts/AuthContext'

import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import SearchBar from '../../components/common/SearchBar'
import Button from '../../components/common/Button'
import Pagination from '../../components/common/Pagination'
import PageHeader from '../../components/common/PageHeader'

const PAGE_SIZE = 9

export default function JobBoardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // ----- Job list state -----
  const [jobs, setJobs] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)

  // ----- Search -----
  const [searchText, setSearchText] = useState('')

  // ----- Per-candidate state -----
  const [appliedJobIds, setAppliedJobIds] = useState([])
  const [hasResume, setHasResume] = useState(false)

  // ----- Loading / per-action state -----
  const [isLoading, setIsLoading] = useState(true)
  const [applyingToJobId, setApplyingToJobId] = useState(null)

  // -----------------------------------------------------------------
  // API call: load open jobs + the candidate's existing applications
  // + whether they have a resume. All three are loaded in parallel.
  // -----------------------------------------------------------------
  const fetchJobBoard = async () => {
    setIsLoading(true)
    try {
      const [jobsResult, applicationsResult, resumesResult] =
        await Promise.allSettled([
          jobsApi.getAll({
            status: 'Open',
            search: searchText || undefined,
            page: currentPage,
            pageSize: PAGE_SIZE,
          }),
          user
            ? applicationsApi.getByCandidate(user.userId)
            : Promise.resolve([]),
          user ? resumesApi.getByCandidate(user.userId) : Promise.resolve([]),
        ])

      // 1. Jobs.
      if (jobsResult.status === 'fulfilled') {
        setJobs(jobsResult.value.data ?? [])
        setTotalPages(jobsResult.value.totalPages ?? 1)
        setTotalCount(jobsResult.value.totalCount ?? 0)
      }

      // 2. Which job IDs has this candidate already applied to?
      if (applicationsResult.status === 'fulfilled') {
        const appliedIds = applicationsResult.value.map(
          (application) => application.jobID
        )
        setAppliedJobIds(appliedIds)
      }

      // 3. Does the candidate have a resume on file?
      if (resumesResult.status === 'fulfilled') {
        const resumeList = Array.isArray(resumesResult.value)
          ? resumesResult.value
          : []
        setHasResume(resumeList.length > 0)
      }
    } catch {
      toast.error('Failed to load jobs')
    } finally {
      setIsLoading(false)
    }
  }

  // useEffect: re-fetch when page or search changes.
  useEffect(() => {
    fetchJobBoard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchText])

  // -----------------------------------------------------------------
  // Handler: update search box AND reset to page 1.
  // -----------------------------------------------------------------
  const handleSearchChange = (value) => {
    setSearchText(value)
    setCurrentPage(1)
  }

  // -----------------------------------------------------------------
  // Handler: apply to a job.
  // If the candidate has no resume on file, redirect them to upload
  // one — applying without a resume isn't useful.
  // -----------------------------------------------------------------
  const handleApply = async (jobId) => {
    if (!user) return

    if (!hasResume) {
      toast.error('Please upload your resume before applying.')
      navigate('/my-resume')
      return
    }

    setApplyingToJobId(jobId)
    try {
      await applicationsApi.create({ jobID: jobId, candidateID: user.userId })
      toast.success('Application submitted!')

      // Add this jobId to the "already applied" list so the button
      // immediately becomes "✓ Applied".
      setAppliedJobIds((previousIds) => [...previousIds, jobId])
    } catch {
      toast.error('Failed to apply. You may have already applied.')
    } finally {
      setApplyingToJobId(null)
    }
  }

  // Pluralized header text.
  const positionsLabel = `${totalCount} open position${totalCount !== 1 ? 's' : ''} found`

  return (
    <div>
      <PageHeader
        title="Job Board"
        subtitle="Explore open positions and apply directly"
      />

      <div className="mb-6">
        <SearchBar
          value={searchText}
          onChange={handleSearchChange}
          placeholder="Search jobs by title or department…"
          className="max-w-md"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No open positions"
          description="There are no open positions matching your search. Check back later!"
          icon={<BriefcaseIcon className="h-8 w-8 text-gray-400" />}
        />
      ) : (
        <>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
            {positionsLabel}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            {jobs.map((job) => {
              const hasApplied = appliedJobIds.includes(job.jobID)
              const isApplyingNow = applyingToJobId === job.jobID
              const postedDate = format(
                new Date(job.postedDate || job.createdAt),
                'MMM d, yyyy'
              )

              return (
                <div key={job.jobID} className="card p-5 flex flex-col">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <BriefcaseIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-slate-100 truncate">
                        {job.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-slate-400">
                        {job.department}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-slate-400 line-clamp-3 mb-4 flex-1">
                    {job.description}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-slate-500 mb-4">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {postedDate}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/jobs/${job.jobID}`)}
                    >
                      View Details
                    </Button>

                    {hasApplied ? (
                      <span className="flex-1 text-center py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        ✓ Applied
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        className="flex-1"
                        loading={isApplyingNow}
                        onClick={() => handleApply(job.jobID)}
                      >
                        Apply
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="card">
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
      )}
    </div>
  )
}
