import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon, KeyIcon } from '@heroicons/react/24/outline'
import { usersApi } from '../../api/users'
import type { UserResponse, RoleResponse, UserRoleResponse } from '../../types'
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
import { format } from 'date-fns'

export default function UsersPage() {
  const [users, setUsers] = useState<UserResponse[]>([])
  const [roles, setRoles] = useState<RoleResponse[]>([])
  const [userRoles, setUserRoles] = useState<UserRoleResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editUser, setEditUser] = useState<UserResponse | null>(null)
  const [roleUser, setRoleUser] = useState<UserResponse | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{ name: string; email: string; phone: string; status: string }>()
  const { register: regRole, handleSubmit: handleRoleSubmit, reset: resetRole, formState: { errors: errorsRole } } = useForm<{ roleId: string }>()

  const load = async () => {
    setLoading(true)
    try {
      const [u, r, ur] = await Promise.all([usersApi.getAll(), usersApi.getAllRoles(), usersApi.getUserRoles()])
      setUsers(u)
      setRoles(r)
      setUserRoles(ur)
    } catch { toast.error('Failed to load users') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (editUser) reset({ name: editUser.name, email: editUser.email, phone: editUser.phone ?? '', status: editUser.status })
  }, [editUser, reset])

  useEffect(() => {
    if (roleUser) {
      const current = userRoles.find((ur) => ur.userId === roleUser.userID)
      resetRole({ roleId: current ? String(current.roleId) : '' })
    }
  }, [roleUser, userRoles, resetRole])

  const onUpdateUser = async (data: { name: string; email: string; phone: string; status: string }) => {
    if (!editUser) return
    setSaving(true)
    try {
      await usersApi.update(editUser.userID, { ...data, status: data.status as UserResponse['status'] })
      toast.success('User updated')
      setEditUser(null)
      load()
    } catch { toast.error('Failed to update user') }
    finally { setSaving(false) }
  }

  const onAssignRole = async (data: { roleId: string }) => {
    if (!roleUser) return
    setSaving(true)
    try {
      await usersApi.assignRole(roleUser.userID, parseInt(data.roleId))
      toast.success('Role updated. The user must log out and log back in for the change to take effect.')
      setRoleUser(null)
      load()
    } catch { toast.error('Failed to assign role') }
    finally { setSaving(false) }
  }

  const onDelete = async () => {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      await usersApi.remove(deleteId)
      toast.success('User deleted')
      setDeleteId(null)
      load()
    } catch { toast.error('Failed to delete user') }
    finally { setDeleteLoading(false) }
  }

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const getUserRole = (userId: number) =>
    userRoles.find((ur) => ur.userId === userId)?.roleName ?? null

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Manage all system users and their role assignments"
      />

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <SearchBar value={search} onChange={setSearch} placeholder="Search users…" className="w-72" />
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No users found" description="No users match your search." />
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
                {filtered.map((u) => (
                  <tr key={u.userID} className="hover:bg-gray-50">
                    <td className="table-td font-medium text-gray-900">{u.name}</td>
                    <td className="table-td text-gray-500">{u.email}</td>
                    <td className="table-td">
                      {getUserRole(u.userID)
                        ? <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">{getUserRole(u.userID)}</span>
                        : <span className="text-gray-400 text-xs">No role</span>}
                    </td>
                    <td className="table-td"><StatusBadge status={u.status} /></td>
                    <td className="table-td text-gray-500">{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setRoleUser(u)} className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-500 transition-colors" title="Change Role">
                          <KeyIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditUser(u)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 transition-colors" title="Edit">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteId(u.userID)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors" title="Delete">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Edit User"
        footer={<><Button variant="secondary" onClick={() => setEditUser(null)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onUpdateUser)}>Save Changes</Button></>}>
        <form className="space-y-4">
          <Input label="Name" required error={errors.name?.message} {...register('name', { required: 'Name is required' })} />
          <Input label="Email" type="email" required error={errors.email?.message} {...register('email', { required: 'Email is required' })} />
          <Input label="Phone" {...register('phone')} />
          <Select label="Status" options={[{value:'Active',label:'Active'},{value:'Inactive',label:'Inactive'},{value:'Suspended',label:'Suspended'}]} {...register('status')} />
        </form>
      </Modal>

      {/* Change Role Modal */}
      <Modal open={!!roleUser} onClose={() => setRoleUser(null)} title={`Change Role — ${roleUser?.name}`}
        footer={<><Button variant="secondary" onClick={() => setRoleUser(null)}>Cancel</Button><Button loading={saving} onClick={handleRoleSubmit(onAssignRole)}>Update Role</Button></>}>
        <form className="space-y-4">
          {roleUser && (() => {
            const current = userRoles.find((ur) => ur.userId === roleUser.userID)
            return current ? (
              <p className="text-sm text-gray-500">
                Current role: <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">{current.roleName}</span>
              </p>
            ) : (
              <p className="text-sm text-amber-600">This user has no role assigned yet.</p>
            )
          })()}
          <Select
            label="Select Role"
            required
            placeholder="Select a role"
            error={errorsRole.roleId?.message}
            options={roles.map((r) => ({ value: r.roleID, label: r.name }))}
            {...regRole('roleId', { required: 'Please select a role' })}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={onDelete}
        loading={deleteLoading}
        title="Delete User"
        message="This will permanently delete the user account. This action cannot be undone."
      />
    </div>
  )
}
