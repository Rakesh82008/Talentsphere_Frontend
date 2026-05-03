import { Fragment, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { TrashIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid'
import { applicationsApi } from '../../api/applications'
import { screeningsApi } from '../../api/screenings'
import { interviewsApi } from '../../api/interviews'
import { selectionsApi } from '../../api/selections'
import type { ApplicationResponse, ApplicationStatus, ScreeningResponse, InterviewResponse, SelectionResponse } from '../../types'
import { useAuth } from '../../hooks/useAuth'
import PageHeader from '../../components/common/PageHeader'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { format } from 'date-fns'

type StepState = 'done' | 'passed' | 'failed' | 'active' | 'upcoming'

type PipelineStep = {
  label: string
  state: StepState
  detail?: string
}

type Pipeline = {
  screening: ScreeningResponse | null
  interviews: InterviewResponse[]
  selection: SelectionResponse | null
}

function buildSteps(p: Pipeline, applicationStatus: ApplicationStatus): PipelineStep[] {
  const { screening, interviews, selection } = p
  const interview = interviews[0] ?? null

  let screeningState: StepState = 'upcoming'
  let screeningDetail: string | undefined
  if (screening) {
    if (screening.result === 'Pass') { screeningState = 'passed'; screeningDetail = 'Passed' }
    else if (screening.result === 'Fail') { screeningState = 'failed'; screeningDetail = 'Did not pass' }
    else { screeningState = 'active'; screeningDetail = 'Under review' }
  } else if (applicationStatus === 'Rejected') {
    // Recruiter rejected the application directly without going through stages
    screeningState = 'failed'
    screeningDetail = 'Not shortlisted'
  }

  let interviewState: StepState = 'upcoming'
  let interviewDetail: string | undefined
  if (interview) {
    if (interview.status === 'Passed') { interviewState = 'passed'; interviewDetail = 'Passed' }
    else if (interview.status === 'Failed') { interviewState = 'failed'; interviewDetail = 'Did not pass' }
    else if (interview.status === 'Cancelled') { interviewState = 'failed'; interviewDetail = 'Cancelled' }
    else if (interview.status === 'Completed') { interviewState = 'active'; interviewDetail = 'Awaiting result' }
    else {
      interviewState = 'active'
      try { interviewDetail = `Scheduled: ${format(new Date(interview.date), 'MMM d')}` } catch { interviewDetail = 'Scheduled' }
    }
  }

  let decisionState: StepState = 'upcoming'
  let decisionDetail: string | undefined
  if (selection) {
    if (selection.decision === 'Selected') { decisionState = 'passed'; decisionDetail = 'Hired!' }
    else { decisionState = 'failed'; decisionDetail = 'Not selected' }
  } else if (applicationStatus === 'Accepted') {
    decisionState = 'passed'
    decisionDetail = 'Accepted'
  }

  return [
    { label: 'Applied', state: 'done', detail: 'Submitted' },
    { label: 'Screening', state: screeningState, detail: screeningDetail },
    { label: 'Interview', state: interviewState, detail: interviewDetail },
    { label: 'Decision', state: decisionState, detail: decisionDetail },
  ]
}

const circleClasses: Record<StepState, string> = {
  done:     'bg-green-500 ring-2 ring-green-500',
  passed:   'bg-green-500 ring-2 ring-green-500',
  failed:   'bg-red-500 ring-2 ring-red-500',
  active:   'bg-blue-500 ring-2 ring-blue-500',
  upcoming: 'bg-white ring-2 ring-gray-200',
}

const labelClasses: Record<StepState, string> = {
  done:     'text-green-700',
  passed:   'text-green-700',
  failed:   'text-red-600',
  active:   'text-blue-700',
  upcoming: 'text-gray-400',
}

function StepCircle({ state }: { state: StepState }) {
  return (
    <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${circleClasses[state]}`}>
      {(state === 'done' || state === 'passed') && <CheckIcon className="h-5 w-5 text-white" />}
      {state === 'failed' && <XMarkIcon className="h-5 w-5 text-white" />}
      {state === 'active' && <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />}
      {state === 'upcoming' && <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />}
    </div>
  )
}

function PipelineTracker({ pipeline, applicationStatus }: { pipeline: Pipeline; applicationStatus: ApplicationStatus }) {
  const steps = buildSteps(pipeline, applicationStatus)
  return (
    <div className="mt-5 pt-4 border-t border-gray-100">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Application Progress</p>
      <div className="flex items-start">
        {steps.map((step, i) => (
          <Fragment key={step.label}>
            <div className="flex flex-col items-center w-20">
              <StepCircle state={step.state} />
              <span className={`text-xs font-semibold mt-1.5 text-center ${labelClasses[step.state]}`}>
                {step.label}
              </span>
              <span className={`text-[10px] mt-0.5 text-center leading-tight min-h-[14px] ${labelClasses[step.state]}`}>
                {step.detail ?? ''}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mt-4 transition-colors duration-300 ${
                  step.state === 'done' || step.state === 'passed' ? 'bg-green-400' : 'bg-gray-200'
                }`}
              />
            )}
          </Fragment>
        ))}
      </div>

      {/* Rejection banner when directly rejected */}
      {applicationStatus === 'Rejected' && !pipeline.selection && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-4 py-3">
          <XMarkIcon className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">
            Your application was not selected to move forward. Thank you for your interest.
          </p>
        </div>
      )}

      {/* Hired banner */}
      {(applicationStatus === 'Accepted' || pipeline.selection?.decision === 'Selected') && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 border border-green-100 px-4 py-3">
          <CheckIcon className="h-4 w-4 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700 font-medium">
            Congratulations! You have been selected. HR will be in touch with next steps.
          </p>
        </div>
      )}
    </div>
  )
}

