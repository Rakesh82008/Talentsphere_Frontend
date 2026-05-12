// Employee Documents Page
//
// Shows the list of documents for a single employee.
// - HR / Admin users can review, verify, reject and send reminders.
// - Employee users can upload and delete their own documents.
//
// The URL is either /employees/:id/documents (HR/Admin view) or
// /my-documents (employee viewing their own). When :id is missing we
// look up the logged-in user's employeeID via /employees/me.

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
import { format } from 'date-fns'

import { employeesApi } from '../../api/employees'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissions } from '../../hooks/usePermissions'

import PageHeader from '../../components/common/PageHeader'
import Button from '../../components/common/Button'
import Select from '../../components/common/Select'
import Modal from '../../components/common/Modal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import EmptyState from '../../components/common/EmptyState'

// Allowed document types shown in the upload dropdown.
const DOCUMENT_TYPE_OPTIONS = [
  { value: 'Resume', label: 'Resume' },
  { value: 'Certificate', label: 'Certificate' },
  { value: 'License', label: 'License' },
  { value: 'Identification', label: 'Identification' },
]

// Base URL of the backend — used to build absolute links for files
// stored on the server (when fileURI is a relative path).
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'

export default function EmployeeDocumentsPage() {
  const { id: routeEmployeeId } = useParams()
  const navigate = useNavigate()
  const { isEmployee } = useAuth()
  const { can } = usePermissions()

  // ID of the employee whose documents we are showing.
  // For HR/Admin this comes from the URL. For an employee viewing
  // their own page it is fetched from /employees/me inside useEffect.
  const [employeeId, setEmployeeId] = useState(
    routeEmployeeId ? parseInt(routeEmployeeId) : null
  )

  // The list of documents loaded from the server.
  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // ----- Upload modal state (employees only) -----
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedDocType, setSelectedDocType] = useState('Resume')
  const [selectedFile, setSelectedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  // ----- Verify / Reject state (HR/Admin only) -----
  // Holds the ID of the document currently being verified so we can
  // disable its action buttons while the request is in flight.
  const [verifyingDocId, setVerifyingDocId] = useState(null)

  // ----- Delete confirmation state -----
  const [docIdToDelete, setDocIdToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // ----- Send-reminder state (HR/Admin only) -----
  const [isSendingReminder, setIsSendingReminder] = useState(false)

  // HR/Admin = anyone who is NOT an "employee" role.
  // They can verify, reject and send reminders.
  const isHRorAdmin = !isEmployee()

  // -----------------------------------------------------------------
  // API call: load the documents for the given employee.
  // Called from useEffect on mount and after upload/delete actions.
  // -----------------------------------------------------------------
  const fetchDocuments = async (targetEmployeeId) => {
    setIsLoading(true)
    try {
      const data = await employeesApi.getDocsByEmployee(targetEmployeeId)
      setDocuments(data)
    } catch {
      toast.error('Failed to load documents')
    } finally {
      setIsLoading(false)
    }
  }

  // -----------------------------------------------------------------
  // useEffect: runs once on mount (and again if the URL :id changes).
  //
  // Two cases:
  //   1. We already have an employeeId from the URL — just fetch docs.
  //   2. No :id in the URL (employee viewing their own page) — first
  //      look up the logged-in user's employeeID, then fetch docs.
  // -----------------------------------------------------------------
  useEffect(() => {
    const initializePage = async () => {
      if (employeeId) {
        fetchDocuments(employeeId)
        return
      }

      try {
        const myEmployee = await employeesApi.getMe()
        setEmployeeId(myEmployee.employeeID)
        fetchDocuments(myEmployee.employeeID)
      } catch {
        toast.error('Could not load your employee profile')
        setIsLoading(false)
      }
    }

    initializePage()
    // We intentionally depend only on the URL :id. employeeId will be
    // set inside the effect when it starts out null.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeEmployeeId])

  // -----------------------------------------------------------------
  // Handler: open the upload modal with a clean state.
  // -----------------------------------------------------------------
  const handleOpenUploadModal = () => {
    setSelectedFile(null)
    setSelectedDocType('Resume')
    setIsUploadModalOpen(true)
  }

  // -----------------------------------------------------------------
  // Handler: store the file the user picked from the file input.
  // -----------------------------------------------------------------
  const handleFileChange = (event) => {
    const file = event.target.files?.[0] ?? null
    setSelectedFile(file)
  }

  // -----------------------------------------------------------------
  // Handler: upload the selected file to the server, then reload
  // the document list so the new document appears.
  // -----------------------------------------------------------------
  const handleUpload = async () => {
    if (!selectedFile || !employeeId) return

    setIsUploading(true)
    try {
      await employeesApi.uploadDocFile(employeeId, selectedDocType, selectedFile)
      toast.success('Document uploaded successfully')

      // Reset the modal and refresh the list.
      setIsUploadModalOpen(false)
      setSelectedFile(null)
      setSelectedDocType('Resume')
      fetchDocuments(employeeId)
    } catch {
      toast.error('Failed to upload document')
    } finally {
      setIsUploading(false)
    }
  }

  // -----------------------------------------------------------------
  // Handler: mark a document as Verified or Rejected (HR/Admin only).
  //
  // We update the local "documents" state in place so the row updates
  // immediately without needing to reload the entire list.
  // -----------------------------------------------------------------
  const handleVerify = async (documentId, newStatus) => {
    setVerifyingDocId(documentId)
    try {
      await employeesApi.updateDoc(documentId, { verifyStatus: newStatus })
      toast.success(`Document ${newStatus.toLowerCase()}`)

      // Update just this one row in the documents array.
      setDocuments((previousDocs) =>
        previousDocs.map((doc) => {
          if (doc.documentID === documentId) {
            return { ...doc, verifyStatus: newStatus }
          }
          return doc
        })
      )
    } catch {
      toast.error('Failed to update document status')
    } finally {
      setVerifyingDocId(null)
    }
  }

  // -----------------------------------------------------------------
  // Handler: delete a document after the user confirms in the dialog.
  // -----------------------------------------------------------------
  const handleDelete = async () => {
    if (!docIdToDelete || !employeeId) return

    setIsDeleting(true)
    try {
      await employeesApi.removeDoc(docIdToDelete)
      toast.success('Document deleted')
      setDocIdToDelete(null)
      fetchDocuments(employeeId)
    } catch {
      toast.error('Failed to delete document')
    } finally {
      setIsDeleting(false)
    }
  }

  // -----------------------------------------------------------------
  // Handler: send the employee an email reminder to upload missing
  // documents (HR/Admin only).
  // -----------------------------------------------------------------
  const handleSendReminder = async () => {
    if (!employeeId) return

    setIsSendingReminder(true)
    try {
      await employeesApi.sendDocReminder(employeeId)
      toast.success('Reminder sent to employee')
    } catch {
      toast.error('Failed to send reminder')
    } finally {
      setIsSendingReminder(false)
    }
  }

  // -----------------------------------------------------------------
  // Helper: build the full file URL.
  // If the server returns an absolute URL ("http...") use it as-is,
  // otherwise prefix it with our API base URL.
  // -----------------------------------------------------------------
  const buildFileUrl = (fileURI) => {
    if (!fileURI) return null
    if (fileURI.startsWith('http')) return fileURI
    return `${API_BASE_URL}${fileURI}`
  }

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
        subtitle={
          isEmployee()
            ? 'Upload and manage your documents'
            : 'Review and verify employee documents'
        }
        actions={
          <div className="flex gap-2">
            {/* HR/Admin: send a reminder email to the employee */}
            {isHRorAdmin && employeeId && (
              <Button
                variant="secondary"
                leftIcon={<BellIcon className="h-4 w-4" />}
                loading={isSendingReminder}
                onClick={handleSendReminder}
              >
                Send Reminder
              </Button>
            )}

            {/* Employee: open the upload modal */}
            {isEmployee() && (
              <Button
                leftIcon={<ArrowUpTrayIcon className="h-4 w-4" />}
                onClick={handleOpenUploadModal}
              >
                Upload Document
              </Button>
            )}
          </div>
        }
      />

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : documents.length === 0 ? (
          <EmptyState
            title="No documents uploaded"
            description={
              isEmployee()
                ? 'Upload your documents using the button above.'
                : 'No documents have been uploaded for this employee.'
            }
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
                {documents.map((doc) => {
                  const fileUrl = buildFileUrl(doc.fileURI)
                  const isPending = doc.verifyStatus === 'Pending'
                  const isThisDocVerifying = verifyingDocId === doc.documentID
                  const canDelete = can('MANAGE_EMPLOYEES') || isEmployee()

                  return (
                    <tr key={doc.documentID} className="hover:bg-gray-50">
                      <td className="table-td font-medium">
                        <div className="flex items-center gap-2">
                          <DocumentIcon className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                          {doc.docType}
                        </div>
                      </td>

                      <td className="table-td">
                        {fileUrl ? (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                          >
                            View File
                          </a>
                        ) : (
                          <span className="text-gray-400 dark:text-slate-500 text-sm">
                            No file
                          </span>
                        )}
                      </td>

                      <td className="table-td">
                        <StatusBadge status={doc.verifyStatus} />
                      </td>

                      <td className="table-td text-gray-500 dark:text-slate-400 text-sm">
                        {format(new Date(doc.createdAt), 'MMM d, yyyy')}
                      </td>

                      <td className="table-td">
                        <div className="flex items-center gap-1">
                          {/* HR/Admin: Verify & Reject — only while Pending */}
                          {isHRorAdmin && isPending && (
                            <>
                              <button
                                onClick={() => handleVerify(doc.documentID, 'Verified')}
                                disabled={isThisDocVerifying}
                                className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-600 disabled:opacity-50 transition-colors"
                                title="Verify"
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleVerify(doc.documentID, 'Rejected')}
                                disabled={isThisDocVerifying}
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 disabled:opacity-50 transition-colors"
                                title="Reject"
                              >
                                <XCircleIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}

                          {/* Delete: Admin always, Employee on their own docs */}
                          {canDelete && (
                            <button
                              onClick={() => setDocIdToDelete(doc.documentID)}
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

      {/* Upload Modal — only used by employees */}
      <Modal
        open={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Document"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={isUploading}
              disabled={!selectedFile}
              leftIcon={<ArrowUpTrayIcon className="h-4 w-4" />}
              onClick={handleUpload}
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
            options={DOCUMENT_TYPE_OPTIONS}
            value={selectedDocType}
            onChange={(event) => setSelectedDocType(event.target.value)}
          />

          <div>
            <label className="form-label">
              File <span className="text-red-500">*</span>
            </label>

            {/* Click the dashed box to open the hidden <input type="file" /> */}
            <div
              className="mt-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />

              {selectedFile ? (
                <div className="text-center">
                  <DocumentIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <ArrowUpTrayIcon className="h-8 w-8 text-gray-400 dark:text-slate-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Click to select a file
                  </p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                    PDF, DOC, DOCX, JPG, PNG · Max 10 MB
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!docIdToDelete}
        onClose={() => setDocIdToDelete(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title="Delete Document"
        message="Are you sure you want to delete this document?"
      />
    </div>
  )
}
