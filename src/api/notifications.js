import api from './axios'

export const notificationsApi = {
  getByUser: (userId) =>
    api.get(`/notifications/user/${userId}`).then((r) => r.data),
  markRead: (id) =>
    api.patch(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: (userId) =>
    api.patch(`/notifications/user/${userId}/read-all`).then((r) => r.data),
}
