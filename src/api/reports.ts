import api from './axios'
import type { ReportResponse, CreateReportDTO, HiringAnalytics, PerformanceAnalytics, TrainingAnalytics } from '../types'

export const reportsApi = {
  getAll: () => api.get<ReportResponse[]>('/reports').then((r) => r.data),
  getById: (id: number) => api.get<ReportResponse>(`/reports/${id}`).then((r) => r.data),
  create: (data: CreateReportDTO) =>
    api.post<ReportResponse>('/reports', data).then((r) => r.data),
  update: (id: number, data: Partial<CreateReportDTO>) =>
    api.put<ReportResponse>(`/reports/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/reports/${id}`),

  getHiringAnalytics: () =>
    api.get<HiringAnalytics>('/reports/analytics/hiring').then((r) => r.data),
  getPerformanceAnalytics: () =>
    api.get<PerformanceAnalytics>('/reports/analytics/performance').then((r) => r.data),
  getTrainingAnalytics: () =>
    api.get<TrainingAnalytics>('/reports/analytics/training').then((r) => r.data),
}
