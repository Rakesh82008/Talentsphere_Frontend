import api from './axios'

export const selectionsApi = {
  getAll: () => api.get('/selections').then((r) => r.data),
  getDetailed: () => api.get('/selections/detailed').then((r) => r.data),
  getById: (id) => api.get(`/selections/${id}`).then((r) => r.data),
  getByApplication: (applicationId) =>
    api.get(`/selections/application/${applicationId}`).then((r) => r.data),
  decide: (data) =>
    api.post('/selections/decide', data).then((r) => r.data),
  create: (data) =>
    api.post('/selections', data).then((r) => r.data),
  update: (id, data) =>
    api.put(`/selections/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/selections/${id}`),
}
