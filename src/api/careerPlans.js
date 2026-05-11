import api from './axios'

export const careerPlansApi = {
  getAll: () => api.get('/career-plans').then((r) => r.data),
  getById: (id) => api.get(`/career-plans/${id}`).then((r) => r.data),
  getByEmployee: (employeeId) =>
    api.get(`/career-plans/employee/${employeeId}`).then((r) => r.data),
  create: (data) =>
    api.post('/career-plans', data).then((r) => r.data),
  update: (id, data) =>
    api.put(`/career-plans/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/career-plans/${id}`),
}
