// Reports & Analytics Page
//
// Shows three analytics sections side-by-side:
//   1. Hiring   — job counts, applications, hires
//   2. Performance — review averages, top performers by score
//   3. Training — enrollment and completion rates
//
// Each section loads independently and only renders if its API call
// succeeded. Failures are silent because partial data is still useful.

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  UserGroupIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  StarIcon,
} from '@heroicons/react/24/outline'

import { reportsApi } from '../../api/reports'
import PageHeader from '../../components/common/PageHeader'
import LoadingSpinner from '../../components/common/LoadingSpinner'

// -------------------------------------------------------------------
// Small helpers
// -------------------------------------------------------------------

// Calculate "hired / applied" percentage safely (no divide-by-zero).
const calculateHireRate = (hiredCount, applicationCount) => {
  if (!applicationCount) return 0
  return Math.round((hiredCount / applicationCount) * 100)
}

// Convert a 0-5 score to a 0-100 percentage for the progress bar.
const scoreToPercent = (averageScore) =>
  Math.round((averageScore / 5) * 100)

// Color used for the rank number — gold/silver/bronze for top 3.
const getRankColor = (index) => {
  if (index === 0) return 'text-yellow-500'
  if (index === 2) return 'text-amber-600'
  return 'text-gray-400 dark:text-slate-500'
}

// -------------------------------------------------------------------
// Reusable stat card grid (used by all three sections)
// -------------------------------------------------------------------
function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div
        className={`${color} h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0`}
      >
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs text-gray-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  )
}

