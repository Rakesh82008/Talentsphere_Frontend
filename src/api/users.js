import api from './axios'

export const usersApi = {
  getAll: () => api.get('/users').then((r) => r.data.data ?? r.data),
  getById: (id) => api.get(`/users/${id}`).then((r) => r.data),
  update: (id, data) =>
    api.put(`/users/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/users/${id}`),

  /** Users eligible to conduct interviews (HR, Manager, Recruiter roles only). */
  getInterviewers: () =>
    api.get('/users/interviewers').then((r) => r.data.data ?? []),

  // Roles
  getAllRoles: () => api.get('/roles').then((r) => r.data.data ?? r.data),
  getUserRoles: () => api.get('/userroles').then((r) => r.data.data ?? r.data),
  assignRole: (userId, roleId) =>
    api.post('/userroles', { userId, roleId }).then((r) => r.data),
  updateUserRole: (id, userId, roleId) =>
    api.put(`/userroles/${id}`, { userId, roleId }).then((r) => r.data),
  removeUserRole: (id) => api.delete(`/userroles/${id}`),
}
