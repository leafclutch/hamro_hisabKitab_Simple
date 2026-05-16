import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { AlertTriangle } from 'lucide-react'

interface DeleteUserDialogProps {
  open: boolean
  userName: string
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}

export function DeleteUserDialog({ open, userName, onClose, onConfirm, loading }: DeleteUserDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title="Delete user">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
          <div>
            <p className="font-medium text-red-800">This action cannot be undone</p>
            <p className="mt-0.5 text-sm text-red-600">
              You are about to permanently delete <strong>{userName}</strong> and all their data.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} loading={loading}>
            Delete user
          </Button>
        </div>
      </div>
    </Modal>
  )
}
