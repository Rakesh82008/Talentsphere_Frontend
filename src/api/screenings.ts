import api from './axios'
import type { ScreeningResponse, CreateScreeningDTO, UpdateScreeningDTO } from '../types'

export const screeningsApi = {
  getAll: () => api.get<ScreeningResponse[]>('/screenings').then((r) => r.data),
  getById: (id: number) => api.get<ScreeningResponse>(`/screenings/${id}`).then((r) => r.data),
  getByApplication: (applicationId: number) =>
    api.get<ScreeningResponse>(`/screenings/application/${applicationId}`).then((r) => r.data),
  create: (data: CreateScreeningDTO) =>
    api.post<ScreeningResponse>('/screenings', data).then((r) => r.data),
  update: (id: number, data: UpdateScreeningDTO) =>
    api.put<ScreeningResponse>(`/screenings/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/screenings/${id}`),
}
