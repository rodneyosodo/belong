import { createRoute, Link } from '@tanstack/react-router';

import { rootRoute } from './__root';

function HomePage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-[#F5F2E9]">
      <h1 className="font-['Playfair_Display'] text-4xl font-semibold text-[#2D2926]">
        Welcome to Lineage
      </h1>
      <p className="max-w-md text-center text-base text-[#5E5954]">
        Map your family story. Build, visualize, and share your family tree.
      </p>
      <div className="flex gap-4">
        <Link
          to="/login"
          className="rounded-lg bg-[#7D6B3D] px-6 py-3 text-sm font-semibold text-[#F5F2E9] hover:bg-[#6A5A32]"
        >
          Sign In
        </Link>
        <Link
          to="/signup"
          className="rounded-lg border border-[#D6D0BE] bg-white px-6 py-3 text-sm font-semibold text-[#2D2926] hover:bg-[#EDEADE]"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});
