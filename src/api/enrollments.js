import api from './axios'

export const enrollmentsApi = {
  getAll: () => api.get('/enrollments').then((r) => r.data),
  getById: (id) => api.get(`/enrollments/${id}`).then((r) => r.data),
  getByEmployee: (employeeId) =>
    api.get(`/enrollments/employee/${employeeId}`).then((r) => r.data),
  create: (data) =>
    api.post('/enrollments', data).then((r) => r.data),
  start: (id) =>
    api.patch(`/enrollments/${id}/start`).then((r) => r.data.data),
  complete: (id, dto = {}) =>
    api.patch(`/enrollments/${id}/complete`, dto).then((r) => r.data.data),
  remove: (id) => api.delete(`/enrollments/${id}`),
}
