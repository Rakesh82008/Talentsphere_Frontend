import api from './axios'

export const interviewsApi = {
  getAll: () => api.get('/interviews').then((r) => r.data.data ?? r.data),
  getDetailed: () => api.get('/interviews/detailed').then((r) => r.data.data ?? r.data),
  getById: (id) => api.get(`/interviews/${id}`).then((r) => r.data),
  getByApplication: (applicationId) =>
    api.get(`/interviews/application/${applicationId}`).then((r) => r.data),
  schedule: (data) =>
    api.post('/interviews/schedule', data).then((r) => r.data),
  create: (data) =>
    api.post('/interviews', data).then((r) => r.data),
  update: (id, data) =>
    api.put(`/interviews/${id}`, data).then((r) => r.data),
  updateStatus: (id, data) =>
    api.patch(`/interviews/${id}/status`, data).then((r) => r.data),
  remove: (id) => api.delete(`/interviews/${id}`),
}
