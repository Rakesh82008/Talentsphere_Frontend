import api from './axios'
import type { AuditResponse, CreateAuditDTO, AuditLogResponse } from '../types'

export const auditsApi = {
  getAll: () => api.get<AuditResponse[]>('/audits').then((r) => r.data),
  getById: (id: number) => api.get<AuditResponse>(`/audits/${id}`).then((r) => r.data),
  create: (data: CreateAuditDTO) => api.post<AuditResponse>('/audits', data).then((r) => r.data),
  update: (id: number, data: Partial<CreateAuditDTO>) =>
    api.put<AuditResponse>(`/audits/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/audits/${id}`),

  // Audit Logs (Admin only)
  getLogs: () => api.get<AuditLogResponse[]>('/auditlogs').then((r) => r.data),
  getLogById: (id: number) => api.get<AuditLogResponse>(`/auditlogs/${id}`).then((r) => r.data),
  deleteLog: (id: number) => api.delete(`/auditlogs/${id}`),
}
