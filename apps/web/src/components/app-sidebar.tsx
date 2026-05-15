import * as React from "react";
import { useNavigate } from "@tanstack/react-router";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@workspace/ui/components/sidebar";
import {
  GitBranchIcon,
  TreesIcon,
  Share2Icon,
  UploadIcon,
  Settings2Icon,
} from "lucide-react";

const data = {
  user: {
    name: "James Anderson",
    email: "james@lineage.app",
    avatar: "",
  },
  navMain: [
    {
      title: "My Trees",
      url: "/",
      icon: <TreesIcon />,
      isActive: true,
      items: [
        { title: "Anderson Family", url: "/tree/1", count: 24 },
        { title: "Smith Heritage", url: "/tree/2", count: 12 },
        { title: "Martinez Family", url: "/tree/3", count: 18 },
        { title: "Johnson Family", url: "/tree/4", count: 8 },
      ],
    },
    {
      title: "Shared with Me",
      url: "#",
      icon: <Share2Icon />,
      items: [
        { title: "Williams Lineage", url: "#", count: 15 },
        { title: "Brown Ancestry", url: "#", count: 7 },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const navigate = useNavigate();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <GitBranchIcon className="size-5" />
            </div>
            <div className="grid flex-1 text-start leading-tight">
              <span className="truncate text-lg font-semibold">Lineage</span>
            </div>
          </div>
        </SidebarGroup>
        <NavMain items={data.navMain} />
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => navigate({ to: "/import" })}>
                <UploadIcon />
                <span>Import GEDCOM</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Settings2Icon />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
