import api from './axios'

export const complianceApi = {
  getAll: () => api.get('/compliances').then((r) => r.data),
  getById: (id) =>
    api.get(`/compliances/${id}`).then((r) => r.data),
  create: (data) =>
    api.post('/compliances', data).then((r) => r.data),
  update: (id, data) =>
    api.put(`/compliances/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/compliances/${id}`),
}
