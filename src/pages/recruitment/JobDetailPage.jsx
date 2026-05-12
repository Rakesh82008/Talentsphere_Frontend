// Job Detail Page
//
// Shows the full description of one job. Two modes:
//   - Candidate: sees an Apply button (or "✓ Already applied").
//     A resume is required before applying.
//   - HR/Admin/Recruiter/Manager: sees a "Recent Applications" panel.

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

import { jobsApi } from '../../api/jobs'
import { applicationsApi } from '../../api/applications'
import { resumesApi } from '../../api/resumes'
import { useAuth } from '../../hooks/useAuth'

import LoadingSpinner from '../../components/common/LoadingSpinner'
import StatusBadge from '../../components/common/StatusBadge'
import Button from '../../components/common/Button'

export default function JobDetailPage() {
  const { id: jobIdParam } = useParams()
  const navigate = useNavigate()
  const { isCandidate, user } = useAuth()

  const viewingAsCandidate = isCandidate()

  const [job, setJob] = useState(null)
  const [applications, setApplications] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Candidate-only flags.
  const [hasAlreadyApplied, setHasAlreadyApplied] = useState(false)
  const [hasResume, setHasResume] = useState(false)
  const [isApplying, setIsApplying] = useState(false)

  // -----------------------------------------------------------------
  // useEffect: load the job, plus role-specific data.
  // - Candidate: also load their own applications (to know if they
  //   already applied) and their resume status.
  // - Everyone else: also load applications for this job.
  // -----------------------------------------------------------------
  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!jobIdParam) return

      setIsLoading(true)
      try {
        const numericJobId = parseInt(jobIdParam)
        const loadJob = jobsApi.getById(numericJobId)

        if (viewingAsCandidate && user) {
          const [jobResult, myApplicationsResult, resumesResult] =
            await Promise.allSettled([
              loadJob,
              applicationsApi.getByCandidate(user.userId),
              resumesApi.getByCandidate(user.userId),
            ])

          if (jobResult.status === 'fulfilled') {
            setJob(jobResult.value)
          }

          if (myApplicationsResult.status === 'fulfilled') {
            const alreadyApplied = myApplicationsResult.value.some(
              (application) => application.jobID === numericJobId
            )
            setHasAlreadyApplied(alreadyApplied)
          }

          if (resumesResult.status === 'fulfilled') {
            const resumeList = Array.isArray(resumesResult.value)
              ? resumesResult.value
              : []
            setHasResume(resumeList.length > 0)
          }
        } else {
          const [jobResult, applicationsResult] = await Promise.allSettled([
            loadJob,
            applicationsApi.getByJob(numericJobId),
          ])

          if (jobResult.status === 'fulfilled') {
            setJob(jobResult.value)
          }
          if (applicationsResult.status === 'fulfilled') {
            setApplications(applicationsResult.value)
          }
        }
      } catch {
        toast.error('Failed to load job')
      } finally {
        setIsLoading(false)
      }
    }

    fetchJobDetails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobIdParam, user])

  // -----------------------------------------------------------------
  // Handler: apply to this job (candidate only). Redirects to the
  // resume page if no resume is uploaded yet.
  // -----------------------------------------------------------------
  const handleApply = async () => {
    if (!job || !user) return

    if (!hasResume) {
      toast.error('Please upload your resume before applying.')
      navigate('/my-resume')
      return
    }

    setIsApplying(true)
    try {
      await applicationsApi.create({
        jobID: job.jobID,
        candidateID: user.userId,
      })
      toast.success('Application submitted!')
      setHasAlreadyApplied(true)
    } catch {
      toast.error('Failed to submit application')
    } finally {
      setIsApplying(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="text-center py-16 text-gray-500">Job not found.</div>
    )
  }

  const postedDate = format(
    new Date(job.postedDate || job.createdAt),
    'MMM d, yyyy'
  )
  const showApplySection = viewingAsCandidate && job.status === 'Open'

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white mb-6"
      >
        <ArrowLeftIcon className="h-4 w-4" /> Back to Jobs
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main job content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {job.title}
                </h1>
                <p className="text-gray-500 dark:text-slate-400 mt-1">
                  {job.department}
                </p>
              </div>
              <StatusBadge status={job.status} />
            </div>

            <div className="prose prose-sm max-w-none">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2">
                Job Description
              </h3>
              <p className="text-gray-600 dark:text-slate-400 whitespace-pre-wrap text-sm">
                {job.description}
              </p>

              <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mt-4 mb-2">
                Requirements
              </h3>
              <p className="text-gray-600 dark:text-slate-400 whitespace-pre-wrap text-sm">
                {job.requirements}
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-4">
              Job Details
            </h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-slate-400">Department</dt>
                <dd className="font-medium">{job.department}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-slate-400">Status</dt>
                <dd>
                  <StatusBadge status={job.status} />
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-slate-400">Posted</dt>
                <dd className="font-medium">{postedDate}</dd>
              </div>
              {!viewingAsCandidate && (
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-slate-400">
                    Applications
                  </dt>
                  <dd className="font-medium">{applications.length}</dd>
                </div>
              )}
            </dl>

            {/* Apply button or already-applied banner — candidate only */}
            {showApplySection && (
              <div className="mt-5">
                {hasAlreadyApplied ? (
                  <div className="text-center py-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    ✓ You've already applied
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    loading={isApplying}
                    onClick={handleApply}
                  >
                    Apply Now
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Recent applications panel — non-candidate roles only */}
          {!viewingAsCandidate && applications.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-3">
                Recent Applications
              </h3>
              <ul className="space-y-2">
                {applications.slice(0, 5).map((application) => (
                  <li
                    key={application.applicationID}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-700 dark:text-slate-300">
                      {application.candidateName ??
                        `Candidate #${application.candidateID}`}
                    </span>
                    <StatusBadge status={application.status} />
                  </li>
                ))}
              </ul>
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-3"
                onClick={() => navigate('/applications')}
              >
                View All
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
