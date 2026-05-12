// Employees Page
//
// Two routes share this component:
//   - /employees → HR/Admin sees all employees, can create/edit/delete.
//   - /my-team   → Manager sees only their direct reports (read-only).
//
// The "Add Employee" form links an existing user account to an
// Employee record and optionally assigns a Manager.

import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

import { employeesApi } from '../../api/employees'
import { usersApi } from '../../api/users'
import { usePermissions } from '../../hooks/usePermissions'
import { useAuth } from '../../hooks/useAuth'

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

// Status dropdown options.
const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'OnLeave', label: 'On Leave' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'Terminated', label: 'Terminated' },
]

export default function EmployeesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { can } = usePermissions()
  const { user } = useAuth()

  const isMyTeamView = location.pathname === '/my-team'
  const canManageEmployees = can('MANAGE_EMPLOYEES')

  // ----- List + dropdown data -----
  const [employees, setEmployees] = useState([])
  const [users, setUsers] = useState([])
  const [userRoles, setUserRoles] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // ----- Search -----
  const [searchText, setSearchText] = useState('')

  // ----- Modal state -----
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [employeeBeingEdited, setEmployeeBeingEdited] = useState(null)
  const [employeeIdToDelete, setEmployeeIdToDelete] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm()

  // -----------------------------------------------------------------
  // API call: load employees, and (when not in My Team view) also the
  // full user + user-role lists used by the add/edit form.
  // -----------------------------------------------------------------
  const fetchEmployees = async () => {
    setIsLoading(true)
    try {
      if (isMyTeamView) {
        // Manager: load everyone, then filter client-side to their reports.
        const allEmployees = await employeesApi.getAll()
        const myReports = user
          ? allEmployees.filter((employee) => employee.managerID === user.userId)
          : []
        setEmployees(myReports)
      } else {
        // HR/Admin: load employees + supporting data for the form.
        const [employeesResult, usersResult, userRolesResult] =
          await Promise.allSettled([
            employeesApi.getAll(),
            usersApi.getAll(),
            usersApi.getUserRoles(),
          ])

        if (employeesResult.status === 'fulfilled') {
          setEmployees(employeesResult.value)
        } else {
          toast.error('Failed to load employees')
        }
        if (usersResult.status === 'fulfilled') {
          setUsers(usersResult.value)
        }
        if (userRolesResult.status === 'fulfilled') {
          setUserRoles(userRolesResult.value)
        }
      }
    } catch {
      toast.error('Failed to load employees')
    } finally {
      setIsLoading(false)
    }
  }

  // useEffect: reload whenever the URL switches between /employees and /my-team.
  useEffect(() => {
    fetchEmployees()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMyTeamView])

  // -----------------------------------------------------------------
  // useEffect: pre-fill the form when the user opens edit, or reset
  // to defaults when opening "Add New".
  // -----------------------------------------------------------------
  useEffect(() => {
    if (employeeBeingEdited) {
      reset({
        userId: String(employeeBeingEdited.userId),
        name: employeeBeingEdited.name,
        department: employeeBeingEdited.department,
        position: employeeBeingEdited.position,
        // Server gives ISO datetime; <input type="date"> wants YYYY-MM-DD.
        joinDate: employeeBeingEdited.joinDate?.split('T')[0],
        status: employeeBeingEdited.status,
        managerID: String(employeeBeingEdited.managerID ?? ''),
      })
    } else {
      reset({ status: 'Active' })
    }
  }, [employeeBeingEdited, isCreateModalOpen, reset])

  // -----------------------------------------------------------------
  // Handler: open the "Add Employee" modal with default values.
  // -----------------------------------------------------------------
  const handleOpenCreateModal = () => {
    reset({ status: 'Active' })
    setIsCreateModalOpen(true)
  }

  // -----------------------------------------------------------------
  // Form submit — handles both create and edit because the same form
  // is rendered inside both modals.
  // -----------------------------------------------------------------
  const handleFormSubmit = async (formData) => {
    setIsSaving(true)
    try {
      const payload = {
        userId: parseInt(formData.userId),
        name: formData.name,
        department: formData.department,
        position: formData.position,
        joinDate: formData.joinDate,
        status: formData.status,
        managerID: formData.managerID ? parseInt(formData.managerID) : undefined,
      }

      if (employeeBeingEdited) {
        await employeesApi.update(employeeBeingEdited.employeeID, payload)
        toast.success('Employee updated')
        setEmployeeBeingEdited(null)
      } else {
        await employeesApi.create(payload)
        toast.success('Employee created')
        setIsCreateModalOpen(false)
      }

      fetchEmployees()
    } catch {
      const errorMessage = employeeBeingEdited
        ? 'Failed to update employee'
        : 'Failed to create employee'
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  // -----------------------------------------------------------------
  // Handler: delete an employee after the user confirms.
  // -----------------------------------------------------------------
  const handleDelete = async () => {
    if (!employeeIdToDelete) return

    setIsDeleting(true)
    try {
      await employeesApi.remove(employeeIdToDelete)
      toast.success('Employee removed')
      setEmployeeIdToDelete(null)
      fetchEmployees()
    } catch {
      toast.error('Failed to delete employee')
    } finally {
      setIsDeleting(false)
    }
  }

  // -----------------------------------------------------------------
  // Filter the list by the search box (matches name, dept or position).
  // -----------------------------------------------------------------
  const filteredEmployees = employees.filter((employee) => {
    const lowerSearch = searchText.toLowerCase()
    return (
      employee.name.toLowerCase().includes(lowerSearch) ||
      employee.department.toLowerCase().includes(lowerSearch) ||
      employee.position.toLowerCase().includes(lowerSearch)
    )
  })

  // -----------------------------------------------------------------
  // Build dropdown options for the form.
  // - "User Account": users that don't already have an employee record.
  // - "Manager": users with the Manager role, excluding the selected user.
  // -----------------------------------------------------------------
  const availableUserOptions = users
    .filter((u) => !employees.some((employee) => employee.userId === u.userID))
    .map((u) => ({ value: u.userID, label: `${u.name} (${u.email})` }))

  const watchedUserId = watch('userId')
  const selectedUserId = employeeBeingEdited
    ? employeeBeingEdited.userId
    : parseInt(watchedUserId || '0')

  const managerOptions = users
    .filter((u) => {
      // Exclude the currently selected user (can't manage themselves).
      if (Number(u.userID) === selectedUserId) return false

      // Only include users who have the Manager role assigned.
      return userRoles.some((userRole) => {
        const isSameUser = Number(userRole.userId) === Number(u.userID)
        const isManager =
          String(userRole.roleName).toLowerCase() === 'manager'
        return isSameUser && isManager
      })
    })
    .map((u) => ({ value: u.userID, label: u.name }))

  // -----------------------------------------------------------------
  // Render the create/edit form. Defined as a render function so it
  // can be reused inside both the Create and Edit modals.
  // -----------------------------------------------------------------
  const renderEmployeeForm = () => (
    <form className="space-y-4">
      {/* Linking to a user account is only shown in Create mode */}
      {!employeeBeingEdited && (
        <Select
          label="User Account"
          required
          placeholder="Link to user account"
          error={errors.userId?.message}
          options={availableUserOptions}
          {...register('userId', { required: 'User is required' })}
        />
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Full Name"
          required
          error={errors.name?.message}
          {...register('name', { required: 'Name is required' })}
        />
        <Input
          label="Department"
          required
          error={errors.department?.message}
          {...register('department', { required: 'Department is required' })}
        />
        <Input
          label="Position / Job Title"
          required
          error={errors.position?.message}
          {...register('position', { required: 'Position is required' })}
        />
        <Input
          label="Join Date"
          type="date"
          required
          error={errors.joinDate?.message}
          {...register('joinDate', { required: 'Join date is required' })}
        />
      </div>

      <Select
        label="Status"
        required
        options={STATUS_OPTIONS}
        {...register('status')}
      />

      <Select
        label="Manager (optional)"
        placeholder="No manager"
        options={managerOptions}
        {...register('managerID')}
      />
    </form>
  )

  return (
    <div>
      <PageHeader
        title={isMyTeamView ? 'My Team' : 'Employees'}
        subtitle={
          isMyTeamView
            ? 'Employees reporting to you'
            : 'Manage your workforce'
        }
        actions={
          !isMyTeamView &&
          canManageEmployees && (
            <Button
              leftIcon={<PlusIcon className="h-4 w-4" />}
              onClick={handleOpenCreateModal}
            >
              Add Employee
            </Button>
          )
        }
      />

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <SearchBar
            value={searchText}
            onChange={setSearchText}
            placeholder="Search by name, department, position…"
            className="w-80"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredEmployees.length === 0 ? (
          <EmptyState
            title="No employees found"
            description={
              isMyTeamView
                ? 'No employees are currently reporting to you.'
                : 'Add your first employee to get started.'
            }
          />
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
                {filteredEmployees.map((employee) => (
                  <tr key={employee.employeeID} className="hover:bg-gray-50">
                    <td className="table-td">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-slate-100">
                          {employee.name}
                        </p>
                        {employee.managerName && (
                          <p className="text-xs text-gray-400 dark:text-slate-500">
                            Mgr: {employee.managerName}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="table-td">{employee.department}</td>
                    <td className="table-td">{employee.position}</td>
                    <td className="table-td text-gray-500 dark:text-slate-400">
                      {format(new Date(employee.joinDate), 'MMM d, yyyy')}
                    </td>
                    <td className="table-td">
                      <StatusBadge status={employee.status} />
                    </td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/employees/${employee.employeeID}`)}
                          className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-blue-500 transition-colors"
                          title="View"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>

                        {canManageEmployees && (
                          <>
                            <button
                              onClick={() => setEmployeeBeingEdited(employee)}
                              className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg text-amber-500 transition-colors"
                              title="Edit"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEmployeeIdToDelete(employee.employeeID)}
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-colors"
                              title="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Employee"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button loading={isSaving} onClick={handleSubmit(handleFormSubmit)}>
              Create Employee
            </Button>
          </>
        }
      >
        {renderEmployeeForm()}
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!employeeBeingEdited}
        onClose={() => setEmployeeBeingEdited(null)}
        title="Edit Employee"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEmployeeBeingEdited(null)}>
              Cancel
            </Button>
            <Button loading={isSaving} onClick={handleSubmit(handleFormSubmit)}>
              Save Changes
            </Button>
          </>
        }
      >
        {renderEmployeeForm()}
      </Modal>

      <ConfirmDialog
        open={!!employeeIdToDelete}
        onClose={() => setEmployeeIdToDelete(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title="Remove Employee"
        message="Are you sure you want to remove this employee? This action cannot be undone."
      />
    </div>
  )
}
