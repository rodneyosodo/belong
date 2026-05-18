import { RouterProvider, createRouter } from '@tanstack/react-router';
import { ThemeProvider } from '@workspace/ui/components/theme-provider';
import { TooltipProvider } from '@workspace/ui/components/tooltip';

import '@workspace/ui/globals.css';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

// Import the generated route tree
import { routeTree } from './routeTree.gen';

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <ThemeProvider>
        <TooltipProvider>
          <RouterProvider router={router} />
        </TooltipProvider>
      </ThemeProvider>
    </StrictMode>,
  );
}
