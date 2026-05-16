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
import { PencilIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { PersonFormData } from './add-person-dialog';
import type { FamilyNodeData } from './family-tree-node';

interface EditPersonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personData: FamilyNodeData | null;
  onConfirm: (data: PersonFormData) => void;
}

const relationshipTypes = [
  'Biological',
  'Adopted',
  'Step',
  'Foster',
  'In-Law',
  'Godparent',
  'Other',
];

export function EditPersonDialog({
  open,
  onOpenChange,
  personData,
  onConfirm,
}: EditPersonDialogProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [dateOfDeath, setDateOfDeath] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState('');
  const [relationshipType, setRelationshipType] = useState('Biological');

  useEffect(() => {
    if (open && personData) {
      setFirstName(personData.firstName || '');
      setLastName(personData.lastName || '');
      setGender(personData.gender || 'male');
      setDateOfBirth(personData.dateOfBirth || '');
      setDateOfDeath(personData.dateOfDeath || '');
      setNotes(personData.notes || '');
      setPhoto(personData.photo || '');
      setRelationshipType(personData.relationshipType || 'Biological');
    }
  }, [open, personData]);

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
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl border-[#D6D0BE] bg-[#EDEAD8] p-0 sm:max-w-md">
        <DialogHeader className="flex flex-row items-center gap-3 border-b border-[#D6D0BE] p-5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#7D6B3D]">
            <PencilIcon className="size-4 text-[#F5F2E9]" />
          </div>
          <div>
            <DialogTitle className="font-['Playfair_Display'] text-lg font-semibold text-[#2D2926]">
              Edit Person
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5E5954]">
              Update this family member&apos;s details
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
              Photo URL <span className="text-[#8C8782]">(optional)</span>
            </Label>
            <Input
              placeholder="https://example.com/photo.jpg"
              value={photo}
              onChange={(e) => setPhoto(e.target.value)}
              className="h-10 rounded-lg border-[#D6D0BE] bg-[#F5F2E9] px-3 text-sm text-[#2D2926] outline-none placeholder:text-[#8C8782]"
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
            disabled={!firstName.trim() || !lastName.trim()}
            onClick={handleConfirm}
            className="h-9 rounded-lg bg-[#7D6B3D] px-4 text-sm font-semibold text-[#F5F2E9] hover:bg-[#6A5A32] disabled:opacity-50"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
