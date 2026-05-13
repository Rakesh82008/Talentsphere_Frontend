// My Applications Page (candidate view)
//
// Shows the logged-in candidate's job applications, each with a 4-step
// progress tracker: Applied → Screening → Interview → Decision.
// The candidate can also withdraw an application that is still
// Submitted/Pending.

import { Fragment, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  TrashIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  ClockIcon,
  VideoCameraIcon,
  MapPinIcon,
  UserIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid'
import { format, differenceInCalendarDays, isPast, isToday } from 'date-fns'

import { applicationsApi } from '../../api/applications'
import { screeningsApi } from '../../api/screenings'
import { interviewsApi } from '../../api/interviews'
import { selectionsApi } from '../../api/selections'
import { useAuth } from '../../contexts/AuthContext'

import PageHeader from '../../components/common/PageHeader'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import ConfirmDialog from '../../components/common/ConfirmDialog'

// -------------------------------------------------------------------
// Step-builder helpers
//
// Each helper looks at one piece of the recruitment pipeline and
// returns { state, detail } where:
//   state  = 'done' | 'passed' | 'failed' | 'active' | 'upcoming'
//   detail = short text shown under the step label
// -------------------------------------------------------------------

const getScreeningStep = (screening, applicationStatus) => {
  if (screening) {
    if (screening.result === 'Pass') {
      return { state: 'passed', detail: 'Passed' }
    }
    if (screening.result === 'Fail') {
      return { state: 'failed', detail: 'Did not pass' }
    }
    return { state: 'active', detail: 'Under review' }
  }

  // No screening record yet, but application was rejected outright.
  if (applicationStatus === 'Rejected') {
    return { state: 'failed', detail: 'Not shortlisted' }
  }

  return { state: 'upcoming', detail: undefined }
}

const getInterviewStep = (interview) => {
  if (!interview) {
    return { state: 'upcoming', detail: undefined }
  }

  if (interview.status === 'Passed') {
    return { state: 'passed', detail: 'Passed' }
  }
  if (interview.status === 'Failed') {
    return { state: 'failed', detail: 'Did not pass' }
  }
  if (interview.status === 'Cancelled') {
    return { state: 'failed', detail: 'Cancelled' }
  }
  if (interview.status === 'Completed') {
    return { state: 'active', detail: 'Awaiting result' }
  }

  // Scheduled (or any other status) — show the date if we can parse it.
  try {
    return {
      state: 'active',
      detail: `Scheduled: ${format(new Date(interview.date), 'MMM d')}`,
    }
  } catch {
    return { state: 'active', detail: 'Scheduled' }
  }
}

const getDecisionStep = (selection) => {
  if (selection) {
    if (selection.decision === 'Selected') {
      return { state: 'passed', detail: 'Hired!' }
    }
    return { state: 'failed', detail: 'Not selected' }
  }

  return { state: 'upcoming', detail: undefined }
}

// Build the 4 steps shown in the tracker for a single application.
const buildPipelineSteps = (pipeline, applicationStatus) => {
  const firstInterview = pipeline.interviews[0] ?? null

  const screening = getScreeningStep(pipeline.screening, applicationStatus)
  const interview = getInterviewStep(firstInterview)
  const decision = getDecisionStep(pipeline.selection)

  return [
    { label: 'Applied', state: 'done', detail: 'Submitted' },
    { label: 'Screening', state: screening.state, detail: screening.detail },
    { label: 'Interview', state: interview.state, detail: interview.detail },
    { label: 'Decision', state: decision.state, detail: decision.detail },
  ]
}

// -------------------------------------------------------------------
// Styling lookups for each step state
// -------------------------------------------------------------------
const CIRCLE_CLASSES = {
  done: 'bg-green-500 ring-2 ring-green-500',
  passed: 'bg-green-500 ring-2 ring-green-500',
  failed: 'bg-red-500 ring-2 ring-red-500',
  active: 'bg-blue-500 ring-2 ring-blue-500',
  upcoming: 'bg-white dark:bg-gray-700 ring-2 ring-gray-200 dark:ring-gray-600',
}

const LABEL_CLASSES = {
  done: 'text-green-700 dark:text-green-400',
  passed: 'text-green-700 dark:text-green-400',
  failed: 'text-red-600 dark:text-red-400',
  active: 'text-blue-700 dark:text-blue-400',
  upcoming: 'text-gray-400 dark:text-slate-500',
}

// -------------------------------------------------------------------
// Small presentational components used inside the tracker.
// -------------------------------------------------------------------

function StepCircle({ state }) {
  const isDone = state === 'done' || state === 'passed'

  return (
    <div
      className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${CIRCLE_CLASSES[state]}`}
    >
      {isDone && <CheckIcon className="h-5 w-5 text-white" />}
      {state === 'failed' && <XMarkIcon className="h-5 w-5 text-white" />}
      {state === 'active' && (
        <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
      )}
      {state === 'upcoming' && (
        <span className="h-2.5 w-2.5 rounded-full bg-gray-300 dark:bg-gray-500" />
      )}
    </div>
  )
}

const isMeetingLink = (value) =>
  typeof value === 'string' && /^https?:\/\//i.test(value.trim())

// Build a human-friendly "in 3 days" / "Today" / "Tomorrow" label.
const getTimeUntilLabel = (interviewDate) => {
  if (!interviewDate || isNaN(interviewDate.getTime())) return null
  if (isToday(interviewDate)) return { text: 'Today', tone: 'urgent' }
  if (isPast(interviewDate)) return { text: 'Past', tone: 'muted' }

  const days = differenceInCalendarDays(interviewDate, new Date())
  if (days === 1) return { text: 'Tomorrow', tone: 'soon' }
  if (days <= 7) return { text: `In ${days} days`, tone: 'soon' }
  return { text: `In ${days} days`, tone: 'normal' }
}

// Format "14:00" or "14:00:00" into "2:00 PM". Falls back to the raw value.
const formatTimeOfDay = (timeString) => {
  if (!timeString) return null
  const match = String(timeString).match(/^(\d{1,2}):(\d{2})/)
  if (!match) return timeString

  const hours24 = parseInt(match[1], 10)
  const minutes = match[2]
  const period = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = ((hours24 + 11) % 12) + 1
  return `${hours12}:${minutes} ${period}`
}

function InterviewDetails({ interview }) {
  if (!interview) return null

  // Don't show details for interviews that are no longer upcoming/active.
  const hiddenStatuses = ['Cancelled', 'Failed']
  if (hiddenStatuses.includes(interview.status)) return null

  const interviewDate = interview.date ? new Date(interview.date) : null
  const hasValidDate = interviewDate && !isNaN(interviewDate.getTime())

  const dayOfWeek = hasValidDate ? format(interviewDate, 'EEE').toUpperCase() : null
  const dayNumber = hasValidDate ? format(interviewDate, 'd') : null
  const monthShort = hasValidDate ? format(interviewDate, 'MMM').toUpperCase() : null
  const fullDate = hasValidDate ? format(interviewDate, 'EEEE, MMMM d, yyyy') : null

  const timeLabel = formatTimeOfDay(interview.time)
  const timeUntil = getTimeUntilLabel(interviewDate)
  const isCompleted = interview.status === 'Completed'

  const locationValue = interview.location?.trim() ?? ''
  const locationIsLink = isMeetingLink(locationValue)

  const toneStyles = {
    urgent: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 ring-1 ring-rose-200 dark:ring-rose-800',
    soon: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-800',
    normal: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-800',
    muted: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-slate-400 ring-1 ring-gray-200 dark:ring-gray-700',
  }

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-indigo-200 dark:border-indigo-800/60 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950/40 dark:via-gray-900 dark:to-purple-950/30 shadow-sm">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-indigo-100 dark:border-indigo-900/60 bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
            <CalendarDaysIcon className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
              {isCompleted ? 'Interview Completed' : 'Interview Scheduled'}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {isCompleted
                ? 'Awaiting feedback from your interviewer'
                : 'Make sure to be ready a few minutes early'}
            </p>
          </div>
        </div>

        {timeUntil && !isCompleted && (
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${toneStyles[timeUntil.tone]}`}
          >
            {timeUntil.text}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex flex-col sm:flex-row gap-5">
        {/* Big calendar tile */}
        {hasValidDate && (
          <div className="flex-shrink-0 w-20 sm:w-24 rounded-xl overflow-hidden bg-white dark:bg-gray-900 ring-1 ring-indigo-200 dark:ring-indigo-800 shadow-sm">
            <div className="bg-indigo-600 text-white text-[10px] font-bold tracking-widest text-center py-1">
              {monthShort}
            </div>
            <div className="text-center py-2">
              <div className="text-3xl font-bold text-gray-900 dark:text-slate-100 leading-none">
                {dayNumber}
              </div>
              <div className="text-[10px] font-semibold tracking-wider text-gray-500 dark:text-slate-400 mt-1">
                {dayOfWeek}
              </div>
            </div>
          </div>
        )}

        {/* Details column */}
        <div className="flex-1 min-w-0 space-y-2.5 text-sm">
          {fullDate && (
            <div className="flex items-start gap-2 text-gray-700 dark:text-slate-300">
              <CalendarDaysIcon className="h-4 w-4 flex-shrink-0 mt-0.5 text-indigo-500 dark:text-indigo-400" />
              <span className="font-medium">{fullDate}</span>
            </div>
          )}

          {timeLabel && (
            <div className="flex items-start gap-2 text-gray-700 dark:text-slate-300">
              <ClockIcon className="h-4 w-4 flex-shrink-0 mt-0.5 text-indigo-500 dark:text-indigo-400" />
              <span className="font-medium">{timeLabel}</span>
            </div>
          )}

          {interview.interviewerName && (
            <div className="flex items-start gap-2 text-gray-700 dark:text-slate-300">
              <UserIcon className="h-4 w-4 flex-shrink-0 mt-0.5 text-indigo-500 dark:text-indigo-400" />
              <span>
                with{' '}
                <span className="font-medium text-gray-900 dark:text-slate-100">
                  {interview.interviewerName}
                </span>
              </span>
            </div>
          )}

          {locationValue && !locationIsLink && (
            <div className="flex items-start gap-2 text-gray-700 dark:text-slate-300">
              <MapPinIcon className="h-4 w-4 flex-shrink-0 mt-0.5 text-indigo-500 dark:text-indigo-400" />
              <span className="break-words">{locationValue}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer CTA */}
      {locationValue && locationIsLink && !isCompleted && (
        <div className="px-5 pb-4">
          <a
            href={locationValue}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold shadow-sm shadow-indigo-600/20 transition-colors"
          >
            <VideoCameraIcon className="h-4 w-4" />
            Join Video Meeting
            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
          </a>
          <p className="mt-2 text-xs text-gray-500 dark:text-slate-400 break-all">
            Link: {locationValue}
          </p>
        </div>
      )}
    </div>
  )
}

function PipelineTracker({ pipeline, applicationStatus }) {
  const steps = buildPipelineSteps(pipeline, applicationStatus)
  const isHired = pipeline.selection?.decision === 'Selected'
  const isRejected =
    applicationStatus === 'Rejected' && !pipeline.selection

  return (
    <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
      <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-4">
        Application Progress
      </p>

      <div className="flex items-start">
        {steps.map((step, index) => {
          const isLastStep = index === steps.length - 1
          const isPreviousDone =
            step.state === 'done' || step.state === 'passed'

          return (
            <Fragment key={step.label}>
              <div className="flex flex-col items-center w-20">
                <StepCircle state={step.state} />
                <span
                  className={`text-xs font-semibold mt-1.5 text-center ${LABEL_CLASSES[step.state]}`}
                >
                  {step.label}
                </span>
                <span
                  className={`text-[10px] mt-0.5 text-center leading-tight min-h-[14px] ${LABEL_CLASSES[step.state]}`}
                >
                  {step.detail ?? ''}
                </span>
              </div>

              {/* Connector line between steps */}
              {!isLastStep && (
                <div
                  className={`flex-1 h-0.5 mt-4 transition-colors duration-300 ${
                    isPreviousDone
                      ? 'bg-green-400'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </Fragment>
          )
        })}
      </div>

      {/* Upcoming interview details (date, time, link/location) */}
      <InterviewDetails interview={pipeline.interviews[0] ?? null} />

      {/* Banner shown when the application was rejected outright */}
      {isRejected && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 px-4 py-3">
          <XMarkIcon className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">
            Your application was not selected to move forward. Thank you for
            your interest.
          </p>
        </div>
      )}

      {/* Banner shown when the candidate has been hired */}
      {isHired && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 px-4 py-3">
          <CheckIcon className="h-4 w-4 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-400 font-medium">
            Congratulations! You have been selected. HR will be in touch with
            next steps.
          </p>
        </div>
      )}
    </div>
  )
}

// -------------------------------------------------------------------
// Main page component
// -------------------------------------------------------------------
export default function MyApplicationsPage() {
  const { user } = useAuth()

  const [applications, setApplications] = useState([])
  // Map of applicationID -> { screening, interviews, selection }.
  // We keep these separate from applications because they are loaded
  // in a second pass after the list of applications comes back.
  const [pipelinesById, setPipelinesById] = useState(new Map())

  const [isLoading, setIsLoading] = useState(true)
  const [appIdToWithdraw, setAppIdToWithdraw] = useState(null)
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  // -----------------------------------------------------------------
  // API call: for a single application, fetch its screening,
  // interviews and selection in parallel. Any individual call that
  // fails (e.g. there is no interview yet) is treated as "no data".
  // -----------------------------------------------------------------
  const fetchPipelineForApplication = async (applicationId) => {
    const [screeningResult, interviewsResult, selectionResult] =
      await Promise.allSettled([
        screeningsApi.getByApplication(applicationId),
        interviewsApi.getByApplication(applicationId),
        selectionsApi.getByApplication(applicationId),
      ])

    // Interviews can come back as either an array or a single object.
    let interviews = []
    if (interviewsResult.status === 'fulfilled') {
      interviews = Array.isArray(interviewsResult.value)
        ? interviewsResult.value
        : [interviewsResult.value]
    }

    return {
      screening:
        screeningResult.status === 'fulfilled' ? screeningResult.value : null,
      interviews,
      selection:
        selectionResult.status === 'fulfilled' ? selectionResult.value : null,
    }
  }

  // -----------------------------------------------------------------
  // API call: load all applications for the logged-in candidate, then
  // fetch each application's pipeline data in parallel.
  // -----------------------------------------------------------------
  const fetchApplications = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // 1. Load the list of applications for this candidate.
      const response = await applicationsApi.getByCandidate(user.userId)
      const applicationList = Array.isArray(response) ? response : []
      setApplications(applicationList)

      // 2. For each application, load its pipeline (screening, etc).
      const pipelineResults = await Promise.allSettled(
        applicationList.map((application) =>
          fetchPipelineForApplication(application.applicationID)
        )
      )

      // 3. Build a Map keyed by applicationID so each card can quickly
      //    look up its pipeline data when rendering.
      const newPipelineMap = new Map()
      applicationList.forEach((application, index) => {
        const result = pipelineResults[index]
        if (result.status === 'fulfilled') {
          newPipelineMap.set(application.applicationID, result.value)
        } else {
          newPipelineMap.set(application.applicationID, {
            screening: null,
            interviews: [],
            selection: null,
          })
        }
      })
      setPipelinesById(newPipelineMap)
    } catch {
      toast.error('Failed to load applications')
    } finally {
      setIsLoading(false)
    }
  }

  // useEffect: reload when the user becomes available (or changes).
  useEffect(() => {
    fetchApplications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // -----------------------------------------------------------------
  // Handler: withdraw an application after the user confirms.
  // -----------------------------------------------------------------
  const handleWithdraw = async () => {
    if (!appIdToWithdraw) return

    setIsWithdrawing(true)
    try {
      await applicationsApi.remove(appIdToWithdraw)
      toast.success('Application withdrawn')
      setAppIdToWithdraw(null)
      fetchApplications()
    } catch {
      toast.error('Failed to withdraw application')
    } finally {
      setIsWithdrawing(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="My Applications"
        subtitle="Track the progress of your job applications"
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
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
          {applications.map((application) => {
            const pipeline = pipelinesById.get(application.applicationID)
            const canWithdraw =
              application.status === 'Submitted' ||
              application.status === 'Pending'
            const appliedDate = format(
              new Date(application.submittedDate || application.createdAt),
              'MMMM d, yyyy'
            )

            return (
              <div key={application.applicationID} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-slate-100 text-base">
                        {application.jobTitle ?? `Job #${application.jobID}`}
                      </h3>
                      <StatusBadge status={application.status} />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      Applied {appliedDate}
                    </p>
                  </div>

                  {canWithdraw && (
                    <button
                      onClick={() => setAppIdToWithdraw(application.applicationID)}
                      className="flex-shrink-0 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-400 transition-colors"
                      title="Withdraw application"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {pipeline ? (
                  <PipelineTracker
                    pipeline={pipeline}
                    applicationStatus={application.status}
                  />
                ) : (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-center">
                    <LoadingSpinner size="sm" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!appIdToWithdraw}
        onClose={() => setAppIdToWithdraw(null)}
        onConfirm={handleWithdraw}
        loading={isWithdrawing}
        title="Withdraw Application"
        message="Are you sure you want to withdraw this application? This action cannot be undone."
        confirmLabel="Withdraw"
      />
    </div>
  )
}
