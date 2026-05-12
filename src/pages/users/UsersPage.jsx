// Users Page (Admin only)
//
// Manage all system users — edit profile fields, change role assignments,
// or delete accounts. Roles are stored in a separate table joined by
// userId, so we load users + roles + user-role-mappings in parallel.

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PencilIcon, TrashIcon, KeyIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

import { usersApi } from '../../api/users'

import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import SearchBar from '../../components/common/SearchBar'

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'Suspended', label: 'Suspended' },
]

export default function UsersPage() {
  // ----- List data -----
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [userRoles, setUserRoles] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // ----- Search -----
  const [searchText, setSearchText] = useState('')

  // ----- Modal state -----
  const [userBeingEdited, setUserBeingEdited] = useState(null)
  const [userForRoleChange, setUserForRoleChange] = useState(null)
  const [userIdToDelete, setUserIdToDelete] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Two separate forms — one for editing user details, one for role assignment.
  const {
    register: registerUserField,
    handleSubmit: handleUserFormSubmit,
    reset: resetUserForm,
    formState: { errors: userFormErrors },
  } = useForm()

  const {
    register: registerRoleField,
    handleSubmit: handleRoleFormSubmit,
    reset: resetRoleForm,
    formState: { errors: roleFormErrors },
  } = useForm()

  // -----------------------------------------------------------------
  // API call: load users + roles + user-role mappings in parallel.
  // -----------------------------------------------------------------
  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const [usersList, rolesList, userRolesList] = await Promise.all([
        usersApi.getAll(),
        usersApi.getAllRoles(),
        usersApi.getUserRoles(),
      ])
      setUsers(usersList)
      setRoles(rolesList)
      setUserRoles(userRolesList)
    } catch {
      toast.error('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  // useEffect: load all data once on mount.
  useEffect(() => {
    fetchUsers()
  }, [])

  // useEffect: when "Edit User" opens, pre-fill the form.
  useEffect(() => {
    if (userBeingEdited) {
      resetUserForm({
        name: userBeingEdited.name,
        email: userBeingEdited.email,
        phone: userBeingEdited.phone ?? '',
        status: userBeingEdited.status,
      })
    }
  }, [userBeingEdited, resetUserForm])

  // useEffect: when "Change Role" opens, pre-fill with the current role.
  useEffect(() => {
    if (userForRoleChange) {
      const currentRole = userRoles.find(
        (userRole) => userRole.userId === userForRoleChange.userID
      )
      resetRoleForm({ roleId: currentRole ? String(currentRole.roleId) : '' })
    }
  }, [userForRoleChange, userRoles, resetRoleForm])

  // -----------------------------------------------------------------
  // Handler: save user profile changes.
  // -----------------------------------------------------------------
  const handleUpdateUser = async (formData) => {
    if (!userBeingEdited) return

    setIsSaving(true)
    try {
      await usersApi.update(userBeingEdited.userID, formData)
      toast.success('User updated')
      setUserBeingEdited(null)
      fetchUsers()
    } catch {
      toast.error('Failed to update user')
    } finally {
      setIsSaving(false)
    }
  }

  // -----------------------------------------------------------------
  // Handler: assign a new role to the selected user.
  //
  // Note: the JWT carries the user's role, so until they log out and
  // back in they will still have the old role on the client side.
  // -----------------------------------------------------------------
  const handleAssignRole = async (formData) => {
    if (!userForRoleChange) return

    setIsSaving(true)
    try {
      await usersApi.assignRole(userForRoleChange.userID, parseInt(formData.roleId))
      toast.success(
        'Role updated. The user must log out and log back in for the change to take effect.'
      )
      setUserForRoleChange(null)
      fetchUsers()
    } catch {
      toast.error('Failed to assign role')
    } finally {
      setIsSaving(false)
    }
  }

  // -----------------------------------------------------------------
  // Handler: delete a user after confirmation.
  // -----------------------------------------------------------------
  const handleDelete = async () => {
    if (!userIdToDelete) return

    setIsDeleting(true)
    try {
      await usersApi.remove(userIdToDelete)
      toast.success('User deleted')
      setUserIdToDelete(null)
      fetchUsers()
    } catch {
      toast.error('Failed to delete user')
    } finally {
      setIsDeleting(false)
    }
  }

  // -----------------------------------------------------------------
  // Helper: find the role name assigned to a given userId.
  // -----------------------------------------------------------------
  const findRoleNameForUser = (userId) => {
    const match = userRoles.find((userRole) => userRole.userId === userId)
    return match ? match.roleName : null
  }

  // Filter users by the search box (matches name or email).
  const filteredUsers = users.filter((u) => {
    const lowerSearch = searchText.toLowerCase()
    return (
      u.name.toLowerCase().includes(lowerSearch) ||
      u.email.toLowerCase().includes(lowerSearch)
    )
  })

  // Role dropdown options.
  const roleOptions = roles.map((role) => ({
    value: role.roleID,
    label: role.name,
  }))

  // Current role of the user whose role we are about to change.
  const currentRoleForChange = userForRoleChange
    ? userRoles.find((userRole) => userRole.userId === userForRoleChange.userID)
    : null

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Manage all system users and their role assignments"
      />

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <SearchBar
            value={searchText}
            onChange={setSearchText}
            placeholder="Search users…"
            className="w-72"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            title="No users found"
            description="No users match your search."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-th">Name</th>
                  <th className="table-th">Email</th>
                  <th className="table-th">Roles</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Created</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((singleUser) => {
                  const roleName = findRoleNameForUser(singleUser.userID)
                  const createdDate = format(
                    new Date(singleUser.createdAt),
                    'MMM d, yyyy'
                  )

                  return (
                    <tr key={singleUser.userID} className="hover:bg-gray-50">
                      <td className="table-td font-medium text-gray-900 dark:text-slate-100">
                        {singleUser.name}
                      </td>
                      <td className="table-td text-gray-500 dark:text-slate-400">
                        {singleUser.email}
                      </td>
                      <td className="table-td">
                        {roleName ? (
                          <span className="inline-block px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
                            {roleName}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-slate-500 text-xs">
                            No role
                          </span>
                        )}
                      </td>
                      <td className="table-td">
                        <StatusBadge status={singleUser.status} />
                      </td>
                      <td className="table-td text-gray-500 dark:text-slate-400">
                        {createdDate}
                      </td>
                      <td className="table-td">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setUserForRoleChange(singleUser)}
                            className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg text-indigo-500 transition-colors"
                            title="Change Role"
                          >
                            <KeyIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setUserBeingEdited(singleUser)}
                            className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-blue-500 transition-colors"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setUserIdToDelete(singleUser.userID)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      <Modal
        open={!!userBeingEdited}
        onClose={() => setUserBeingEdited(null)}
        title="Edit User"
        footer={
          <>
            <Button variant="secondary" onClick={() => setUserBeingEdited(null)}>
              Cancel
            </Button>
            <Button
              loading={isSaving}
              onClick={handleUserFormSubmit(handleUpdateUser)}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input
            label="Name"
            required
            error={userFormErrors.name?.message}
            {...registerUserField('name', { required: 'Name is required' })}
          />
          <Input
            label="Email"
            type="email"
            required
            error={userFormErrors.email?.message}
            {...registerUserField('email', { required: 'Email is required' })}
          />
          <Input label="Phone" {...registerUserField('phone')} />
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            {...registerUserField('status')}
          />
        </form>
      </Modal>

      {/* Change Role Modal */}
      <Modal
        open={!!userForRoleChange}
        onClose={() => setUserForRoleChange(null)}
        title={`Change Role — ${userForRoleChange?.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setUserForRoleChange(null)}>
              Cancel
            </Button>
            <Button
              loading={isSaving}
              onClick={handleRoleFormSubmit(handleAssignRole)}
            >
              Update Role
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          {/* Show the current role (or a warning if none) */}
          {userForRoleChange && currentRoleForChange ? (
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Current role:{' '}
              <span className="inline-block px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
                {currentRoleForChange.roleName}
              </span>
            </p>
          ) : (
            userForRoleChange && (
              <p className="text-sm text-amber-600">
                This user has no role assigned yet.
              </p>
            )
          )}

          <Select
            label="Select Role"
            required
            placeholder="Select a role"
            error={roleFormErrors.roleId?.message}
            options={roleOptions}
            {...registerRoleField('roleId', {
              required: 'Please select a role',
            })}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!userIdToDelete}
        onClose={() => setUserIdToDelete(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title="Delete User"
        message="This will permanently delete the user account. This action cannot be undone."
      />
    </div>
  )
}
