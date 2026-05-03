import api from './axios'
import type { UserResponse, UserRoleResponse, RoleResponse } from '../types'

export const usersApi = {
  getAll: () => api.get<UserResponse[]>('/users').then((r) => r.data),
  getById: (id: number) => api.get<UserResponse>(`/users/${id}`).then((r) => r.data),
  update: (id: number, data: Partial<UserResponse>) =>
    api.put<UserResponse>(`/users/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/users/${id}`),

  // Roles
  getAllRoles: () => api.get<RoleResponse[]>('/roles').then((r) => r.data),
  getUserRoles: () => api.get<UserRoleResponse[]>('/userroles').then((r) => r.data),
  assignRole: (userId: number, roleId: number) =>
    api.post('/userroles', { userId, roleId }).then((r) => r.data),
  updateUserRole: (id: number, userId: number, roleId: number) =>
    api.put(`/userroles/${id}`, { userId, roleId }).then((r) => r.data),
  removeUserRole: (id: number) => api.delete(`/userroles/${id}`),
}
