import api from './axios'

export const performanceApi = {
  getAll: (employeeId) =>
    api
      .get('/performance-reviews', {
        params: employeeId ? { employeeId } : undefined,
      })
      .then((r) => r.data),
  getById: (id) =>
    api.get(`/performance-reviews/${id}`).then((r) => r.data),
  create: (data) =>
    api.post('/performance-reviews', data).then((r) => r.data),
  update: (id, data) =>
    api.put(`/performance-reviews/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/performance-reviews/${id}`),
}
