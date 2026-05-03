import api from './axios'
import type { SuccessionPlanResponse, CreateSuccessionPlanDTO, UpdateSuccessionPlanDTO } from '../types'

export const successionsApi = {
  getAll: () => api.get<SuccessionPlanResponse[]>('/Succession').then((r) => r.data),
  getById: (id: number) =>
    api.get<SuccessionPlanResponse>(`/Succession/${id}`).then((r) => r.data),
  create: (data: CreateSuccessionPlanDTO) =>
    api.post<SuccessionPlanResponse>('/Succession', data).then((r) => r.data),
  update: (id: number, data: UpdateSuccessionPlanDTO) =>
    api.put<SuccessionPlanResponse>(`/Succession/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/Succession/${id}`),
}
