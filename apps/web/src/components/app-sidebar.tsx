import { useNavigate } from '@tanstack/react-router';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@workspace/ui/components/sidebar';
import { GitBranchIcon, TreesIcon, Share2Icon, UploadIcon, UserRoundIcon } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { treeApi, type Tree } from '@/lib/api';
import { authClient } from '@/lib/auth-client';

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onTreesChanged?: () => void;
}

export function AppSidebar({ onTreesChanged: _onTreesChanged, ...props }: AppSidebarProps) {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const [ownedTrees, setOwnedTrees] = useState<Tree[]>([]);
  const [sharedTrees, setSharedTrees] = useState<Tree[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadTrees = React.useCallback(async () => {
    try {
      const data = await treeApi.list();
      setOwnedTrees(data.owned);
      setSharedTrees(data.shared);
    } catch {}
    setLoaded(true);
  }, []);

  React.useEffect(() => {
    if (session?.user) loadTrees();
  }, [session?.user, loadTrees]);

  React.useEffect(() => {
    const handler = () => loadTrees();
    window.addEventListener('trees-changed', handler);
    return () => window.removeEventListener('trees-changed', handler);
  }, [loadTrees]);

  const navMain = [
    {
      title: 'My Trees',
      url: '/',
      icon: <TreesIcon />,
      isActive: true,
      items: ownedTrees.map((t) => ({
        title: t.name,
        url: `/tree/${t.id}`,
        count: Number(t.person_count ?? 0),
      })),
    },
    {
      title: 'Shared with Me',
      url: '#',
      icon: <Share2Icon />,
      items: sharedTrees.map((t) => ({
        title: t.name,
        url: `/tree/${t.id}`,
        count: Number(t.person_count ?? 0),
      })),
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" onClick={() => navigate({ to: '/' })} tooltip="Lineage">
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <GitBranchIcon className="size-4" />
              </div>
              <div className="grid flex-1 text-start leading-tight">
                <span className="truncate text-lg font-semibold">Lineage</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {loaded && <NavMain items={navMain} />}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate({ to: '/import', search: { treeId: '' } })}
              >
                <UploadIcon />
                <span>Import GEDCOM</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => navigate({ to: '/profile' })}>
                <UserRoundIcon />
                <span>Profile</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user?.name ?? 'User',
            email: user?.email ?? '',
            avatar: user?.image ?? '',
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
