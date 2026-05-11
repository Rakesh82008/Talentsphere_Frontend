import api from './axios'

export const trainingsApi = {
  getAll: () => api.get('/trainings').then((r) => r.data),
  getById: (id) => api.get(`/trainings/${id}`).then((r) => r.data),
  getStats: () => api.get('/trainings/stats').then((r) => r.data),
  create: (data) => api.post('/trainings', data).then((r) => r.data),
  update: (id, data) => api.put(`/trainings/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/trainings/${id}`),
}
