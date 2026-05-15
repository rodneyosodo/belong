import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Toaster } from "@workspace/ui/components/sonner";

import { authGuard } from "@/lib/auth-utils";

const RootLayout = () => (
  <>
    <Outlet />
    <Toaster />
    <TanStackRouterDevtools initialIsOpen={false} position="bottom-right" />
  </>
);

export const Route = createRootRoute({
  beforeLoad: authGuard,
  component: RootLayout,
});
