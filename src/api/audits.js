import api from './axios'

export const auditsApi = {
  getAll: () => api.get('/audits').then((r) => r.data),
  getById: (id) => api.get(`/audits/${id}`).then((r) => r.data),
  create: (data) => api.post('/audits', data).then((r) => r.data),
  update: (id, data) =>
    api.put(`/audits/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/audits/${id}`),

  // Audit Logs (Admin only)
  getLogs: () => api.get('/auditlogs').then((r) => r.data),
  getLogById: (id) => api.get(`/auditlogs/${id}`).then((r) => r.data),
  deleteLog: (id) => api.delete(`/auditlogs/${id}`),
}
