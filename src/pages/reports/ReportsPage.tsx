import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  UserGroupIcon, BriefcaseIcon, AcademicCapIcon,
  ChartBarIcon, ArrowTrendingUpIcon, CheckCircleIcon, StarIcon,
} from '@heroicons/react/24/outline'
import { reportsApi } from '../../api/reports'
import type { HiringAnalytics, PerformanceAnalytics, TrainingAnalytics } from '../../types'
import PageHeader from '../../components/common/PageHeader'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function ReportsPage() {
  const [hiring, setHiring] = useState<HiringAnalytics | null>(null)
  const [performance, setPerformance] = useState<PerformanceAnalytics | null>(null)
  const [training, setTraining] = useState<TrainingAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      reportsApi.getHiringAnalytics(),
      reportsApi.getPerformanceAnalytics(),
      reportsApi.getTrainingAnalytics(),
    ]).then(([h, p, t]) => {
      if (h.status === 'fulfilled') setHiring(h.value)
      if (p.status === 'fulfilled') setPerformance(p.value)
      if (t.status === 'fulfilled') setTraining(t.value)
    }).catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>

  return (
    <div className="space-y-8">
      <PageHeader title="Reports & Analytics" subtitle="Company-wide performance metrics and insights" />

      {/* ── Hiring Analytics ── */}
      {hiring && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Hiring Analytics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Jobs', value: hiring.totalJobs, icon: BriefcaseIcon, color: 'bg-violet-500' },
              { label: 'Total Applications', value: hiring.totalApplications, icon: ChartBarIcon, color: 'bg-blue-500' },
              { label: 'Total Hired', value: hiring.totalHired, icon: CheckCircleIcon, color: 'bg-emerald-500' },
              { label: 'Avg. Applications / Job', value: hiring.averageApplicationsPerJob.toFixed(1), icon: ArrowTrendingUpIcon, color: 'bg-yellow-500' },
            ].map((s) => (
              <div key={s.label} className="card p-5 flex items-center gap-4">
                <div className={`${s.color} h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <s.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {hiring.applicationsPerJob.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-700">Applications per Job</h3>
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
                    {hiring.applicationsPerJob.map((j) => {
                      const rate = j.applicationCount > 0 ? Math.round((j.hiredCount / j.applicationCount) * 100) : 0
                      return (
                        <tr key={j.jobID} className="hover:bg-gray-50">
                          <td className="table-td font-medium text-gray-900 dark:text-slate-100">{j.jobTitle}</td>
                          <td className="table-td text-gray-500 dark:text-slate-400">{j.department}</td>
                          <td className="table-td text-gray-700 dark:text-slate-300">{j.applicationCount}</td>
                          <td className="table-td text-emerald-600 dark:text-emerald-400 font-medium">{j.hiredCount}</td>
                          <td className="table-td">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${rate}%` }} />
                              </div>
                              <span className="text-xs text-gray-600 dark:text-slate-400 w-8">{rate}%</span>
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

      {/* ── Performance Analytics ── */}
      {performance && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Analytics</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              { label: 'Total Reviews', value: performance.totalReviews, icon: ChartBarIcon, color: 'bg-indigo-500' },
              { label: 'Overall Avg. Score', value: `${performance.overallAverageScore.toFixed(1)} / 5`, icon: StarIcon, color: 'bg-yellow-500' },
            ].map((s) => (
              <div key={s.label} className="card p-5 flex items-center gap-4">
                <div className={`${s.color} h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <s.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {performance.byDepartment.length > 0 && (
              <div className="card overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">Performance by Department</h3>
                </div>
                <div className="p-5 space-y-3">
                  {performance.byDepartment.map((d) => {
                    const pct = Math.round((d.averageScore / 5) * 100)
                    return (
                      <div key={d.department}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-700 dark:text-slate-300 font-medium">{d.department}</span>
                          <span className="text-gray-500 dark:text-slate-400">{d.averageScore.toFixed(1)} / 5 ({d.reviewCount} reviews)</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                          <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {performance.topPerformers.length > 0 && (
              <div className="card overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">Top Performers</h3>
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
                      {performance.topPerformers.map((p, i) => (
                        <tr key={p.employeeID} className="hover:bg-gray-50">
                          <td className="table-td">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold w-5 ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400 dark:text-slate-500' : i === 2 ? 'text-amber-600' : 'text-gray-400 dark:text-slate-500'}`}>#{i + 1}</span>
                              <span className="font-medium text-gray-900 dark:text-slate-100">{p.employeeName}</span>
                            </div>
                          </td>
                          <td className="table-td text-gray-500 dark:text-slate-400">{p.department}</td>
                          <td className="table-td">
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{p.averageScore.toFixed(1)}</span>
                            <span className="text-gray-400 dark:text-slate-500 text-xs"> / 5</span>
                          </td>
                          <td className="table-td text-gray-500 dark:text-slate-400">{p.reviewCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Training Analytics ── */}
      {training && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Training Analytics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Trainings', value: training.totalTrainings, icon: AcademicCapIcon, color: 'bg-pink-500' },
              { label: 'Total Enrollments', value: training.totalEnrollments, icon: UserGroupIcon, color: 'bg-cyan-500' },
              { label: 'Completed', value: training.completedEnrollments, icon: CheckCircleIcon, color: 'bg-emerald-500' },
              { label: 'Completion Rate', value: `${training.overallCompletionRate}%`, icon: ChartBarIcon, color: 'bg-blue-500' },
            ].map((s) => (
              <div key={s.label} className="card p-5 flex items-center gap-4">
                <div className={`${s.color} h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <s.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {training.byTraining.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-700">Completion by Training Program</h3>
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
                    {training.byTraining.map((t) => (
                      <tr key={t.trainingID} className="hover:bg-gray-50">
                        <td className="table-td font-medium text-gray-900 dark:text-slate-100">{t.title}</td>
                        <td className="table-td">
                          <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">{t.status}</span>
                        </td>
                        <td className="table-td text-gray-600 dark:text-slate-400">{t.enrollmentCount}</td>
                        <td className="table-td text-emerald-600 dark:text-emerald-400 font-medium">{t.completedCount}</td>
                        <td className="table-td">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${t.completionRate}%` }} />
                            </div>
                            <span className="text-xs text-gray-600 dark:text-slate-400 w-10">{t.completionRate}%</span>
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
