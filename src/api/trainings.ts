import api from './axios'
import type { TrainingResponse, CreateTrainingDTO, UpdateTrainingDTO, TrainingStatsDTO } from '../types'

export const trainingsApi = {
  getAll: () => api.get<TrainingResponse[]>('/trainings').then((r) => r.data),
  getById: (id: number) => api.get<TrainingResponse>(`/trainings/${id}`).then((r) => r.data),
  getStats: () => api.get<TrainingStatsDTO>('/trainings/stats').then((r) => r.data),
  create: (data: CreateTrainingDTO) => api.post<TrainingResponse>('/trainings', data).then((r) => r.data),
  update: (id: number, data: UpdateTrainingDTO) => api.put<TrainingResponse>(`/trainings/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/trainings/${id}`),
}