export default function ReportsPage() {
  // Each section is loaded independently so partial failures still
  // show useful data.
  const [hiringData, setHiringData] = useState(null)
  const [performanceData, setPerformanceData] = useState(null)
  const [trainingData, setTrainingData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // -----------------------------------------------------------------
  // useEffect: load all three analytics endpoints in parallel on mount.
  // Each section is set independently — if hiring fails but
  // performance succeeds, the performance section still renders.
  // -----------------------------------------------------------------
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [hiringResult, performanceResult, trainingResult] =
          await Promise.allSettled([
            reportsApi.getHiringAnalytics(),
            reportsApi.getPerformanceAnalytics(),
            reportsApi.getTrainingAnalytics(),
          ])

        if (hiringResult.status === 'fulfilled') {
          setHiringData(hiringResult.value)
        }
        if (performanceResult.status === 'fulfilled') {
          setPerformanceData(performanceResult.value)
        }
        if (trainingResult.status === 'fulfilled') {
          setTrainingData(trainingResult.value)
        }
      } catch {
        toast.error('Failed to load analytics')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // -----------------------------------------------------------------
  // Build stat card configs for each section.
  // -----------------------------------------------------------------
  const hiringStatCards = hiringData
    ? [
        { label: 'Total Jobs', value: hiringData.totalJobs, icon: BriefcaseIcon, color: 'bg-violet-500' },
        { label: 'Total Applications', value: hiringData.totalApplications, icon: ChartBarIcon, color: 'bg-blue-500' },
        { label: 'Total Hired', value: hiringData.totalHired, icon: CheckCircleIcon, color: 'bg-emerald-500' },
        { label: 'Avg. Applications / Job', value: hiringData.averageApplicationsPerJob.toFixed(1), icon: ArrowTrendingUpIcon, color: 'bg-yellow-500' },
      ]
    : []

  const performanceStatCards = performanceData
    ? [
        { label: 'Total Reviews', value: performanceData.totalReviews, icon: ChartBarIcon, color: 'bg-indigo-500' },
        { label: 'Overall Avg. Score', value: `${performanceData.overallAverageScore.toFixed(1)} / 5`, icon: StarIcon, color: 'bg-yellow-500' },
      ]
    : []

  const trainingStatCards = trainingData
    ? [
        { label: 'Total Trainings', value: trainingData.totalTrainings, icon: AcademicCapIcon, color: 'bg-pink-500' },
        { label: 'Total Enrollments', value: trainingData.totalEnrollments, icon: UserGroupIcon, color: 'bg-cyan-500' },
        { label: 'Completed', value: trainingData.completedEnrollments, icon: CheckCircleIcon, color: 'bg-emerald-500' },
        { label: 'Completion Rate', value: `${trainingData.overallCompletionRate}%`, icon: ChartBarIcon, color: 'bg-blue-500' },
      ]
    : []

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Company-wide performance metrics and insights"
      />

      {/* ───────────────────── Hiring Analytics ───────────────────── */}
      {hiringData && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Hiring Analytics
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {hiringStatCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>

          {hiringData.applicationsPerJob.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-700">
                  Applications per Job
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="table-th">Job Title</th>
                      <th className="table-th">Department</th>
                      <th className="table-th">Applications</th>
                      <th className="table-th">Hired</th>
                      <th className="table-th">Hire Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {hiringData.applicationsPerJob.map((job) => {
                      const hireRate = calculateHireRate(
                        job.hiredCount,
                        job.applicationCount
                      )

                      return (
                        <tr key={job.jobID} className="hover:bg-gray-50">
                          <td className="table-td font-medium text-gray-900 dark:text-slate-100">
                            {job.jobTitle}
                          </td>
                          <td className="table-td text-gray-500 dark:text-slate-400">
                            {job.department}
                          </td>
                          <td className="table-td text-gray-700 dark:text-slate-300">
                            {job.applicationCount}
                          </td>
                          <td className="table-td text-emerald-600 dark:text-emerald-400 font-medium">
                            {job.hiredCount}
                          </td>
                          <td className="table-td">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                                <div
                                  className="bg-emerald-500 h-1.5 rounded-full"
                                  style={{ width: `${hireRate}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-600 dark:text-slate-400 w-8">
                                {hireRate}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ─────────────────── Performance Analytics ─────────────────── */}
      {performanceData && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Performance Analytics
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {performanceStatCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Average score per department */}
            {performanceData.byDepartment.length > 0 && (
              <div className="card overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                    Performance by Department
                  </h3>
                </div>
                <div className="p-5 space-y-3">
                  {performanceData.byDepartment.map((dept) => {
                    const barWidthPercent = scoreToPercent(dept.averageScore)

                    return (
                      <div key={dept.department}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700 dark:text-slate-300 font-medium">
                            {dept.department}
                          </span>
                          <span className="text-gray-500 dark:text-slate-400">
                            {dept.averageScore.toFixed(1)} / 5 ({dept.reviewCount} reviews)
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-indigo-500 h-2 rounded-full"
                            style={{ width: `${barWidthPercent}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Top performers leaderboard */}
            {performanceData.topPerformers.length > 0 && (
              <div className="card overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                    Top Performers
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="table-th">Employee</th>
                        <th className="table-th">Department</th>
                        <th className="table-th">Avg. Score</th>
                        <th className="table-th">Reviews</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {performanceData.topPerformers.map((performer, index) => {
                        const rankColor = getRankColor(index)

                        return (
                          <tr key={performer.employeeID} className="hover:bg-gray-50">
                            <td className="table-td">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold w-5 ${rankColor}`}>
                                  #{index + 1}
                                </span>
                                <span className="font-medium text-gray-900 dark:text-slate-100">
                                  {performer.employeeName}
                                </span>
                              </div>
                            </td>
                            <td className="table-td text-gray-500 dark:text-slate-400">
                              {performer.department}
                            </td>
                            <td className="table-td">
                              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                {performer.averageScore.toFixed(1)}
                              </span>
                              <span className="text-gray-400 dark:text-slate-500 text-xs">
                                {' '}/ 5
                              </span>
                            </td>
                            <td className="table-td text-gray-500 dark:text-slate-400">
                              {performer.reviewCount}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─────────────────── Training Analytics ──────────────────── */}
      {trainingData && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Training Analytics
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {trainingStatCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>

          {trainingData.byTraining.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-700">
                  Completion by Training Program
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="table-th">Training</th>
                      <th className="table-th">Status</th>
                      <th className="table-th">Enrolled</th>
                      <th className="table-th">Completed</th>
                      <th className="table-th">Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {trainingData.byTraining.map((training) => (
                      <tr key={training.trainingID} className="hover:bg-gray-50">
                        <td className="table-td font-medium text-gray-900 dark:text-slate-100">
                          {training.title}
                        </td>
                        <td className="table-td">
                          <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">
                            {training.status}
                          </span>
                        </td>
                        <td className="table-td text-gray-600 dark:text-slate-400">
                          {training.enrollmentCount}
                        </td>
                        <td className="table-td text-emerald-600 dark:text-emerald-400 font-medium">
                          {training.completedCount}
                        </td>
                        <td className="table-td">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                              <div
                                className="bg-emerald-500 h-1.5 rounded-full"
                                style={{ width: `${training.completionRate}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 dark:text-slate-400 w-10">
                              {training.completionRate}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
