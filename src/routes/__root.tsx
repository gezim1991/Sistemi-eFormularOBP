import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";
import { FormsProvider } from "@/lib/forms-store";
import { AuthProvider, useAuth } from "@/lib/auth-store";
import { ManagedUsersProvider } from "@/lib/managed-users-store";
import { NotificationsProvider } from "@/lib/notifications-store";

const PUBLIC_ROUTES = new Set(["/login"]);

function RouteGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading) return;
    const isPublic = PUBLIC_ROUTES.has(pathname);
    if (!user && !isPublic) {
      router.navigate({ to: "/login", replace: true });
    } else if (user && isPublic) {
      const home = user.role === "opb" ? "/opb" : user.role === "superadmin" ? "/admin" : "/";
      router.navigate({ to: home, replace: true });
    } else if (user && user.role === "opb" && (pathname === "/" || pathname.startsWith("/forms"))) {
      // OPB operators see the OPB panel as their home
      if (pathname === "/") router.navigate({ to: "/opb", replace: true });
    } else if (user && user.role === "superadmin" && pathname === "/") {
      router.navigate({ to: "/admin", replace: true });
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Po ngarkohet...
      </div>
    );
  }
  if (!user && !PUBLIC_ROUTES.has(pathname)) return null;
  return <>{children}</>;
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Gabim 404</p>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight text-foreground">
          Faqja nuk u gjet
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Faqja që po kërkoni nuk ekziston ose është zhvendosur.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Kthehu te paneli
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Diçka shkoi keq</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Faqja nuk u ngarkua. Provoni ta rifreskoni ose kthehuni te paneli kryesor.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Provo përsëri
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/10"
          >
            Te paneli
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "e-Formular OBP · Formular Elektronik" },
      { name: "robots", content: "noindex,nofollow" },
      { name: "theme-color", content: "#07142d" },
      {
        name: "description",
        content:
          "Sistem zyrtar për plotësimin e formularit elektronik, gjenerimin e PDF-së dhe ngarkimin e dokumentit të firmosur.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:wght@400;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="sq">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FormsProvider>
          <NotificationsProvider>
            <ManagedUsersProvider>
              <RouteGuard>
                <Outlet />
              </RouteGuard>
              <Toaster position="top-right" />
            </ManagedUsersProvider>
          </NotificationsProvider>
        </FormsProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
