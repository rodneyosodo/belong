import { useEffect, useState } from "react"
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
import { HeartIcon, BabyIcon, ArrowUpIcon, UserPlusIcon } from "lucide-react"
import type { ContextMenuAction } from "./node-context-menu"

interface AddPersonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  action: ContextMenuAction
  onConfirm: (data: { name: string; gender: "male" | "female"; avatar?: string }) => void
}

const actionMeta: Record<ContextMenuAction, { icon: typeof HeartIcon; title: string; description: string }> = {
  spouse: {
    icon: HeartIcon,
    title: "Add Spouse",
    description: "Add a spouse to this family member",
  },
  child: {
    icon: BabyIcon,
    title: "Add Child",
    description: "Add a child to this family member",
  },
  parent: {
    icon: ArrowUpIcon,
    title: "Add Parent",
    description: "Add a parent to this family member",
  },
  sibling: {
    icon: UserPlusIcon,
    title: "Add Sibling",
    description: "Add a sibling to this family member",
  },
  delete: {
    icon: HeartIcon,
    title: "",
    description: "",
  },
};

export function AddPersonDialog({
  open,
  onOpenChange,
  action,
  onConfirm,
}: AddPersonDialogProps) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setGender("male");
      setAvatar("");
    }
  }, [open]);

  const meta = actionMeta[action];
  const Icon = meta.icon;

  const handleConfirm = () => {
    if (!name.trim()) return;
    onConfirm({ name: name.trim(), gender, avatar: avatar.trim() || undefined });
    setName("");
    setGender("male");
    setAvatar("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-[#D6D0BE] bg-[#EDEAD8] p-0 sm:max-w-sm">
        <DialogHeader className="flex flex-row items-center gap-3 border-b border-[#D6D0BE] p-5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#7D6B3D]">
            <Icon className="size-4 text-[#F5F2E9]" />
          </div>
          <div>
            <DialogTitle className="font-['Playfair_Display'] text-lg font-semibold text-[#2D2926]">
              {meta.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5E5954]">
              {meta.description}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-5 pb-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-medium text-[#2D2926]">Name</Label>
            <Input
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirm();
              }}
              className="h-10 rounded-lg border-[#D6D0BE] bg-[#F5F2E9] px-3 text-sm text-[#2D2926] placeholder:text-[#8C8782] outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-medium text-[#2D2926]">Gender</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGender("male")}
                className={`rounded-lg border p-2.5 text-center text-sm font-medium transition-colors ${
                  gender === "male"
                    ? "border-[#7D6B3D] bg-[#F5F2E9] text-[#2D2926]"
                    : "border-[#D6D0BE] bg-[#F5F2E9] text-[#5E5954] hover:bg-white"
                }`}
              >
                Male
              </button>
              <button
                type="button"
                onClick={() => setGender("female")}
                className={`rounded-lg border p-2.5 text-center text-sm font-medium transition-colors ${
                  gender === "female"
                    ? "border-[#7D6B3D] bg-[#F5F2E9] text-[#2D2926]"
                    : "border-[#D6D0BE] bg-[#F5F2E9] text-[#5E5954] hover:bg-white"
                }`}
              >
                Female
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-medium text-[#2D2926]">Avatar URL</Label>
            <Input
              placeholder="https://example.com/photo.jpg"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="h-10 rounded-lg border-[#D6D0BE] bg-[#F5F2E9] px-3 text-sm text-[#2D2926] placeholder:text-[#8C8782] outline-none"
            />
          </div>
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
            disabled={!name.trim()}
            onClick={handleConfirm}
            className="h-9 rounded-lg bg-[#7D6B3D] px-4 text-sm font-semibold text-[#F5F2E9] hover:bg-[#6A5A32] disabled:opacity-50"
          >
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
