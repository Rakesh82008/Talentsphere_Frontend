import api from './axios'
import type { ApplicationResponse, CreateApplicationDTO, UpdateApplicationDTO, PagedResult } from '../types'

export interface ApplicationFilterParams {
  jobId?: number
  candidateId?: number
  status?: string
  page?: number
  pageSize?: number
}

export const applicationsApi = {
  getAll: (params?: ApplicationFilterParams) =>
    api.get<PagedResult<ApplicationResponse>>('/applications', { params }).then((r) => r.data),
  getById: (id: number) =>
    api.get<ApplicationResponse>(`/applications/${id}`).then((r) => r.data),
  getByJob: (jobId: number) =>
    api.get<ApplicationResponse[]>(`/applications/job/${jobId}`).then((r) => r.data),
  getByCandidate: (candidateId: number) =>
    api.get<ApplicationResponse[]>(`/applications/candidate/${candidateId}`).then((r) => r.data),
  create: (data: CreateApplicationDTO) =>
    api.post<ApplicationResponse>('/applications', data).then((r) => r.data),
  update: (id: number, data: UpdateApplicationDTO) =>
    api.put<ApplicationResponse>(`/applications/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/applications/${id}`),
}
