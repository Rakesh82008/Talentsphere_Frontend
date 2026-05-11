import api from './axios'

export const resumesApi = {
  getAll: () => api.get('/resumes').then((r) => r.data),
  getById: (id) => api.get(`/resumes/${id}`).then((r) => r.data),
  getByCandidate: (candidateId) =>
    api.get(`/resumes/candidate/${candidateId}`).then((r) => r.data),
  upload: (candidateId, file) => {
    const formData = new FormData()
    formData.append('candidateId', String(candidateId))
    formData.append('file', file)
    return api
      .post('/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },
  replace: (id, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api
      .put(`/resumes/${id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },
  download: (id) =>
    api.get(`/resumes/${id}/download`, { responseType: 'blob' }).then((r) => r.data),
  remove: (id) => api.delete(`/resumes/${id}`),
}
