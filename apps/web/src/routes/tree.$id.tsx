import { createFileRoute, Link } from "@tanstack/react-router"
import { useRef, useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { FamilyTree, type FamilyTreeHandle } from "@/components/family-tree"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { Separator } from "@workspace/ui/components/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { SettingsIcon } from "lucide-react"
import { treeApi, type Tree } from "@/lib/api"

export const Route = createFileRoute("/tree/$id")({
  component: TreePage,
})

function TreePage() {
  const shareRef = useRef<FamilyTreeHandle>(null);
  const { id } = Route.useParams()
  const [tree, setTree] = useState<Tree | null>(null)

  useEffect(() => {
    treeApi.get(id).then(setTree).catch(() => {})
  }, [id])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/">
                    Lineage
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{tree?.name ?? "Tree"}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto flex items-center gap-2 px-4">
            <button
              onClick={() => shareRef.current?.addMember()}
              className="rounded-lg border border-[#D6D0BE] bg-[#F5F2E9] px-3 py-1.5 text-xs font-medium text-[#2D2926] hover:bg-white"
            >
              Add Member
            </button>
            <button
              onClick={() => shareRef.current?.exportTree()}
              className="rounded-lg border border-[#D6D0BE] bg-[#F5F2E9] px-3 py-1.5 text-xs font-medium text-[#2D2926] hover:bg-white"
            >
              Export
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
              }}
              className="rounded-lg border border-[#D6D0BE] bg-[#F5F2E9] px-3 py-1.5 text-xs font-medium text-[#2D2926] hover:bg-white"
            >
              Share
            </button>
            <Link
              to="/import"
              search={{ treeId: id }}
              className="rounded-lg border border-[#D6D0BE] bg-[#F5F2E9] px-3 py-1.5 text-xs font-medium text-[#2D2926] hover:bg-white"
            >
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
          <FamilyTree ref={shareRef} treeId={id} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
