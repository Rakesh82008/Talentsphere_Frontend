import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import Modal from './Modal'
import Button from './Button'

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmLabel = 'Delete',
  loading = false,
}) {
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
        <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-900/30">
          <ExclamationTriangleIcon className="h-5 w-5 text-rose-600 dark:text-rose-400" />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 pt-2 leading-relaxed">{message}</p>
      </div>
    </Modal>
  )
}
