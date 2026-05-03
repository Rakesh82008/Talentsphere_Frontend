import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import Modal from './Modal'
import Button from './Button'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  confirmLabel?: string
  loading?: boolean
}

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmLabel = 'Delete',
  loading = false,
}: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-red-100">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
        </div>
        <p className="text-sm text-gray-600 pt-2">{message}</p>
      </div>
    </Modal>
  )
}
