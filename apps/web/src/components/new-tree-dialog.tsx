import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { GitBranchIcon, UploadIcon, FileTextIcon } from "lucide-react"

interface NewTreeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewTreeDialog({ open, onOpenChange }: NewTreeDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [method, setMethod] = useState<"scratch" | "gedcom">("scratch")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-[#D6D0BE] bg-[#EDEAD8] p-0">
        <DialogHeader className="flex flex-row items-center gap-3 border-b border-[#D6D0BE] p-6">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#7D6B3D]">
            <GitBranchIcon className="size-5 text-[#F5F2E9]" />
          </div>
          <div>
            <DialogTitle className="font-['Playfair_Display'] text-xl font-semibold text-[#2D2926]">
              Create New Tree
            </DialogTitle>
            <DialogDescription className="text-sm text-[#5E5954]">
              Start a new family tree or import one
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-5 px-6">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-medium text-[#2D2926]">
              Tree Name
            </Label>
            <Input
              placeholder="e.g. Anderson Family"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-lg border-[#D6D0BE] bg-[#F5F2E9] px-3 text-sm text-[#2D2926] placeholder:text-[#8C8782] outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-medium text-[#2D2926]">
              Description
            </Label>
            <textarea
              placeholder="Brief description of this family tree..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="h-20 resize-none rounded-lg border border-[#D6D0BE] bg-[#F5F2E9] px-3 py-2.5 text-sm text-[#2D2926] placeholder:text-[#8C8782] outline-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-[13px] font-medium text-[#2D2926]">
              Start Method
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMethod("scratch")}
                className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                  method === "scratch"
                    ? "border-[#7D6B3D] bg-[#F5F2E9]"
                    : "border-[#D6D0BE] bg-[#F5F2E9] hover:bg-white"
                }`}
              >
                <div className={`flex size-9 items-center justify-center rounded-lg ${
                  method === "scratch" ? "bg-[#7D6B3D]" : "bg-[#E8E4D8]"
                }`}>
                  <FileTextIcon className={`size-4 ${
                    method === "scratch" ? "text-[#F5F2E9]" : "text-[#8C8782]"
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#2D2926]">Start Fresh</p>
                  <p className="text-xs text-[#8C8782]">Build from scratch</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setMethod("gedcom")}
                className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                  method === "gedcom"
                    ? "border-[#7D6B3D] bg-[#F5F2E9]"
                    : "border-[#D6D0BE] bg-[#F5F2E9] hover:bg-white"
                }`}
              >
                <div className={`flex size-9 items-center justify-center rounded-lg ${
                  method === "gedcom" ? "bg-[#7D6B3D]" : "bg-[#E8E4D8]"
                }`}>
                  <UploadIcon className={`size-4 ${
                    method === "gedcom" ? "text-[#F5F2E9]" : "text-[#8C8782]"
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#2D2926]">Import GEDCOM</p>
                  <p className="text-xs text-[#8C8782]">Upload a .ged file</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-end gap-3 border-t border-[#D6D0BE] p-6">
          <DialogClose
            render={
              <Button
                variant="ghost"
                className="h-11 rounded-lg border border-[#D6D0BE] bg-white px-6 text-sm font-medium text-[#5E5954] hover:bg-[#EDEADE]"
              >
                Cancel
              </Button>
            }
          />
          <Button
            disabled={!name.trim()}
            className="h-11 rounded-lg bg-[#7D6B3D] px-6 text-sm font-semibold text-[#F5F2E9] hover:bg-[#6A5A32] disabled:opacity-50"
          >
            Create Tree
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
