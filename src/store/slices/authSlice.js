import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { jwtDecode } from 'jwt-decode'
import { authApi } from '../../api/auth'

// .NET JWT claims — the standard long-form names used by System.IdentityModel

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

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
}

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      return await authApi.login(credentials)
    } catch (err) {
      const error = err
      return rejectWithValue(error.response?.data?.message ?? 'Invalid email or password')
    }
  }
)

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      return await authApi.refreshToken()
    } catch {
      return rejectWithValue('refresh failed')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    initializeAuth(state) {
      const token = localStorage.getItem('ts_token')
      if (token) {
        const user = parseToken(token)
        if (user && !isTokenExpired(token)) {
          state.token = token
          state.user = user
          state.isAuthenticated = true
        } else {
          // Token is missing, malformed, or expired — clear it so ProtectedRoute redirects to login
          localStorage.removeItem('ts_token')
        }
      }
    },
    logout(state) {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.error = null
      localStorage.removeItem('ts_token')
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        const payload = action.payload
        const token = payload.token
        localStorage.setItem('ts_token', token)

        // Start from JWT claims
        const user = parseToken(token) ?? {
          userId: payload.userID ?? payload.userId ?? 0,
          name: payload.name ?? '',
          email: payload.email ?? '',
          roles: [],
        }

        // Prefer explicit fields from the response body over JWT claims
        if (payload.userID) user.userId = payload.userID
        if (payload.name)   user.name  = payload.name
        if (payload.email)  user.email = payload.email

        // Backend returns role as a single string — normalise to array
        if (payload.role)         user.roles = [payload.role]
        else if (payload.roles?.length) user.roles = payload.roles

        // If JWT parsing yielded roles and body didn't override, keep them
        // (no extra step needed — parseToken already filled them)

        state.user  = user
        state.token = token
        state.isAuthenticated = true
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        const payload = action.payload
        const token = payload.token
        localStorage.setItem('ts_token', token)
        const user = parseToken(token) ?? {
          userId: payload.userID ?? payload.userId ?? 0,
          name: payload.name ?? '',
          email: payload.email ?? '',
          roles: [],
        }
        if (payload.userID) user.userId = payload.userID
        if (payload.name)   user.name  = payload.name
        if (payload.email)  user.email = payload.email
        if (payload.role)         user.roles = [payload.role]
        else if (payload.roles?.length) user.roles = payload.roles
        state.user  = user
        state.token = token
        state.isAuthenticated = true
      })
      .addCase(refreshToken.rejected, (state) => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.error = null
        localStorage.removeItem('ts_token')
      })
  },
})

export const { initializeAuth, logout, clearError } = authSlice.actions
export default authSlice.reducer
