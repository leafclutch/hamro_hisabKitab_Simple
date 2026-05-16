import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { TriangleAlert } from 'lucide-react'

interface DeleteUserDialogProps {
  open: boolean
  userName: string
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}

export function DeleteUserDialog({ open, userName, onClose, onConfirm, loading }: DeleteUserDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title="Delete user account">
      <div className="space-y-4">
        <div className="flex gap-3 rounded-xl bg-red-50 border border-red-100 p-4">
          <TriangleAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-red-800">This cannot be undone</p>
            <p className="mt-1 text-sm text-red-600 leading-relaxed">
              Deleting <strong className="font-semibold">{userName}</strong> will permanently remove their account and all associated data.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} loading={loading}>
            Delete account
          </Button>
        </div>
      </div>
    </Modal>
  )
}
