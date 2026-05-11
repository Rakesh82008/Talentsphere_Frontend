import api from './axios'

export const authApi = {
  login: (data) =>
    api.post('/users/login', data).then((r) => r.data),

  register: (data) =>
    api.post('/users/register', data).then((r) => r.data),

  refreshToken: () =>
    api.post('/users/refresh-token').then((r) => r.data),
}
