import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { BriefcaseIcon, MapPinIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { jobsApi } from '../../api/jobs'
import { applicationsApi } from '../../api/applications'
import { resumesApi } from '../../api/resumes'
import type { JobResponse } from '../../types'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import SearchBar from '../../components/common/SearchBar'
import Button from '../../components/common/Button'
import Pagination from '../../components/common/Pagination'
import PageHeader from '../../components/common/PageHeader'
import { format } from 'date-fns'

export default function JobBoardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [jobs, setJobs] = useState<JobResponse[]>([])
  const [appliedJobIds, setAppliedJobIds] = useState<number[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [applyingId, setApplyingId] = useState<number | null>(null)
  const [hasResume, setHasResume] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [j, apps, resumes] = await Promise.allSettled([
        jobsApi.getAll({ status: 'Open', search: search || undefined, page, pageSize: 9 }),
        user ? applicationsApi.getByCandidate(user.userId) : Promise.resolve([]),
        user ? resumesApi.getByCandidate(user.userId) : Promise.resolve([]),
      ])
      if (j.status === 'fulfilled') {
        setJobs(j.value.data ?? [])
        setTotalPages(j.value.totalPages ?? 1)
        setTotalCount(j.value.totalCount ?? 0)
      }
      if (apps.status === 'fulfilled') {
        setAppliedJobIds(apps.value.map((a) => a.jobID))
      }
      if (resumes.status === 'fulfilled') {
        const list = Array.isArray(resumes.value) ? resumes.value : []
        setHasResume(list.length > 0)
      }
    } catch { toast.error('Failed to load jobs') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [page, search])

  const applyNow = async (jobId: number) => {
    if (!user) return
    if (!hasResume) {
      toast.error('Please upload your resume before applying.')
      navigate('/my-resume')
      return
    }
    setApplyingId(jobId)
    try {
      await applicationsApi.create({ jobID: jobId, candidateID: user.userId })
      toast.success('Application submitted!')
      setAppliedJobIds((prev) => [...prev, jobId])
    } catch { toast.error('Failed to apply. You may have already applied.') }
    finally { setApplyingId(null) }
  }

  return (
    <div>
      <PageHeader
        title="Job Board"
        subtitle="Explore open positions and apply directly"
      />

      <div className="mb-6">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search jobs by title or department…" className="max-w-md" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No open positions"
          description="There are no open positions matching your search. Check back later!"
          icon={<BriefcaseIcon className="h-8 w-8 text-gray-400" />}
        />
      ) : (
        <>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">{totalCount} open position{totalCount !== 1 ? 's' : ''} found</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            {jobs.map((job) => {
              const applied = appliedJobIds.includes(job.jobID)
              return (
                <div key={job.jobID} className="card p-5 flex flex-col">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <BriefcaseIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-slate-100 truncate">{job.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-slate-400">{job.department}</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-slate-400 line-clamp-3 mb-4 flex-1">{job.description}</p>

                  <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-slate-500 mb-4">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {format(new Date(job.postedDate || job.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => navigate(`/jobs/${job.jobID}`)}>
                      View Details
                    </Button>
                    {applied ? (
                      <span className="flex-1 text-center py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        ✓ Applied
                      </span>
                    ) : (
                      <Button size="sm" className="flex-1" loading={applyingId === job.jobID} onClick={() => applyNow(job.jobID)}>
                        Apply
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="card">
            <Pagination page={page} totalPages={totalPages} totalCount={totalCount} pageSize={9} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  )
}
