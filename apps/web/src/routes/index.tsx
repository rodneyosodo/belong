import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { AppSidebar } from "@/components/app-sidebar"
import { NewTreeDialog } from "@/components/new-tree-dialog"
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
import { UsersIcon, GitBranchIcon, UserPlusIcon, SearchIcon, PlusIcon } from "lucide-react"

export const Route = createFileRoute("/")({
  component: HomePage,
})

const stats = [
  { value: "3", label: "Family Trees", icon: GitBranchIcon },
  { value: "48", label: "Total Members", icon: UsersIcon },
  { value: "2", label: "Collaborators", icon: UserPlusIcon },
]

const trees = [
  {
    name: "Anderson Family",
    description: "The Anderson lineage from Virginia, spanning four generations.",
    members: "24 members",
    updated: "Updated 2h ago",
    coverBg: "bg-[#E8E4D8]",
    iconColor: "text-[#7D6B3D]",
  },
  {
    name: "Smith Heritage",
    description: "Tracing the Smith family roots back to the 1800s.",
    members: "12 members",
    updated: "Updated 3d ago",
    coverBg: "bg-[#D6D0BE]",
    iconColor: "text-[#7D6B3D]",
  },
  {
    name: "Martinez Family",
    description: "The Martinez family tree, from Mexico to California.",
    members: "18 members",
    updated: "Updated 1w ago",
    coverBg: "bg-[#C4B896]",
    iconColor: "text-[#7D6B3D]",
    badge: "Shared",
  },
]

function HomePage() {
  const [newTreeOpen, setNewTreeOpen] = useState(false)

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
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto flex items-center gap-4 px-4">
            <div className="relative hidden items-center md:flex">
              <SearchIcon className="absolute left-3 size-4 text-[#8C8782]" />
              <input
                placeholder="Search trees..."
                className="h-9 rounded-lg border border-[#D6D0BE] bg-[#F5F2E9] pl-9 pr-4 text-sm text-[#2D2926] placeholder:text-[#8C8782] outline-none"
              />
            </div>
            <button
              onClick={() => setNewTreeOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-[#7D6B3D] px-4 py-2 text-sm font-medium text-[#F5F2E9] hover:bg-[#6A5A32]"
            >
              <PlusIcon className="size-4" />
              <span className="hidden sm:inline">New Tree</span>
            </button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="grid gap-4 md:grid-cols-3">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-[#D6D0BE] bg-[#E8E4D8] p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-3xl font-semibold text-[#2D2926]">
                        {stat.value}
                      </p>
                      <p className="mt-1 text-sm text-[#5E5954]">{stat.label}</p>
                    </div>
                    <Icon className="size-5 text-[#7D6B3D]/60" />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {trees.map((tree) => (
              <div
                key={tree.name}
                className="overflow-hidden rounded-2xl border border-[#D6D0BE] bg-white shadow-sm"
              >
                <div
                  className={`flex h-28 items-center justify-center ${tree.coverBg}`}
                >
                  <GitBranchIcon className={`size-10 ${tree.iconColor}`} />
                </div>
                <div className="space-y-3 p-4">
                  <h3 className="font-['Playfair_Display'] text-lg font-semibold text-[#2D2926]">
                    {tree.name}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#5E5954]">
                    {tree.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-[#8C8782]">
                      <UsersIcon className="size-3 text-[#7D6B3D]" />
                      <span>{tree.members}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {tree.badge && (
                        <span className="rounded-full bg-[#E8E4D8] px-2 py-0.5 text-[10px] font-medium text-[#7D6B3D]">
                          {tree.badge}
                        </span>
                      )}
                      <span className="text-xs text-[#8C8782]">{tree.updated}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SidebarInset>
      <NewTreeDialog open={newTreeOpen} onOpenChange={setNewTreeOpen} />
    </SidebarProvider>
  )
}
