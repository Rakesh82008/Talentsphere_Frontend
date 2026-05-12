import api from './axios'

export const screeningsApi = {
  getAll: () => api.get('/screenings').then((r) => r.data.data ?? r.data),
  getById: (id) => api.get(`/screenings/${id}`).then((r) => r.data),
  getByApplication: (applicationId) =>
    api.get(`/screenings/application/${applicationId}`).then((r) => r.data),
  create: (data) =>
    api.post('/screenings', data).then((r) => r.data),
  update: (id, data) =>
    api.put(`/screenings/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/screenings/${id}`),
}
