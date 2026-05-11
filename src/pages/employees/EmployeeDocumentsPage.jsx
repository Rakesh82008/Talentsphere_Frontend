import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  TrashIcon,
  ArrowLeftIcon,
  ArrowUpTrayIcon,
  BellIcon,
  DocumentIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { employeesApi } from '../../api/employees'
import { useAuth } from '../../hooks/useAuth'
import { usePermissions } from '../../hooks/usePermissions'
import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Select from '../../components/common/Select'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'
import { format } from 'date-fns'

const DOC_TYPES = [
  { value: 'Resume', label: 'Resume' },
  { value: 'Certificate', label: 'Certificate' },
  { value: 'License', label: 'License' },
  { value: 'Identification', label: 'Identification' },
]

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

export default function EmployeeDocumentsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isEmployee } = useAuth()
  const { can } = usePermissions()

  const [empId, setEmpId] = useState(id ? parseInt(id) : null)
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)

  // Upload modal (employee only)
  const [showUpload, setShowUpload] = useState(false)
  const [docType, setDocType] = useState('Resume')
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  // Verify / Reject (HR/Admin only)
  const [verifyingId, setVerifyingId] = useState(null)

  // Delete
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Reminder (HR/Admin only)
  const [sendingReminder, setSendingReminder] = useState(false)

  const load = async (resolvedEmpId) => {
    setLoading(true)
    try {
      const data = await employeesApi.getDocsByEmployee(resolvedEmpId)
      setDocs(data)
    } catch {
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      if (empId) { load(empId); return }
      try {
        const me = await employeesApi.getMe()
        setEmpId(me.employeeID)
        load(me.employeeID)
      } catch {
        toast.error('Could not load your employee profile')
        setLoading(false)
      }
    }
    init()
  }, [id])

  const onUpload = async () => {
    if (!selectedFile || !empId) return
    setUploading(true)
    try {
      await employeesApi.uploadDocFile(empId, docType, selectedFile)
      toast.success('Document uploaded successfully')
      setShowUpload(false)
      setSelectedFile(null)
      setDocType('Resume')
      load(empId)
    } catch {
      toast.error('Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  const onVerify = async (docId, status) => {
    setVerifyingId(docId)
    try {
      await employeesApi.updateDoc(docId, { verifyStatus: status })
      toast.success(`Document ${status.toLowerCase()}`)
      setDocs((prev) => prev.map((d) => d.documentID === docId ? { ...d, verifyStatus: status } : d))
    } catch {
      toast.error('Failed to update document status')
    } finally {
      setVerifyingId(null)
    }
  }

  const onDelete = async () => {
    if (!deleteId || !empId) return
    setDeleting(true)
    try {
      await employeesApi.removeDoc(deleteId)
      toast.success('Document deleted')
      setDeleteId(null)
      load(empId)
    } catch {
      toast.error('Failed to delete document')
    } finally {
      setDeleting(false) }
  }

  const onSendReminder = async () => {
    if (!empId) return
    setSendingReminder(true)
    try {
      await employeesApi.sendDocReminder(empId)
      toast.success('Reminder sent to employee')
    } catch {
      toast.error('Failed to send reminder')
    } finally {
      setSendingReminder(false)
    }
  }

  // HR/Admin can verify/delete; Employee can upload/delete their own
  const isHR = !isEmployee()

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white mb-4"
      >
        <ArrowLeftIcon className="h-4 w-4" /> Back
      </button>

      <PageHeader
        title="Employee Documents"
        subtitle={isEmployee() ? 'Upload and manage your documents' : 'Review and verify employee documents'}
        actions={
          <div className="flex gap-2">
            {/* HR/Admin: send reminder, no upload */}
            {isHR && empId && (
              <Button
                variant="secondary"
                leftIcon={<BellIcon className="h-4 w-4" />}
                loading={sendingReminder}
                onClick={onSendReminder}
              >
                Send Reminder
              </Button>
            )}
            {/* Employee only: upload */}
            {isEmployee() && (
              <Button
                leftIcon={<ArrowUpTrayIcon className="h-4 w-4" />}
                onClick={() => { setSelectedFile(null); setDocType('Resume'); setShowUpload(true) }}
              >
                Upload Document
              </Button>
            )}
          </div>
        }
      />

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : docs.length === 0 ? (
          <EmptyState
            title="No documents uploaded"
            description={isEmployee() ? 'Upload your documents using the button above.' : 'No documents have been uploaded for this employee.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-th">Document Type</th>
                  <th className="table-th">File</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Uploaded</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {docs.map((d) => {
                  const fileUrl = d.fileURI?.startsWith('http') ? d.fileURI : `${API_BASE}${d.fileURI}`
                  return (
                    <tr key={d.documentID} className="hover:bg-gray-50">
                      <td className="table-td font-medium">
                        <div className="flex items-center gap-2">
                          <DocumentIcon className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                          {d.docType}
                        </div>
                      </td>
                      <td className="table-td">
                        {d.fileURI ? (
                          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                            View File
                          </a>
                        ) : (
                          <span className="text-gray-400 dark:text-slate-500 text-sm">No file</span>
                        )}
                      </td>
                      <td className="table-td">
                        <StatusBadge status={d.verifyStatus} />
                      </td>
                      <td className="table-td text-gray-500 dark:text-slate-400 text-sm">
                        {format(new Date(d.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="table-td">
                        <div className="flex items-center gap-1">
                          {/* HR/Admin: Verify and Reject buttons — only on Pending docs */}
                          {isHR && d.verifyStatus === 'Pending' && (
                            <>
                              <button
                                onClick={() => onVerify(d.documentID, 'Verified')}
                                disabled={verifyingId === d.documentID}
                                className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-600 disabled:opacity-50 transition-colors"
                                title="Verify"
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => onVerify(d.documentID, 'Rejected')}
                                disabled={verifyingId === d.documentID}
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 disabled:opacity-50 transition-colors"
                                title="Reject"
                              >
                                <XCircleIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {/* Delete: Admin always, Employee for their own */}
                          {(can('MANAGE_EMPLOYEES') || isEmployee()) && (
                            <button
                              onClick={() => setDeleteId(d.documentID)}
                              className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 transition-colors"
                              title="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
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

      {/* Upload Modal — only reachable by employees */}
      <Modal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        title="Upload Document"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowUpload(false)}>Cancel</Button>
            <Button
              loading={uploading}
              disabled={!selectedFile}
              leftIcon={<ArrowUpTrayIcon className="h-4 w-4" />}
              onClick={onUpload}
            >
              Upload
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Document Type"
            required
            options={DOC_TYPES}
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
          />
          <div>
            <label className="form-label">File <span className="text-red-500">*</span></label>
            <div
              className="mt-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
              {selectedFile ? (
                <div className="text-center">
                  <DocumentIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div className="text-center">
                  <ArrowUpTrayIcon className="h-8 w-8 text-gray-400 dark:text-slate-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-slate-400">Click to select a file</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">PDF, DOC, DOCX, JPG, PNG · Max 10 MB</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={onDelete}
        loading={deleting}
        title="Delete Document"
        message="Are you sure you want to delete this document?"
      />
    </div>
  )
}
