import api from './axios'
import type { EmployeeResponse, CreateEmployeeDTO, UpdateEmployeeDTO, EmployeeDocumentResponse, CreateEmployeeDocumentDTO, UpdateEmployeeDocumentDTO } from '../types'

export const employeesApi = {
  getAll: () => api.get<EmployeeResponse[]>('/employees').then((r) => r.data),
  getById: (id: number) => api.get<EmployeeResponse>(`/employees/${id}`).then((r) => r.data),
  getMe: () => api.get<EmployeeResponse>('/employees/me').then((r) => r.data),
  create: (data: CreateEmployeeDTO) =>
    api.post<EmployeeResponse>('/employees', data).then((r) => r.data),
  update: (id: number, data: UpdateEmployeeDTO) =>
    api.put<EmployeeResponse>(`/employees/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/employees/${id}`),

  // Documents
  getAllDocs: () => api.get<EmployeeDocumentResponse[]>('/employeedocs').then((r) => r.data),
  getDocsByEmployee: (employeeId: number) =>
    api.get<EmployeeDocumentResponse[]>(`/employeedocs/employee/${employeeId}`).then((r) => r.data),
  getDocById: (id: number) =>
    api.get<EmployeeDocumentResponse>(`/employeedocs/${id}`).then((r) => r.data),
  createDoc: (data: CreateEmployeeDocumentDTO) =>
    api.post<EmployeeDocumentResponse>('/employeedocs', data).then((r) => r.data),
  uploadDocFile: (employeeId: number, docType: string, file: File) => {
    const form = new FormData()
    form.append('employeeId', String(employeeId))
    form.append('docType', docType)
    form.append('file', file)
    return api.post<EmployeeDocumentResponse>('/employeedocs/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data)
  },
  sendDocReminder: (employeeId: number) =>
    api.post(`/employeedocs/notify/${employeeId}`).then((r) => r.data),
  updateDoc: (id: number, data: UpdateEmployeeDocumentDTO) =>
    api.put<EmployeeDocumentResponse>(`/employeedocs/${id}`, data).then((r) => r.data),
  removeDoc: (id: number) => api.delete(`/employeedocs/${id}`),
}
