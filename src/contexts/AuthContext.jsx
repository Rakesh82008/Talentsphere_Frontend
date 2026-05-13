import { createContext, useCallback, useContext, useState } from 'react'
import { jwtDecode } from 'jwt-decode'
import { authApi } from '../api/auth'

const isTokenExpired = (token) => {
  try {
    const { exp } = jwtDecode(token)
    return exp < Date.now() / 1000
  } catch {
    return true
  }
}

const parseToken = (token) => {
  try {
    const d = jwtDecode(token)
    const userId = parseInt(
      d.nameid ||
      d['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
      d.sub ||
      '0',
      10
    )
    const name =
      d.unique_name ||
      d['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
      d.name ||
      ''
    const email =
      d.email ||
      d['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
      ''
    const rawRole =
      d.role ||
      d['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
      []
    const roles = Array.isArray(rawRole) ? rawRole : rawRole ? [rawRole] : []
    return { userId, name, email, roles }
  } catch {
    return null
  }
}

const mergeUserFromPayload = (token, payload) => {
  const user = parseToken(token) ?? {
    userId: payload.userID ?? payload.userId ?? 0,
    name: payload.name ?? '',
    email: payload.email ?? '',
    roles: [],
  }
  if (payload.userID) user.userId = payload.userID
  if (payload.name)   user.name  = payload.name
  if (payload.email)  user.email = payload.email
  if (payload.role)             user.roles = [payload.role]
  else if (payload.roles?.length) user.roles = payload.roles
  return user
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const initializeAuth = useCallback(() => {
    const stored = localStorage.getItem('ts_token')
    if (!stored) return
    const u = parseToken(stored)
    if (u && !isTokenExpired(stored)) {
      setToken(stored)
      setUser(u)
      setIsAuthenticated(true)
    } else {
      localStorage.removeItem('ts_token')
    }
  }, [])

  const login = useCallback(async (credentials) => {
    setIsLoading(true)
    setError(null)
    try {
      const payload = await authApi.login(credentials)
      const newToken = payload.token
      localStorage.setItem('ts_token', newToken)
      setToken(newToken)
      setUser(mergeUserFromPayload(newToken, payload))
      setIsAuthenticated(true)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Invalid email or password')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshToken = useCallback(async () => {
    try {
      const payload = await authApi.refreshToken()
      const newToken = payload.token
      localStorage.setItem('ts_token', newToken)
      setToken(newToken)
      setUser(mergeUserFromPayload(newToken, payload))
      setIsAuthenticated(true)
    } catch {
      setUser(null)
      setToken(null)
      setIsAuthenticated(false)
      setError(null)
      localStorage.removeItem('ts_token')
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    setIsAuthenticated(false)
    setError(null)
    localStorage.removeItem('ts_token')
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const hasRole = useCallback(
    (...roles) => roles.some((r) => user?.roles.includes(r)),
    [user]

    
  )

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    initializeAuth,
    login,
    refreshToken,
    logout,
    clearError,
    hasRole,
    isAdmin:     () => hasRole('Admin'),
    isHR:        () => hasRole('HR'),
    isRecruiter: () => hasRole('Recruiter'),
    isManager:   () => hasRole('Manager'),
    isEmployee:  () => hasRole('Employee'),
    isCandidate: () => hasRole('Candidate'),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
