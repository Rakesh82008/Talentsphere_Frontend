import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { performanceApi } from '../../api/performance'
import { employeesApi } from '../../api/employees'
import { useAuth } from '../../hooks/useAuth'
import { usePermissions } from '../../hooks/usePermissions'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import SearchBar from '../../components/common/SearchBar'
import { format } from 'date-fns'

export default function PerformanceReviewsPage() {
  const { can } = usePermissions()
  const { isEmployee } = useAuth()
  const [reviews, setReviews] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editReview, setEditReview] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const load = async () => {
    setLoading(true)
    try {
      if (isEmployee()) {
        const emp = await employeesApi.getMe().catch(() => null)
        const r = await performanceApi.getAll(emp?.employeeID)
        setReviews(r)
      } else {
        const [r, e] = await Promise.allSettled([
          performanceApi.getAll(undefined),
          employeesApi.getAll(),
        ])
        if (r.status === 'fulfilled') setReviews(r.value)
        if (e.status === 'fulfilled') setEmployees(e.value)
      }
    } catch { toast.error('Failed to load reviews') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    if (editReview) reset({ employeeID: String(editReview.employeeID), reviewDate: editReview.reviewDate?.split('T')[0], rating: String(editReview.rating), comments: editReview.comments ?? '' })
    else reset({ rating: '3' })
  }, [editReview, showCreate, reset])

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      const payload = { employeeID: parseInt(data.employeeID), reviewDate: data.reviewDate, rating: parseInt(data.rating), comments: data.comments }
      if (editReview) {
        await performanceApi.update(editReview.reviewID, { reviewDate: payload.reviewDate, rating: payload.rating, comments: payload.comments })
        toast.success('Review updated')
        setEditReview(null)
      } else {
        await performanceApi.create(payload)
        toast.success('Review created')
        setShowCreate(false)
      }
      load()
    } catch { toast.error('Failed to save review') }
    finally { setSaving(false) }
  }

  const onDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await performanceApi.remove(deleteId)
      toast.success('Review deleted')
      setDeleteId(null)
      load()
    } catch { toast.error('Failed to delete review') }
    finally { setDeleting(false) }
  }

  const filtered = reviews.filter((r) => !search || r.employeeName?.toLowerCase().includes(search.toLowerCase()))

  const RatingStars = ({ rating }) => (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`text-base ${i < rating ? 'text-yellow-400' : 'text-gray-200 dark:text-gray-600'}`}>★</span>
      ))}
      <span className="text-xs text-gray-500 dark:text-slate-400 ml-1">{rating}/5</span>
    </div>
  )

  return (
    <div>
      <PageHeader
        title={isEmployee() ? 'My Performance Reviews' : 'Performance Reviews'}
        subtitle="Track and manage employee performance evaluations"
        actions={can('MANAGE_REVIEWS') && (
          <Button leftIcon={<PlusIcon className="h-4 w-4" />} onClick={() => { reset({ rating: '3' }); setShowCreate(true) }}>
            New Review
          </Button>
        )}
      />

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by employee name…" className="w-80" />
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No reviews found" description="Create the first performance review." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {!isEmployee() && <th className="table-th">Employee</th>}
                  <th className="table-th">Review Date</th>
                  <th className="table-th">Rating</th>
                  <th className="table-th">Comments</th>
                  {can('MANAGE_REVIEWS') && <th className="table-th">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((r) => (
                  <tr key={r.reviewID} className="hover:bg-gray-50">
                    {!isEmployee() && <td className="table-td font-medium">{r.employeeName ?? `Employee #${r.employeeID}`}</td>}
                    <td className="table-td text-gray-600 dark:text-slate-400">{format(new Date(r.reviewDate), 'MMM d, yyyy')}</td>
                    <td className="table-td"><RatingStars rating={r.rating} /></td>
                    <td className="table-td text-gray-500 dark:text-slate-400 max-w-xs truncate">{r.comments ?? '—'}</td>
                    {can('MANAGE_REVIEWS') && (
                      <td className="table-td">
                        <div className="flex gap-2">
                          <button onClick={() => setEditReview(r)} className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg text-amber-500"><PencilIcon className="h-4 w-4" /></button>
                          <button onClick={() => setDeleteId(r.reviewID)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500"><TrashIcon className="h-4 w-4" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Performance Review"
        footer={<><Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>Create</Button></>}>
        <form className="space-y-4">
          <Select label="Employee" required placeholder="Select employee" error={errors.employeeID?.message}
            options={employees.map((e) => ({ value: e.employeeID, label: e.name }))}
            {...register('employeeID', { required: 'Employee is required' })} />
          <Input label="Review Date" type="date" required error={errors.reviewDate?.message} {...register('reviewDate', { required: 'Date is required' })} />
          <Select label="Rating" options={[1,2,3,4,5].map((n) => ({value:n,label:`${n} Star${n>1?'s':''}`}))} {...register('rating')} />
          <div><label className="form-label">Comments</label><textarea className="input min-h-[80px]" {...register('comments')} /></div>
        </form>
      </Modal>

      <Modal open={!!editReview} onClose={() => setEditReview(null)} title="Edit Review"
        footer={<><Button variant="secondary" onClick={() => setEditReview(null)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>Save</Button></>}>
        <form className="space-y-4">
          <Input label="Review Date" type="date" required error={errors.reviewDate?.message} {...register('reviewDate', { required: 'Date is required' })} />
          <Select label="Rating" options={[1,2,3,4,5].map((n) => ({value:n,label:`${n} Star${n>1?'s':''}`}))} {...register('rating')} />
          <div><label className="form-label">Comments</label><textarea className="input min-h-[80px]" {...register('comments')} /></div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={onDelete} loading={deleting} title="Delete Review" />
    </div>
  )
}
