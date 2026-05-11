import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { CloudArrowUpIcon, ArrowPathIcon, DocumentArrowDownIcon, TrashIcon, DocumentIcon } from '@heroicons/react/24/outline'
import { resumesApi } from '../../api/resumes'
import { useAuth } from '../../hooks/useAuth'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { format } from 'date-fns'

const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

export default function ResumePage() {
  const { user } = useAuth()
  const uploadRef = useRef(null)
  const replaceRef = useRef(null)
  const [resume, setResume] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [replacing, setReplacing] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    if (!user) return
    setLoading(true)
    try {
      const list = await resumesApi.getByCandidate(user.userId)
      const resumes = Array.isArray(list) ? list : []
      setResume(resumes[0] ?? null)
    } catch { toast.error('Failed to load resume') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [user])

  const validateFile = (file) => {
    if (file.size > 5 * 1024 * 1024) { toast.error('File must be smaller than 5MB'); return false }
    if (!ALLOWED_TYPES.includes(file.type)) { toast.error('Only PDF and Word documents are allowed'); return false }
    return true
  }

  const onUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user || !validateFile(file)) return
    setUploading(true)
    try {
      await resumesApi.upload(user.userId, file)
      toast.success('Resume uploaded successfully!')
      load()
    } catch { toast.error('Failed to upload resume') }
    finally {
      setUploading(false)
      if (uploadRef.current) uploadRef.current.value = ''
    }
  }

  const onReplace = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !resume || !validateFile(file)) return
    setReplacing(true)
    try {
      await resumesApi.replace(resume.resumeID, file)
      toast.success('Resume replaced successfully!')
      load()
    } catch { toast.error('Failed to replace resume') }
    finally {
      setReplacing(false)
      if (replaceRef.current) replaceRef.current.value = ''
    }
  }

  const onDownload = async () => {
    if (!resume) return
    try {
      const blob = await resumesApi.download(resume.resumeID)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = resume.fileURI.split('/').pop() ?? 'resume'
      a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('Failed to download resume') }
  }

  const onDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await resumesApi.remove(deleteId)
      toast.success('Resume deleted')
      setDeleteId(null)
      setResume(null)
    } catch { toast.error('Failed to delete resume') }
    finally { setDeleting(false) }
  }

  return (
    <div>
      <PageHeader
        title="My Resume"
        subtitle="Upload and manage your resume"
        actions={
          !resume ? (
            <>
              <input ref={uploadRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={onUpload} />
              <Button leftIcon={<CloudArrowUpIcon className="h-4 w-4" />} loading={uploading} onClick={() => uploadRef.current?.click()}>
                Upload Resume
              </Button>
            </>
          ) : null
        }
      />

      <div className="mb-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
        Accepted formats: PDF, DOC, DOCX — Maximum file size: 5MB.{' '}
        {resume ? 'To update your resume, use the Replace button.' : 'You can upload one resume.'}
      </div>

      {/* Hidden replace input */}
      <input ref={replaceRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={onReplace} />

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : !resume ? (
        <div className="card">
          <EmptyState
            title="No resume uploaded"
            description="Upload your resume to apply for jobs. Accepted formats: PDF, DOC, DOCX (max 5MB)."
            icon={<DocumentIcon className="h-8 w-8 text-gray-400" />}
            action={
              <Button leftIcon={<CloudArrowUpIcon className="h-4 w-4" />} onClick={() => uploadRef.current?.click()} loading={uploading}>
                Upload Resume
              </Button>
            }
          />
        </div>
      ) : (
        <div className="card p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <DocumentIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-slate-100 truncate">{resume.fileURI.split('/').pop() ?? 'Resume'}</p>
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-slate-400">
              <span>Uploaded {format(new Date(resume.uploadedDate || resume.createdAt), 'MMM d, yyyy')}</span>
              <StatusBadge status={resume.status} />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<DocumentArrowDownIcon className="h-4 w-4" />}
              onClick={onDownload}
            >
              Download
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ArrowPathIcon className="h-4 w-4" />}
              loading={replacing}
              onClick={() => replaceRef.current?.click()}
            >
              Replace
            </Button>
            <button
              onClick={() => setDeleteId(resume.resumeID)}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-colors"
              title="Delete resume"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={onDelete}
        loading={deleting}
        title="Delete Resume"
        message="Are you sure you want to delete your resume? You will need to upload a new one to apply for jobs."
      />
    </div>
  )
}
