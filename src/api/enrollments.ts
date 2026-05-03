import api from './axios'
import type { EnrollmentResponse, CreateEnrollmentDTO, CompleteEnrollmentDTO } from '../types'

export const enrollmentsApi = {
  getAll: () => api.get<EnrollmentResponse[]>('/enrollments').then((r) => r.data),
  getById: (id: number) => api.get<EnrollmentResponse>(`/enrollments/${id}`).then((r) => r.data),
  getByEmployee: (employeeId: number) =>
    api.get<EnrollmentResponse[]>(`/enrollments/employee/${employeeId}`).then((r) => r.data),
  create: (data: CreateEnrollmentDTO) =>
    api.post<EnrollmentResponse>('/enrollments', data).then((r) => r.data),
  start: (id: number) =>
    api.patch<{ data: EnrollmentResponse }>(`/enrollments/${id}/start`).then((r) => r.data.data),
  complete: (id: number, dto: CompleteEnrollmentDTO = {}) =>
    api.patch<{ data: EnrollmentResponse }>(`/enrollments/${id}/complete`, dto).then((r) => r.data.data),
  remove: (id: number) => api.delete(`/enrollments/${id}`),
}
