import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import LoadingSpinner from '../common/LoadingSpinner'

interface Props {
  roles?: string[]
}

export default function ProtectedRoute({ roles }: Props) {
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

  if (roles && !hasRole(...roles)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
