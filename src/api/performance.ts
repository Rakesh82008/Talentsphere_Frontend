import api from './axios'
import type { PerformanceReviewResponse, CreatePerformanceReviewDTO, UpdatePerformanceReviewDTO } from '../types'

export const performanceApi = {
  getAll: (employeeId?: number) =>
    api
      .get<PerformanceReviewResponse[]>('/performance-reviews', {
        params: employeeId ? { employeeId } : undefined,
      })
      .then((r) => r.data),
  getById: (id: number) =>
    api.get<PerformanceReviewResponse>(`/performance-reviews/${id}`).then((r) => r.data),
  create: (data: CreatePerformanceReviewDTO) =>
    api.post<PerformanceReviewResponse>('/performance-reviews', data).then((r) => r.data),
  update: (id: number, data: UpdatePerformanceReviewDTO) =>
    api.put<PerformanceReviewResponse>(`/performance-reviews/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/performance-reviews/${id}`),
}
