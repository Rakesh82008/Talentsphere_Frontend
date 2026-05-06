import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { employeesApi } from '../../api/employees'
import { usersApi } from '../../api/users'
import type { EmployeeResponse, CreateEmployeeDTO, UpdateEmployeeDTO, UserResponse, UserRoleResponse } from '../../types'
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
import { usePermissions } from '../../hooks/usePermissions'
import { useAuth } from '../../hooks/useAuth'
import { format } from 'date-fns'

type FormData = Omit<CreateEmployeeDTO, 'userId' | 'managerID'> & { userId: string; managerID: string }

export default function EmployeesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const isMyTeam = location.pathname === '/my-team'
  const { can } = usePermissions()
  const { user } = useAuth()
  const [employees, setEmployees] = useState<EmployeeResponse[]>([])
  const [users, setUsers] = useState<UserResponse[]>([])
  const [userRoles, setUserRoles] = useState<UserRoleResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editEmployee, setEditEmployee] = useState<EmployeeResponse | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormData>()

  const load = async () => {
    setLoading(true)
    try {
      if (isMyTeam) {
        const allEmps = await employeesApi.getAll()
        setEmployees(user ? allEmps.filter((e) => e.managerID === user.userId) : [])
      } else {
        const [eRes, uRes, urRes] = await Promise.allSettled([
          employeesApi.getAll(),
          usersApi.getAll(),
          usersApi.getUserRoles(),
        ])
        if (eRes.status === 'fulfilled') setEmployees(eRes.value)
        else toast.error('Failed to load employees')
        if (uRes.status === 'fulfilled') setUsers(uRes.value)
        if (urRes.status === 'fulfilled') setUserRoles(urRes.value)
      }
    } catch { toast.error('Failed to load employees') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [isMyTeam])

  useEffect(() => {
    if (editEmployee) {
      reset({
        userId: String(editEmployee.userId),
        name: editEmployee.name,
        department: editEmployee.department,
        position: editEmployee.position,
        joinDate: editEmployee.joinDate?.split('T')[0],
        status: editEmployee.status,
        managerID: String(editEmployee.managerID ?? ''),
      })
    } else {
      reset({ status: 'Active' })
    }
  }, [editEmployee, showCreate, reset])

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      const payload = {
        userId: parseInt(data.userId),
        name: data.name,
        department: data.department,
        position: data.position,
        joinDate: data.joinDate,
        status: data.status,
        managerID: data.managerID ? parseInt(data.managerID) : undefined,
      }
      if (editEmployee) {
        await employeesApi.update(editEmployee.employeeID, payload as UpdateEmployeeDTO)
        toast.success('Employee updated')
        setEditEmployee(null)
      } else {
        await employeesApi.create(payload as CreateEmployeeDTO)
        toast.success('Employee created')
        setShowCreate(false)
      }
      load()
    } catch { toast.error(editEmployee ? 'Failed to update employee' : 'Failed to create employee') }
    finally { setSaving(false) }
  }

  const onDelete = async () => {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      await employeesApi.remove(deleteId)
      toast.success('Employee removed')
      setDeleteId(null)
      load()
    } catch { toast.error('Failed to delete employee') }
    finally { setDeleteLoading(false) }
  }

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.department.toLowerCase().includes(search.toLowerCase()) ||
    e.position.toLowerCase().includes(search.toLowerCase())
  )

  const EmployeeForm = () => (
    <form className="space-y-4">
      {!editEmployee && (
        <Select label="User Account" required placeholder="Link to user account" error={errors.userId?.message}
          options={users
            .filter((u) => !employees.some((e) => e.userId === u.userID))
            .map((u) => ({ value: u.userID, label: `${u.name} (${u.email})` }))}
          {...register('userId', { required: 'User is required' })} />
      )}
      <div className="grid grid-cols-2 gap-4">
        <Input label="Full Name" required error={errors.name?.message} {...register('name', { required: 'Name is required' })} />
        <Input label="Department" required error={errors.department?.message} {...register('department', { required: 'Department is required' })} />
        <Input label="Position / Job Title" required error={errors.position?.message} {...register('position', { required: 'Position is required' })} />
        <Input label="Join Date" type="date" required error={errors.joinDate?.message} {...register('joinDate', { required: 'Join date is required' })} />
      </div>
      <Select label="Status" required options={[{value:'Active',label:'Active'},{value:'OnLeave',label:'On Leave'},{value:'Inactive',label:'Inactive'},{value:'Terminated',label:'Terminated'}]} {...register('status')} />
      <Select label="Manager (optional)" placeholder="No manager"
        options={users
          .filter((u) => {
            const selfUserId = editEmployee ? editEmployee.userId : parseInt(watch('userId') || '0')
            return Number(u.userID) !== selfUserId &&
              userRoles.some((ur) => Number(ur.userId) === Number(u.userID) && String(ur.roleName).toLowerCase() === 'manager')
          })
          .map((u) => ({ value: u.userID, label: u.name }))}
        {...register('managerID')} />
    </form>
  )

  return (
    <div>
      <PageHeader
        title={isMyTeam ? 'My Team' : 'Employees'}
        subtitle={isMyTeam ? 'Employees reporting to you' : 'Manage your workforce'}
        actions={!isMyTeam && can('MANAGE_EMPLOYEES') && (
          <Button leftIcon={<PlusIcon className="h-4 w-4" />} onClick={() => { reset({ status: 'Active' }); setShowCreate(true) }}>
            Add Employee
          </Button>
        )}
      />

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name, department, position…" className="w-80" />
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No employees found" description={isMyTeam ? 'No employees are currently reporting to you.' : 'Add your first employee to get started.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-th">Name</th>
                  <th className="table-th">Department</th>
                  <th className="table-th">Position</th>
                  <th className="table-th">Join Date</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((e) => (
                  <tr key={e.employeeID} className="hover:bg-gray-50">
                    <td className="table-td">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-slate-100">{e.name}</p>
                        {e.managerName && <p className="text-xs text-gray-400 dark:text-slate-500">Mgr: {e.managerName}</p>}
                      </div>
                    </td>
                    <td className="table-td">{e.department}</td>
                    <td className="table-td">{e.position}</td>
                    <td className="table-td text-gray-500 dark:text-slate-400">{format(new Date(e.joinDate), 'MMM d, yyyy')}</td>
                    <td className="table-td"><StatusBadge status={e.status} /></td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <button onClick={() => navigate(`/employees/${e.employeeID}`)} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-blue-500 transition-colors" title="View">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        {can('MANAGE_EMPLOYEES') && <>
                          <button onClick={() => setEditEmployee(e)} className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg text-amber-500 transition-colors" title="Edit">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeleteId(e.employeeID)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-colors" title="Delete">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add New Employee" size="lg"
        footer={<><Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>Create Employee</Button></>}>
        <EmployeeForm />
      </Modal>

      <Modal open={!!editEmployee} onClose={() => setEditEmployee(null)} title="Edit Employee" size="lg"
        footer={<><Button variant="secondary" onClick={() => setEditEmployee(null)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>Save Changes</Button></>}>
        <EmployeeForm />
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={onDelete} loading={deleteLoading}
        title="Remove Employee" message="Are you sure you want to remove this employee? This action cannot be undone." />
    </div>
  )
}
