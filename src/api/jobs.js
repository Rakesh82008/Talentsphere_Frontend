import api from './axios'

export const jobsApi = {
  getAll: (params) =>
    api.get('/jobs', { params }).then((r) => r.data),
  getById: (id) => api.get(`/jobs/${id}`).then((r) => r.data),
  create: (data) => api.post('/jobs', data).then((r) => r.data),
  update: (id, data) =>
    api.put(`/jobs/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/jobs/${id}`),
}
