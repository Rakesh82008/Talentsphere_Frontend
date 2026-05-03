import api from './axios'
import type { ResumeResponse } from '../types'

export const resumesApi = {
  getAll: () => api.get<ResumeResponse[]>('/resumes').then((r) => r.data),
  getById: (id: number) => api.get<ResumeResponse>(`/resumes/${id}`).then((r) => r.data),
  getByCandidate: (candidateId: number) =>
    api.get<ResumeResponse[]>(`/resumes/candidate/${candidateId}`).then((r) => r.data),
  upload: (candidateId: number, file: File) => {
    const formData = new FormData()
    formData.append('candidateId', String(candidateId))
    formData.append('file', file)
    return api
      .post<ResumeResponse>('/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },
  replace: (id: number, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api
      .put<ResumeResponse>(`/resumes/${id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },
  download: (id: number) =>
    api.get(`/resumes/${id}/download`, { responseType: 'blob' }).then((r) => r.data),
  remove: (id: number) => api.delete(`/resumes/${id}`),
}
