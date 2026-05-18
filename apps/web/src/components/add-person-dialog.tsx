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
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { HeartIcon, BabyIcon, ArrowUpIcon, UserPlusIcon, UploadIcon, Loader2, XIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { uploadPersonPhoto } from '@/lib/api';
import type { ContextMenuAction } from './node-context-menu';

export type PersonFormData = {
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
  dateOfBirth?: string;
  dateOfDeath?: string;
  notes?: string;
  photo?: string;
  relationshipType?: string;
};

interface AddPersonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: ContextMenuAction;
  onConfirm: (data: PersonFormData) => void;
}

const actionMeta: Record<
  ContextMenuAction,
  { icon: typeof HeartIcon; title: string; description: string }
> = {
  add: {
    icon: UserPlusIcon,
    title: 'Add Member',
    description: 'Add a new family member',
  },
  spouse: {
    icon: HeartIcon,
    title: 'Add Spouse',
    description: 'Add a spouse to this family member',
  },
  child: {
    icon: BabyIcon,
    title: 'Add Child',
    description: 'Add a child to this family member',
  },
  parent: {
    icon: ArrowUpIcon,
    title: 'Add Parent',
    description: 'Add a parent to this family member',
  },
  sibling: {
    icon: UserPlusIcon,
    title: 'Add Sibling',
    description: 'Add a sibling to this family member',
  },
  delete: {
    icon: HeartIcon,
    title: '',
    description: '',
  },
};

const relationshipTypes = [
  'Biological',
  'Adopted',
  'Step',
  'Foster',
  'In-Law',
  'Godparent',
  'Other',
];

export function AddPersonDialog({ open, onOpenChange, action, onConfirm }: AddPersonDialogProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [dateOfDeath, setDateOfDeath] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [relationshipType, setRelationshipType] = useState('Biological');

  useEffect(() => {
    if (open) {
      setFirstName('');
      setLastName('');
      setGender('male');
      setDateOfBirth('');
      setDateOfDeath('');
      setNotes('');
      setPhoto('');
      setPhotoPreview('');
      setUploadingPhoto(false);
      setRelationshipType('Biological');
    }
  }, [open]);

  const meta = actionMeta[action];
  const Icon = meta.icon;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File must be an image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      const result = await uploadPersonPhoto(file);
      setPhoto(result.photo_url);
      setPhotoPreview(result.photo_url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhoto('');
    setPhotoPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirm = () => {
    if (!firstName.trim() || !lastName.trim()) return;
    onConfirm({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      gender,
      dateOfBirth: dateOfBirth.trim() || undefined,
      dateOfDeath: dateOfDeath.trim() || undefined,
      notes: notes.trim() || undefined,
      photo: photo.trim() || undefined,
      relationshipType,
    });
    setFirstName('');
    setLastName('');
    setGender('male');
    setDateOfBirth('');
    setDateOfDeath('');
    setNotes('');
    setPhoto('');
    setPhotoPreview('');
    setUploadingPhoto(false);
    setRelationshipType('Biological');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-[#D6D0BE] bg-[#EDEAD8] p-0 sm:max-w-md">
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
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px] font-medium text-[#2D2926]">First Name</Label>
              <Input
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-10 rounded-lg border-[#D6D0BE] bg-[#F5F2E9] px-3 text-sm text-[#2D2926] outline-none placeholder:text-[#8C8782]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px] font-medium text-[#2D2926]">Last Name</Label>
              <Input
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-10 rounded-lg border-[#D6D0BE] bg-[#F5F2E9] px-3 text-sm text-[#2D2926] outline-none placeholder:text-[#8C8782]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-medium text-[#2D2926]">Gender</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`rounded-lg border p-2.5 text-center text-sm font-medium transition-colors ${
                  gender === 'male'
                    ? 'border-[#7D6B3D] bg-[#F5F2E9] text-[#2D2926]'
                    : 'border-[#D6D0BE] bg-[#F5F2E9] text-[#5E5954] hover:bg-white'
                }`}
              >
                Male
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`rounded-lg border p-2.5 text-center text-sm font-medium transition-colors ${
                  gender === 'female'
                    ? 'border-[#7D6B3D] bg-[#F5F2E9] text-[#2D2926]'
                    : 'border-[#D6D0BE] bg-[#F5F2E9] text-[#5E5954] hover:bg-white'
                }`}
              >
                Female
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-medium text-[#2D2926]">
              Date of Birth <span className="text-[#8C8782]">(optional)</span>
            </Label>
            <Input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="h-10 rounded-lg border-[#D6D0BE] bg-[#F5F2E9] px-3 text-sm text-[#2D2926] outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-medium text-[#2D2926]">
              Date of Death <span className="text-[#8C8782]">(optional)</span>
            </Label>
            <Input
              type="date"
              value={dateOfDeath}
              onChange={(e) => setDateOfDeath(e.target.value)}
              className="h-10 rounded-lg border-[#D6D0BE] bg-[#F5F2E9] px-3 text-sm text-[#2D2926] outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-medium text-[#2D2926]">
              Relationship Type <span className="text-[#8C8782]">(optional)</span>
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {relationshipTypes.map((rt) => (
                <button
                  key={rt}
                  type="button"
                  onClick={() => setRelationshipType(rt)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                    relationshipType === rt
                      ? 'border-[#7D6B3D] bg-[#F5F2E9] text-[#2D2926]'
                      : 'border-[#D6D0BE] bg-[#F5F2E9] text-[#5E5954] hover:bg-white'
                  }`}
                >
                  {rt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-medium text-[#2D2926]">
              Notes <span className="text-[#8C8782]">(optional)</span>
            </Label>
            <textarea
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="h-20 resize-none rounded-lg border border-[#D6D0BE] bg-[#F5F2E9] px-3 py-2 text-sm text-[#2D2926] outline-none placeholder:text-[#8C8782]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-medium text-[#2D2926]">
              Photo <span className="text-[#8C8782]">(optional)</span>
            </Label>
            <div className="flex items-center gap-3">
              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="size-12 rounded-full border border-[#D6D0BE] object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-[#2D2926] text-white"
                  >
                    <XIcon className="size-3" />
                  </button>
                </div>
              ) : (
                <div className="flex size-12 items-center justify-center rounded-full border border-dashed border-[#D6D0BE] bg-[#F5F2E9]">
                  <UploadIcon className="size-4 text-[#8C8782]" />
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                disabled={uploadingPhoto}
                onClick={() => fileInputRef.current?.click()}
                className="h-8 rounded-lg border-[#D6D0BE] bg-[#F5F2E9] px-3 text-xs font-medium text-[#2D2926] hover:bg-white"
              >
                {uploadingPhoto ? (
                  <Loader2 className="mr-1.5 size-3 animate-spin" />
                ) : (
                  <UploadIcon className="mr-1.5 size-3" />
                )}
                {photoPreview ? 'Change' : 'Upload'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
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
            disabled={!firstName.trim() || !lastName.trim()}
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
