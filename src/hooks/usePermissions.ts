import { useAuth } from './useAuth'
import { PERMISSIONS, hasRole } from '../config/roles'

export const usePermissions = () => {
  const { user } = useAuth()
  const roles = user?.roles ?? []

  const can = (permission: keyof typeof PERMISSIONS): boolean =>
    hasRole(roles, ...PERMISSIONS[permission])

  return { can }
}
