import api from './axios'

export const successionsApi = {
  getAll: () => api.get('/Succession').then((r) => r.data),
  getById: (id) =>
    api.get(`/Succession/${id}`).then((r) => r.data),
  create: (data) =>
    api.post('/Succession', data).then((r) => r.data),
  update: (id, data) =>
    api.put(`/Succession/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/Succession/${id}`),
}
