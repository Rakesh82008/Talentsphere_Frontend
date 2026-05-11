import api from './axios'

export const reportsApi = {
  getAll: () => api.get('/reports').then((r) => r.data),
  getById: (id) => api.get(`/reports/${id}`).then((r) => r.data),
  create: (data) =>
    api.post('/reports', data).then((r) => r.data),
  update: (id, data) =>
    api.put(`/reports/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/reports/${id}`),

  getHiringAnalytics: () =>
    api.get('/reports/analytics/hiring').then((r) => r.data),
  getPerformanceAnalytics: () =>
    api.get('/reports/analytics/performance').then((r) => r.data),
  getTrainingAnalytics: () =>
    api.get('/reports/analytics/training').then((r) => r.data),
}
