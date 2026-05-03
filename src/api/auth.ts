import api from './axios'
import type { LoginDTO, LoginResponse, RegisterDTO, UserResponse } from '../types'

export const authApi = {
  login: (data: LoginDTO) =>
    api.post<LoginResponse>('/users/login', data).then((r) => r.data),

  register: (data: RegisterDTO) =>
    api.post<UserResponse>('/users/register', data).then((r) => r.data),

  refreshToken: () =>
    api.post<LoginResponse>('/users/refresh-token').then((r) => r.data),
}
