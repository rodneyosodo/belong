import { createFileRoute, Outlet } from '@tanstack/react-router';
import { SidebarInset, SidebarProvider } from '@workspace/ui/components/sidebar';

import { AppSidebar } from '@/components/app-sidebar';

export const Route = createFileRoute('/_shell')({
  component: ShellLayout,
});

function ShellLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
