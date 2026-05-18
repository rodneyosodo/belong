import { createFileRoute } from '@tanstack/react-router';
import { Link } from '@tanstack/react-router';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@workspace/ui/components/breadcrumb';
import { Separator } from '@workspace/ui/components/separator';
import { SidebarTrigger } from '@workspace/ui/components/sidebar';
import {
  SettingsIcon,
  DownloadIcon,
  Share2Icon,
  CodeIcon,
  FileImageIcon,
  FileTextIcon,
  FileDownIcon,
  PlusIcon,
  UploadIcon,
  ChevronDownIcon,
} from 'lucide-react';
import { useRef, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

import { FamilyTree, type FamilyTreeHandle } from '@/components/family-tree';
import { treeApi, type Tree } from '@/lib/api';

export const Route = createFileRoute('/_shell/tree/$id')({
  component: TreePage,
});

function TreePage() {
  const treeRef = useRef<FamilyTreeHandle>(null);
  const { id } = Route.useParams();
  const [tree, setTree] = useState<Tree | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (!exportOpen && !shareOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-dropdown]')) return;
      setExportOpen(false);
      setShareOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [exportOpen, shareOpen]);

  useEffect(() => {
    treeApi
      .get(id)
      .then(setTree)
      .catch(() => {});
  }, [id]);

  const handleExportPng = useCallback(async () => {
    setExportOpen(false);
    try {
      await treeRef.current?.exportPng();
      toast.success('PNG exported');
    } catch {
      toast.error('Failed to export PNG');
    }
  }, []);

  const handleExportPdf = useCallback(async () => {
    setExportOpen(false);
    try {
      await treeRef.current?.exportPdf();
      toast.success('PDF exported');
    } catch {
      toast.error('Failed to export PDF');
    }
  }, []);

  const handleExportGedcom = useCallback(() => {
    setExportOpen(false);
    treeRef.current?.exportTree();
  }, []);

  const handleShareLink = useCallback(async () => {
    setShareOpen(false);
    try {
      const url = await treeRef.current?.shareLink();
      toast.success('Link copied to clipboard', { description: url });
    } catch {
      toast.error('Failed to copy link');
    }
  }, []);

  const handleEmbedCode = useCallback(async () => {
    setShareOpen(false);
    const code = treeRef.current?.embedCode() ?? '';
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Embed code copied to clipboard');
    } catch {
      toast.error('Failed to copy embed code');
    }
  }, []);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/">Lineage</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{tree?.name ?? 'Tree'}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="ml-auto flex items-center gap-2 px-4">
          <button
            type="button"
            onClick={() => treeRef.current?.addMember()}
            className="flex items-center gap-1.5 rounded-lg border border-[#D6D0BE] bg-[#F5F2E9] px-3 py-1.5 text-xs font-medium text-[#2D2926] hover:bg-white"
          >
            <PlusIcon className="size-3.5" />
            Add Member
          </button>

          <div className="relative" data-dropdown>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExportOpen(!exportOpen);
                setShareOpen(false);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-[#D6D0BE] bg-[#F5F2E9] px-3 py-1.5 text-xs font-medium text-[#2D2926] hover:bg-white"
            >
              <DownloadIcon className="size-3.5" />
              Export
              <ChevronDownIcon className="size-3" />
            </button>
            {exportOpen && (
              <div className="absolute top-full right-0 z-50 mt-1 min-w-[180px] rounded-xl border border-[#D6D0BE] bg-[#F5F2E9] py-1 shadow-lg">
                <button
                  type="button"
                  onClick={handleExportPng}
                  className="flex w-full items-center gap-2.5 px-3 py-1.5 text-sm text-[#2D2926] hover:bg-[#E8E4D8]"
                >
                  <FileImageIcon className="size-4 text-[#7D6B3D]" />
                  Export as PNG
                </button>
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="flex w-full items-center gap-2.5 px-3 py-1.5 text-sm text-[#2D2926] hover:bg-[#E8E4D8]"
                >
                  <FileTextIcon className="size-4 text-[#7D6B3D]" />
                  Export as PDF
                </button>
                <div className="my-1 border-t border-[#D6D0BE]" />
                <button
                  type="button"
                  onClick={handleExportGedcom}
                  className="flex w-full items-center gap-2.5 px-3 py-1.5 text-sm text-[#2D2926] hover:bg-[#E8E4D8]"
                >
                  <FileDownIcon className="size-4 text-[#7D6B3D]" />
                  Export GEDCOM
                </button>
              </div>
            )}
          </div>

          <div className="relative" data-dropdown>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShareOpen(!shareOpen);
                setExportOpen(false);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-[#D6D0BE] bg-[#F5F2E9] px-3 py-1.5 text-xs font-medium text-[#2D2926] hover:bg-white"
            >
              <Share2Icon className="size-3.5" />
              Share
              <ChevronDownIcon className="size-3" />
            </button>
            {shareOpen && (
              <div className="absolute top-full right-0 z-50 mt-1 min-w-[200px] rounded-xl border border-[#D6D0BE] bg-[#F5F2E9] py-1 shadow-lg">
                <button
                  type="button"
                  onClick={handleShareLink}
                  className="flex w-full items-center gap-2.5 px-3 py-1.5 text-sm text-[#2D2926] hover:bg-[#E8E4D8]"
                >
                  <Share2Icon className="size-4 text-[#7D6B3D]" />
                  Copy share link
                </button>
                <button
                  type="button"
                  onClick={handleEmbedCode}
                  className="flex w-full items-center gap-2.5 px-3 py-1.5 text-sm text-[#2D2926] hover:bg-[#E8E4D8]"
                >
                  <CodeIcon className="size-4 text-[#7D6B3D]" />
                  Copy embed code
                </button>
              </div>
            )}
          </div>

          <Link
            to="/import"
            search={{ treeId: id }}
            className="flex items-center gap-1.5 rounded-lg border border-[#D6D0BE] bg-[#F5F2E9] px-3 py-1.5 text-xs font-medium text-[#2D2926] hover:bg-white"
          >
            <UploadIcon className="size-3.5" />
            Import
          </Link>
          <Link
            to="/tree/$id/settings"
            params={{ id }}
            className="rounded-lg border border-[#D6D0BE] bg-[#F5F2E9] p-1.5 text-[#2D2926] hover:bg-white"
          >
            <SettingsIcon className="size-4" />
          </Link>
        </div>
      </header>
      <div className="flex-1">
        <FamilyTree ref={treeRef} treeId={id} />
      </div>
    </>
  );
}
