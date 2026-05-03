import api from './axios'
import type { InterviewResponse, CreateInterviewDTO, ScheduleInterviewDTO, UpdateInterviewStatusDTO } from '../types'

export const interviewsApi = {
  getAll: () => api.get<InterviewResponse[]>('/interviews').then((r) => r.data),
  getDetailed: () => api.get<InterviewResponse[]>('/interviews/detailed').then((r) => r.data),
  getById: (id: number) => api.get<InterviewResponse>(`/interviews/${id}`).then((r) => r.data),
  getByApplication: (applicationId: number) =>
    api.get<InterviewResponse[]>(`/interviews/application/${applicationId}`).then((r) => r.data),
  schedule: (data: ScheduleInterviewDTO) =>
    api.post<InterviewResponse>('/interviews/schedule', data).then((r) => r.data),
  create: (data: CreateInterviewDTO) =>
    api.post<InterviewResponse>('/interviews', data).then((r) => r.data),
  update: (id: number, data: Partial<CreateInterviewDTO>) =>
    api.put<InterviewResponse>(`/interviews/${id}`, data).then((r) => r.data),
  updateStatus: (id: number, data: UpdateInterviewStatusDTO) =>
    api.patch<InterviewResponse>(`/interviews/${id}/status`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/interviews/${id}`),
}
