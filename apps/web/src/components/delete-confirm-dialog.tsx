import { Button } from '@workspace/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@workspace/ui/components/dialog';
import { Trash2Icon } from 'lucide-react';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personName: string;
  relationshipCount: number;
  onConfirm: () => void;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  personName,
  relationshipCount,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-[#D6D0BE] bg-[#EDEAD8] p-0 sm:max-w-md">
        <DialogHeader className="flex flex-row items-center gap-3 border-b border-[#D6D0BE] p-5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-red-100">
            <Trash2Icon className="size-4 text-red-600" />
          </div>
          <div>
            <DialogTitle className="font-['Playfair_Display'] text-lg font-semibold text-[#2D2926]">
              Delete Person
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5E5954]">
              This action cannot be undone
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="px-5 py-4">
          <p className="text-sm text-[#2D2926]">
            Are you sure you want to delete <strong>{personName}</strong>?
          </p>
          {relationshipCount > 0 && (
            <p className="mt-2 text-sm text-[#8C8782]">
              This will also remove {relationshipCount} relationship
              {relationshipCount > 1 ? 's' : ''} connected to this person.
            </p>
          )}
        </div>

        <DialogFooter className="flex items-center justify-end gap-2 border-t border-[#D6D0BE] p-5">
          <DialogClose
            render={
              <Button
                variant="ghost"
                className="h-9 rounded-lg border border-[#D6D0BE] bg-white px-4 text-sm font-medium text-[#5E5954] hover:bg-[#EDEADE]"
              >
                Cancel
              </Button>
            }
          />
          <Button
            onClick={onConfirm}
            className="h-9 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
