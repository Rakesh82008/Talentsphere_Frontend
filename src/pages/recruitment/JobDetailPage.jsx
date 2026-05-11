import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { jobsApi } from '../../api/jobs'
import { applicationsApi } from '../../api/applications'
import { resumesApi } from '../../api/resumes'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import StatusBadge from '../../components/common/StatusBadge'
import Button from '../../components/common/Button'
import { format } from 'date-fns'

export default function JobDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isCandidate, user } = useAuth()
  const [job, setJob] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)
  const [hasResume, setHasResume] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      setLoading(true)
      try {
        const jobPromise = jobsApi.getById(parseInt(id))

        if (isCandidate() && user) {
          const [j, myApps, resumes] = await Promise.allSettled([
            jobPromise,
            applicationsApi.getByCandidate(user.userId),
            resumesApi.getByCandidate(user.userId),
          ])
          if (j.status === 'fulfilled') setJob(j.value)
          if (myApps.status === 'fulfilled') {
            setHasApplied(myApps.value.some((a) => a.jobID === parseInt(id)))
          }
          if (resumes.status === 'fulfilled') {
            const list = Array.isArray(resumes.value) ? resumes.value : []
            setHasResume(list.length > 0)
          }
        } else {
          const [j, apps] = await Promise.allSettled([
            jobPromise,
            applicationsApi.getByJob(parseInt(id)),
          ])
          if (j.status === 'fulfilled') setJob(j.value)
          if (apps.status === 'fulfilled') setApplications(apps.value)
        }
      } catch { toast.error('Failed to load job') }
      finally { setLoading(false) }
    }
    load()
  }, [id, user])

  const applyNow = async () => {
    if (!job || !user) return
    if (!hasResume) {
      toast.error('Please upload your resume before applying.')
      navigate('/my-resume')
      return
    }
    setApplying(true)
    try {
      await applicationsApi.create({ jobID: job.jobID, candidateID: user.userId })
      toast.success('Application submitted!')
      setHasApplied(true)
    } catch { toast.error('Failed to submit application') }
    finally { setApplying(false) }
  }

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
  if (!job) return <div className="text-center py-16 text-gray-500">Job not found.</div>

  return (
    <div>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white mb-6">
        <ArrowLeftIcon className="h-4 w-4" /> Back to Jobs
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{job.title}</h1>
                <p className="text-gray-500 dark:text-slate-400 mt-1">{job.department}</p>
              </div>
              <StatusBadge status={job.status} />
            </div>
            <div className="prose prose-sm max-w-none">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2">Job Description</h3>
              <p className="text-gray-600 dark:text-slate-400 whitespace-pre-wrap text-sm">{job.description}</p>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mt-4 mb-2">Requirements</h3>
              <p className="text-gray-600 dark:text-slate-400 whitespace-pre-wrap text-sm">{job.requirements}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-4">Job Details</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500 dark:text-slate-400">Department</dt><dd className="font-medium">{job.department}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500 dark:text-slate-400">Status</dt><dd><StatusBadge status={job.status} /></dd></div>
              <div className="flex justify-between"><dt className="text-gray-500 dark:text-slate-400">Posted</dt><dd className="font-medium">{format(new Date(job.postedDate || job.createdAt), 'MMM d, yyyy')}</dd></div>
              {!isCandidate() && <div className="flex justify-between"><dt className="text-gray-500 dark:text-slate-400">Applications</dt><dd className="font-medium">{applications.length}</dd></div>}
            </dl>

            {isCandidate() && job.status === 'Open' && (
              <div className="mt-5">
                {hasApplied ? (
                  <div className="text-center py-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    ✓ You've already applied
                  </div>
                ) : (
                  <Button className="w-full" loading={applying} onClick={applyNow}>
                    Apply Now
                  </Button>
                )}
              </div>
            )}
          </div>

          {!isCandidate() && applications.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-3">Recent Applications</h3>
              <ul className="space-y-2">
                {applications.slice(0, 5).map((a) => (
                  <li key={a.applicationID} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-slate-300">{a.candidateName ?? `Candidate #${a.candidateID}`}</span>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
              <Button variant="ghost" size="sm" className="w-full mt-3" onClick={() => navigate('/applications')}>
                View All
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
