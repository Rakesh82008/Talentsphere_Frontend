import api from './axios'
import type { ComplianceRecordResponse, CreateComplianceRecordDTO } from '../types'

export const complianceApi = {
  getAll: () => api.get<ComplianceRecordResponse[]>('/compliances').then((r) => r.data),
  getById: (id: number) =>
    api.get<ComplianceRecordResponse>(`/compliances/${id}`).then((r) => r.data),
  create: (data: CreateComplianceRecordDTO) =>
    api.post<ComplianceRecordResponse>('/compliances', data).then((r) => r.data),
  update: (id: number, data: Partial<CreateComplianceRecordDTO>) =>
    api.put<ComplianceRecordResponse>(`/compliances/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/compliances/${id}`),
}
