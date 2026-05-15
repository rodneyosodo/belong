import { createFileRoute } from "@tanstack/react-router"
import { useRef } from "react"
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

export const Route = createFileRoute("/tree/$id")({
  component: TreePage,
})

function TreePage() {
  const shareRef = useRef<FamilyTreeHandle>(null);

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
                  <BreadcrumbPage>Tree</BreadcrumbPage>
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
          </div>
        </header>
        <div className="flex-1">
          <FamilyTree ref={shareRef} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
