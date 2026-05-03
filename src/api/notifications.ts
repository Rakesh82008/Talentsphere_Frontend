import api from './axios'
import type { NotificationResponse } from '../types'

export const notificationsApi = {
  getByUser: (userId: number) =>
    api.get<NotificationResponse[]>(`/notifications/user/${userId}`).then((r) => r.data),
  markRead: (id: number) =>
    api.patch<NotificationResponse>(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: (userId: number) =>
    api.patch(`/notifications/user/${userId}/read-all`).then((r) => r.data),
}
