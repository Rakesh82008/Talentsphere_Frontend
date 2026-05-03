import api from './axios'
import type { SelectionResponse, MakeSelectionDecisionDTO } from '../types'

interface CreateSelectionDTOLocal {
  applicationID: number
  decision: string
  notes?: string
  date?: string
}

export const selectionsApi = {
  getAll: () => api.get<SelectionResponse[]>('/selections').then((r) => r.data),
  getDetailed: () => api.get<SelectionResponse[]>('/selections/detailed').then((r) => r.data),
  getById: (id: number) => api.get<SelectionResponse>(`/selections/${id}`).then((r) => r.data),
  getByApplication: (applicationId: number) =>
    api.get<SelectionResponse>(`/selections/application/${applicationId}`).then((r) => r.data),
  decide: (data: MakeSelectionDecisionDTO) =>
    api.post<SelectionResponse>('/selections/decide', data).then((r) => r.data),
  create: (data: CreateSelectionDTOLocal) =>
    api.post<SelectionResponse>('/selections', data).then((r) => r.data),
  update: (id: number, data: Partial<SelectionResponse>) =>
    api.put<SelectionResponse>(`/selections/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/selections/${id}`),
}