export default function MyApplicationsPage() {
  const { user } = useAuth()
  const [applications, setApplications] = useState<ApplicationResponse[]>([])
  const [pipelines, setPipelines] = useState<Map<number, Pipeline>>(new Map())
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchPipeline = async (appId: number): Promise<Pipeline> => {
    const [s, iv, sel] = await Promise.allSettled([
      screeningsApi.getByApplication(appId),
      interviewsApi.getByApplication(appId),
      selectionsApi.getByApplication(appId),
    ])
    return {
      screening: s.status === 'fulfilled' ? s.value : null,
      interviews: iv.status === 'fulfilled' ? (Array.isArray(iv.value) ? iv.value : [iv.value as InterviewResponse]) : [],
      selection: sel.status === 'fulfilled' ? sel.value : null,
    }
  }

  const load = async () => {
    if (!user) return
    setLoading(true)
    try {
      const apps = await applicationsApi.getByCandidate(user.userId)
      const list = Array.isArray(apps) ? apps : []
      setApplications(list)
      const results = await Promise.allSettled(list.map((a) => fetchPipeline(a.applicationID)))
      const map = new Map<number, Pipeline>()
      list.forEach((a, i) => {
        const r = results[i]
        map.set(a.applicationID, r.status === 'fulfilled' ? r.value : { screening: null, interviews: [], selection: null })
      })
      setPipelines(map)
    } catch {
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [user])

  const onDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await applicationsApi.remove(deleteId)
      toast.success('Application withdrawn')
      setDeleteId(null)
      load()
    } catch {
      toast.error('Failed to withdraw application')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader title="My Applications" subtitle="Track the progress of your job applications" />

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : applications.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No applications yet"
            description="Browse open positions and apply to start your journey."
            icon={<DocumentTextIcon className="h-8 w-8 text-gray-400" />}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((a) => {
            const pipeline = pipelines.get(a.applicationID)
            return (
              <div key={a.applicationID} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900 text-base">{a.jobTitle ?? `Job #${a.jobID}`}</h3>
                      <StatusBadge status={a.status} />
                    </div>
                    <p className="text-sm text-gray-500">
                      Applied {format(new Date(a.submittedDate || a.createdAt), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  {(a.status === 'Submitted' || a.status === 'Pending') && (
                    <button
                      onClick={() => setDeleteId(a.applicationID)}
                      className="flex-shrink-0 p-2 hover:bg-red-50 rounded-lg text-red-400 transition-colors"
                      title="Withdraw application"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {pipeline ? (
                  <PipelineTracker pipeline={pipeline} applicationStatus={a.status} />
                ) : (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-center">
                    <LoadingSpinner size="sm" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={onDelete}
        loading={deleting}
        title="Withdraw Application"
        message="Are you sure you want to withdraw this application? This action cannot be undone."
        confirmLabel="Withdraw"
      />
    </div>
  )
}
