import api from './axios'
import type { JobResponse, CreateJobDTO, UpdateJobDTO, PagedResult } from '../types'

export interface JobFilterParams {
  search?: string
  department?: string
  status?: 'Open' | 'Closed'
  page?: number
  pageSize?: number
}

export const jobsApi = {
  getAll: (params?: JobFilterParams) =>
    api.get<PagedResult<JobResponse>>('/jobs', { params }).then((r) => r.data),
  getById: (id: number) => api.get<JobResponse>(`/jobs/${id}`).then((r) => r.data),
  create: (data: CreateJobDTO) => api.post<JobResponse>('/jobs', data).then((r) => r.data),
  update: (id: number, data: UpdateJobDTO) =>
    api.put<JobResponse>(`/jobs/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/jobs/${id}`),
}
