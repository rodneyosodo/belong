import { useState, useEffect, useCallback } from "react"
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
import { UsersIcon, GitBranchIcon, UserPlusIcon, SearchIcon, PlusIcon, Trash2Icon, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { treeApi, type Tree } from "@/lib/api"

export const Route = createFileRoute("/")({
  component: HomePage,
})

function HomePage() {
  const [newTreeOpen, setNewTreeOpen] = useState(false)
  const [ownedTrees, setOwnedTrees] = useState<Tree[]>([])
  const [sharedTrees, setSharedTrees] = useState<Tree[]>([])
  const [loading, setLoading] = useState(true)

  const loadTrees = useCallback(async () => {
    try {
      const data = await treeApi.list()
      setOwnedTrees(data.owned)
      setSharedTrees(data.shared)
    } catch {
      toast.error("Failed to load trees")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTrees()
  }, [loadTrees])

  const handleDeleteTree = async (id: string) => {
    try {
      await treeApi.delete(id)
      setOwnedTrees((prev) => prev.filter((t) => t.id !== id))
      setSharedTrees((prev) => prev.filter((t) => t.id !== id))
      toast.success("Tree deleted")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete tree")
    }
  }

  const allTrees = [...ownedTrees, ...sharedTrees]
  const totalMembers = allTrees.reduce((sum, t) => sum + Number(t.member_count ?? 0), 0)

  const stats = [
    { value: String(allTrees.length), label: "Family Trees", icon: GitBranchIcon },
    { value: String(totalMembers), label: "Total Members", icon: UsersIcon },
    { value: String(sharedTrees.length), label: "Shared with Me", icon: UserPlusIcon },
  ]

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `Updated ${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `Updated ${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `Updated ${days}d ago`
    return `Updated ${Math.floor(days / 7)}w ago`
  }

  return (
    <SidebarProvider>
      <AppSidebar onTreesChanged={loadTrees} />
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
                        {loading ? "—" : stat.value}
                      </p>
                      <p className="mt-1 text-sm text-[#5E5954]">{stat.label}</p>
                    </div>
                    <Icon className="size-5 text-[#7D6B3D]/60" />
                  </div>
                </div>
              )
            })}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-8 animate-spin text-[#7D6B3D]" />
            </div>
          ) : allTrees.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-[#8C8782]">
              <GitBranchIcon className="size-12 text-[#D6D0BE]" />
              <p className="text-lg font-medium text-[#5E5954]">No family trees yet</p>
              <p className="text-sm">Create your first tree to get started</p>
              <button
                onClick={() => setNewTreeOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-[#7D6B3D] px-4 py-2 text-sm font-medium text-[#F5F2E9] hover:bg-[#6A5A32]"
              >
                <PlusIcon className="size-4" />
                New Tree
              </button>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              {ownedTrees.map((tree) => (
                <div
                  key={tree.id}
                  className="group relative overflow-hidden rounded-2xl border border-[#D6D0BE] bg-white shadow-sm"
                >
                  <a href={`/tree/${tree.id}`} className="block">
                    <div
                      className="flex h-28 items-center justify-center bg-[#E8E4D8]"
                      style={tree.cover_image ? { backgroundImage: `url(${tree.cover_image})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
                    >
                      {!tree.cover_image && <GitBranchIcon className="size-10 text-[#7D6B3D]" />}
                    </div>
                    <div className="space-y-3 p-4">
                      <h3 className="font-['Playfair_Display'] text-lg font-semibold text-[#2D2926]">
                        {tree.name}
                      </h3>
                      {tree.description && (
                        <p className="text-sm leading-relaxed text-[#5E5954] line-clamp-2">
                          {tree.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-[#8C8782]">
                          <UsersIcon className="size-3 text-[#7D6B3D]" />
                          <span>{tree.person_count ?? 0} members</span>
                        </div>
                        <span className="text-xs text-[#8C8782]">{timeAgo(tree.updated_at)}</span>
                      </div>
                    </div>
                  </a>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      if (confirm(`Delete "${tree.name}"? This cannot be undone.`)) {
                        handleDeleteTree(tree.id)
                      }
                    }}
                    className="absolute top-2 right-2 hidden items-center justify-center rounded-lg bg-white/80 p-1.5 text-[#8C8782] opacity-0 backdrop-blur-sm transition-opacity hover:text-red-500 group-hover:flex group-hover:opacity-100"
                  >
                    <Trash2Icon className="size-4" />
                  </button>
                </div>
              ))}
              {sharedTrees.map((tree) => (
                <div
                  key={tree.id}
                  className="overflow-hidden rounded-2xl border border-[#D6D0BE] bg-white shadow-sm"
                >
                  <a href={`/tree/${tree.id}`} className="block">
                    <div
                      className="flex h-28 items-center justify-center bg-[#C4B896]"
                      style={tree.cover_image ? { backgroundImage: `url(${tree.cover_image})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
                    >
                      {!tree.cover_image && <GitBranchIcon className="size-10 text-[#7D6B3D]" />}
                    </div>
                    <div className="space-y-3 p-4">
                      <h3 className="font-['Playfair_Display'] text-lg font-semibold text-[#2D2926]">
                        {tree.name}
                      </h3>
                      {tree.description && (
                        <p className="text-sm leading-relaxed text-[#5E5954] line-clamp-2">
                          {tree.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-[#8C8782]">
                          <UsersIcon className="size-3 text-[#7D6B3D]" />
                          <span>{tree.person_count ?? 0} members</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-[#E8E4D8] px-2 py-0.5 text-[10px] font-medium text-[#7D6B3D]">
                            Shared
                          </span>
                          <span className="text-xs text-[#8C8782]">{timeAgo(tree.updated_at)}</span>
                        </div>
                      </div>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </SidebarInset>
      <NewTreeDialog open={newTreeOpen} onOpenChange={setNewTreeOpen} onCreated={loadTrees} />
    </SidebarProvider>
  )
}
