// Resume Page (candidate view)
//
// A candidate can upload one resume, replace it with a newer file,
// download a copy, or delete it. Files are restricted to PDF / DOC /
// DOCX and must be under 5 MB.

import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  CloudArrowUpIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  TrashIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'

import { resumesApi } from '../../api/resumes'
import { useAuth } from '../../hooks/useAuth'

import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import ConfirmDialog from '../../components/common/ConfirmDialog'

// Limits applied to any uploaded file.
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

// -------------------------------------------------------------------
// Helper: check a chosen file against our size + type rules.
// Returns true if the file is acceptable, false otherwise (and shows
// a toast describing the problem).
// -------------------------------------------------------------------
const isFileAcceptable = (file) => {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    toast.error('File must be smaller than 5MB')
    return false
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    toast.error('Only PDF and Word documents are allowed')
    return false
  }
  return true
}

export default function ResumePage() {
  const { user } = useAuth()

  // Hidden file inputs used by the upload + replace buttons.
  const uploadInputRef = useRef(null)
  const replaceInputRef = useRef(null)

  const [resume, setResume] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isReplacing, setIsReplacing] = useState(false)
  const [resumeIdToDelete, setResumeIdToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // -----------------------------------------------------------------
  // API call: load the candidate's resume. Each candidate has at most
  // one resume, so we keep just the first item from the response.
  // -----------------------------------------------------------------
  const fetchResume = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const response = await resumesApi.getByCandidate(user.userId)
      const resumeList = Array.isArray(response) ? response : []
      setResume(resumeList[0] ?? null)
    } catch {
      toast.error('Failed to load resume')
    } finally {
      setIsLoading(false)
    }
  }

  // useEffect: load the resume when the user becomes available.
  useEffect(() => {
    fetchResume()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // -----------------------------------------------------------------
  // Handler: upload a brand new resume.
  // -----------------------------------------------------------------
  const handleUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !user || !isFileAcceptable(file)) return

    setIsUploading(true)
    try {
      await resumesApi.upload(user.userId, file)
      toast.success('Resume uploaded successfully!')
      fetchResume()
    } catch {
      toast.error('Failed to upload resume')
    } finally {
      setIsUploading(false)
      // Clear the file input so the same file can be re-selected later.
      if (uploadInputRef.current) {
        uploadInputRef.current.value = ''
      }
    }
  }

  // -----------------------------------------------------------------
  // Handler: replace the current resume with a new file.
  // -----------------------------------------------------------------
  const handleReplace = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !resume || !isFileAcceptable(file)) return

    setIsReplacing(true)
    try {
      await resumesApi.replace(resume.resumeID, file)
      toast.success('Resume replaced successfully!')
      fetchResume()
    } catch {
      toast.error('Failed to replace resume')
    } finally {
      setIsReplacing(false)
      if (replaceInputRef.current) {
        replaceInputRef.current.value = ''
      }
    }
  }

  // -----------------------------------------------------------------
  // Handler: download the resume as a file.
  //
  // The API returns a Blob; we wrap it in an object URL and trigger
  // a hidden <a> click to save it.
  // -----------------------------------------------------------------
  const handleDownload = async () => {
    if (!resume) return

    try {
      const blob = await resumesApi.download(resume.resumeID)
      const downloadUrl = URL.createObjectURL(blob)

      const downloadLink = document.createElement('a')
      downloadLink.href = downloadUrl
      downloadLink.download = resume.fileURI.split('/').pop() ?? 'resume'
      downloadLink.click()

      URL.revokeObjectURL(downloadUrl)
    } catch {
      toast.error('Failed to download resume')
    }
  }

  // -----------------------------------------------------------------
  // Handler: delete the resume after the user confirms.
  // -----------------------------------------------------------------
  const handleDelete = async () => {
    if (!resumeIdToDelete) return

    setIsDeleting(true)
    try {
      await resumesApi.remove(resumeIdToDelete)
      toast.success('Resume deleted')
      setResumeIdToDelete(null)
      setResume(null)
    } catch {
      toast.error('Failed to delete resume')
    } finally {
      setIsDeleting(false)
    }
  }

  // Convenience: file name pulled from the stored URI.
  const fileName = resume?.fileURI.split('/').pop() ?? 'Resume'
  const uploadedDate = resume
    ? format(new Date(resume.uploadedDate || resume.createdAt), 'MMM d, yyyy')
    : null

  return (
    <div>
      <PageHeader
        title="My Resume"
        subtitle="Upload and manage your resume"
        actions={
          !resume && (
            <>
              <input
                ref={uploadInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleUpload}
              />
              <Button
                leftIcon={<CloudArrowUpIcon className="h-4 w-4" />}
                loading={isUploading}
                onClick={() => uploadInputRef.current?.click()}
              >
                Upload Resume
              </Button>
            </>
          )
        }
      />

      {/* Help banner */}
      <div className="mb-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
        Accepted formats: PDF, DOC, DOCX — Maximum file size: 5MB.{' '}
        {resume
          ? 'To update your resume, use the Replace button.'
          : 'You can upload one resume.'}
      </div>

      {/* Hidden replace input, always rendered so we can click it from the card */}
      <input
        ref={replaceInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={handleReplace}
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : !resume ? (
        <div className="card">
          <EmptyState
            title="No resume uploaded"
            description="Upload your resume to apply for jobs. Accepted formats: PDF, DOC, DOCX (max 5MB)."
            icon={<DocumentIcon className="h-8 w-8 text-gray-400" />}
            action={
              <Button
                leftIcon={<CloudArrowUpIcon className="h-4 w-4" />}
                onClick={() => uploadInputRef.current?.click()}
                loading={isUploading}
              >
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
            <p className="font-medium text-gray-900 dark:text-slate-100 truncate">
              {fileName}
            </p>
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-slate-400">
              <span>Uploaded {uploadedDate}</span>
              <StatusBadge status={resume.status} />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<DocumentArrowDownIcon className="h-4 w-4" />}
              onClick={handleDownload}
            >
              Download
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ArrowPathIcon className="h-4 w-4" />}
              loading={isReplacing}
              onClick={() => replaceInputRef.current?.click()}
            >
              Replace
            </Button>
            <button
              onClick={() => setResumeIdToDelete(resume.resumeID)}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-colors"
              title="Delete resume"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!resumeIdToDelete}
        onClose={() => setResumeIdToDelete(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title="Delete Resume"
        message="Are you sure you want to delete your resume? You will need to upload a new one to apply for jobs."
      />
    </div>
  )
}
