import api from './axios'

export const employeesApi = {
  getAll: () => api.get('/employees').then((r) => r.data),
  getById: (id) => api.get(`/employees/${id}`).then((r) => r.data),
  getMe: () => api.get('/employees/me').then((r) => r.data),
  create: (data) =>
    api.post('/employees', data).then((r) => r.data),
  update: (id, data) =>
    api.put(`/employees/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/employees/${id}`),

  // Documents
  getAllDocs: () => api.get('/employeedocs').then((r) => r.data),
  getDocsByEmployee: (employeeId) =>
    api.get(`/employeedocs/employee/${employeeId}`).then((r) => r.data),
  getDocById: (id) =>
    api.get(`/employeedocs/${id}`).then((r) => r.data),
  createDoc: (data) =>
    api.post('/employeedocs', data).then((r) => r.data),
  uploadDocFile: (employeeId, docType, file) => {
    const form = new FormData()
    form.append('employeeId', String(employeeId))
    form.append('docType', docType)
    form.append('file', file)
    return api.post('/employeedocs/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data)
  },
  sendDocReminder: (employeeId) =>
    api.post(`/employeedocs/notify/${employeeId}`).then((r) => r.data),
  updateDoc: (id, data) =>
    api.put(`/employeedocs/${id}`, data).then((r) => r.data),
  removeDoc: (id) => api.delete(`/employeedocs/${id}`),
}
