import api from './axios'
import type { CareerPlanResponse, CreateCareerPlanDTO, UpdateCareerPlanDTO } from '../types'

export const careerPlansApi = {
  getAll: () => api.get<CareerPlanResponse[]>('/career-plans').then((r) => r.data),
  getById: (id: number) => api.get<CareerPlanResponse>(`/career-plans/${id}`).then((r) => r.data),
  getByEmployee: (employeeId: number) =>
    api.get<CareerPlanResponse[]>(`/career-plans/employee/${employeeId}`).then((r) => r.data),
  create: (data: CreateCareerPlanDTO) =>
    api.post<CareerPlanResponse>('/career-plans', data).then((r) => r.data),
  update: (id: number, data: UpdateCareerPlanDTO) =>
    api.put<CareerPlanResponse>(`/career-plans/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/career-plans/${id}`),
}
