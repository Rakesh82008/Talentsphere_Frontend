import axios from 'axios'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ts_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    // Unwrap backend envelopes: { data } or { message, data } → data
    // Don't unwrap PagedResult which has { data, totalCount, page, ... }
    const d = response.data
    if (
      d &&
      typeof d === 'object' &&
      'data' in d &&
      d.data !== undefined &&
      !('totalCount' in d) &&
      !('page' in d)
    ) {
      response.data = d.data
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ts_token')
      window.location.href = '/login'
    } else if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action.')
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.')
    }
    return Promise.reject(error)
  }
)

export default api
