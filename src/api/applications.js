import api from './axios'

export const applicationsApi = {
  getAll: (params) =>
    api.get('/applications', { params }).then((r) => r.data),
  getById: (id) =>
    api.get(`/applications/${id}`).then((r) => r.data),
  getByJob: (jobId) =>
    api.get(`/applications/job/${jobId}`).then((r) => r.data),
  getByCandidate: (candidateId) =>
    api.get(`/applications/candidate/${candidateId}`).then((r) => r.data),
  create: (data) =>
    api.post('/applications', data).then((r) => r.data),
  update: (id, data) =>
    api.put(`/applications/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/applications/${id}`),
}
