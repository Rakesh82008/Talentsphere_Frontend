import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../common/LoadingSpinner'

export default function ProtectedRoute({ roles }) {
  const { isAuthenticated, isLoading, hasRole } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // hasRole from useAuth takes ...roles (rest params) — spreading the array is intentional and correct
  if (roles && !hasRole(...roles)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
