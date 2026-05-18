import {
  UserPlusIcon,
  HeartIcon,
  BabyIcon,
  ArrowUpIcon,
  Trash2Icon,
  PencilIcon,
  EyeIcon,
  UsersIcon,
  HomeIcon,
  SplitIcon,
} from 'lucide-react';
import { useEffect, useRef } from 'react';

export type ContextMenuAction =
  | 'spouse'
  | 'child'
  | 'parent'
  | 'sibling'
  | 'half-sibling'
  | 'adopted'
  | 'adopted-parent'
  | 'step-child'
  | 'step-parent'
  | 'edit'
  | 'view'
  | 'delete'
  | 'add';

interface NodeContextMenuProps {
  x: number;
  y: number;
  label: string;
  onAction: (action: ContextMenuAction) => void;
  onClose: () => void;
}

const actions: {
  action: ContextMenuAction;
  label: string;
  icon: typeof UserPlusIcon;
}[] = [
  { action: 'view', label: 'View Person', icon: EyeIcon },
  { action: 'edit', label: 'Edit Person', icon: PencilIcon },
  { action: 'spouse', label: 'Add Spouse', icon: HeartIcon },
  { action: 'child', label: 'Add Child', icon: BabyIcon },
  { action: 'parent', label: 'Add Parent', icon: ArrowUpIcon },
  { action: 'sibling', label: 'Add Sibling', icon: UserPlusIcon },
  { action: 'half-sibling', label: 'Add Half-Sibling', icon: SplitIcon },
  { action: 'adopted', label: 'Add Adopted Child', icon: UsersIcon },
  { action: 'adopted-parent', label: 'Add Adopted Parent', icon: UsersIcon },
  { action: 'step-child', label: 'Add Step-Child', icon: HomeIcon },
  { action: 'step-parent', label: 'Add Step-Parent', icon: HomeIcon },
];

export function NodeContextMenu({ x, y, label, onAction, onClose }: NodeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      style={{ left: x, top: y }}
      className="absolute z-50 min-w-[180px] rounded-xl border border-[#D6D0BE] bg-[#F5F2E9] py-1.5 shadow-lg"
    >
      <div className="border-b border-[#D6D0BE] px-3 py-1.5">
        <p className="truncate text-xs font-medium text-[#5E5954]">{label}</p>
      </div>
      <div className="py-1">
        {actions.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.action}
              onClick={() => {
                onAction(item.action);
                onClose();
              }}
              className="flex w-full items-center gap-2.5 px-3 py-1.5 text-sm text-[#2D2926] hover:bg-[#E8E4D8]"
            >
              <Icon className="size-4 text-[#7D6B3D]" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
      <div className="border-t border-[#D6D0BE] py-1">
        <button
          onClick={() => {
            onAction('delete');
            onClose();
          }}
          className="flex w-full items-center gap-2.5 px-3 py-1.5 text-sm text-red-700 hover:bg-[#E8E4D8]"
        >
          <Trash2Icon className="size-4 text-red-500" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
}
