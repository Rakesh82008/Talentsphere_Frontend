import { useAppSelector } from '../store'

export const useAuth = () => {
  const { user, token, isAuthenticated, isLoading, error } = useAppSelector((s) => s.auth)

  const hasRole = (...roles: string[]) =>
    roles.some((r) => user?.roles.includes(r))

  const isAdmin = () => hasRole('Admin')
  const isHR = () => hasRole('HR')
  const isRecruiter = () => hasRole('Recruiter')
  const isManager = () => hasRole('Manager')
  const isEmployee = () => hasRole('Employee')
  const isCandidate = () => hasRole('Candidate')

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    hasRole,
    isAdmin,
    isHR,
    isRecruiter,
    isManager,
    isEmployee,
    isCandidate,
  }
}
