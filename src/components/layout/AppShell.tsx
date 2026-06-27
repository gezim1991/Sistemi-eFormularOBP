import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FileText,
  FilePlus2,
  ShieldCheck,
  Bell,
  Search,
  ChevronRight,
  Inbox,
  LogOut,
  FileEdit,
  FileCheck2,
  FileSignature,
  Send,
  Building2,
  ShieldAlert,
  UserPlus,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-store";
import { useForms } from "@/lib/forms-store";
import type { FormStatus } from "@/lib/forms-types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpBlock } from "@/components/HelpBlock";
import { getOpbFreshCount } from "@/features/OBP/opbActivity";

type NavItem = {
  to: string;
  label: string;
  icon: typeof FileText;
  exact?: boolean;
  search?: { status?: FormStatus };
};

const baseNavAplikues: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/forms", label: "Të gjithë formularët", icon: FileText, exact: true },
  { to: "/forms", label: "Draft", icon: FileEdit, search: { status: "draft" } },
  { to: "/forms", label: "Të gjeneruar", icon: FileCheck2, search: { status: "pdf_generated" } },
  {
    to: "/forms",
    label: "Të firmosura",
    icon: FileSignature,
    search: { status: "signed_uploaded" },
  },
  { to: "/forms", label: "Të dërguar në OBP", icon: Send, search: { status: "submitted_to_opb" } },
  { to: "/formulare/new", label: "Krijo formular", icon: FilePlus2 },
];

const baseNavOpb: NavItem[] = [
  { to: "/opb", label: "Paneli OPB", icon: Inbox, exact: true },
  { to: "/forms", label: "Të gjithë formularët", icon: FileText, exact: true },
  { to: "/autoritetet", label: "Autoritetet", icon: Building2, exact: true },
];

const baseNavAdmin: NavItem[] = [
  { to: "/admin", label: "Paneli Admin", icon: ShieldAlert, exact: true },
  { to: "/admin/users", label: "Përdoruesit", icon: UserPlus, exact: true },
  { to: "/admin/institutions", label: "Institucione", icon: Building2, exact: true },
  { to: "/admin/system", label: "Sistemi & Storage", icon: Activity, exact: true },
];

export function AppShell({
  children,
  title,
  description,
  breadcrumbs,
  actions,
  collapsedNav = false,
}: {
  children: ReactNode;
  title: string;
  description?: string;
  breadcrumbs?: { label: string; to?: string }[];
  actions?: ReactNode;
  collapsedNav?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const locSearch = useRouterState({ select: (s) => s.location.search }) as { status?: string };
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { forms, unseenCount } = useForms();
  const [opbFreshCount, setOpbFreshCount] = useState(0);
  const [allFormsTooltipOpen, setAllFormsTooltipOpen] = useState(false);
  const nav: NavItem[] =
    user?.role === "superadmin"
      ? baseNavAdmin
      : user?.role === "opb"
        ? baseNavOpb
        : baseNavAplikues;

  useEffect(() => {
    if (user?.role !== "opb") {
      setOpbFreshCount(0);
      return;
    }

    const syncFreshCount = () => setOpbFreshCount(getOpbFreshCount(forms));
    syncFreshCount();
  }, [forms, user?.role]);

  useEffect(() => {
    const freshCount = user?.role === "opb" ? opbFreshCount : unseenCount;
    if (freshCount > 0 && pathname !== "/forms") {
      setAllFormsTooltipOpen(true);
    } else {
      setAllFormsTooltipOpen(false);
    }
  }, [opbFreshCount, pathname, unseenCount, user?.role]);

  const countFor = (status?: FormStatus) =>
    status ? forms.filter((f) => f.status === status).length : forms.length;

  function handleLogout() {
    logout();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <TooltipProvider delayDuration={200}>
        <aside
          className={cn(
            "sticky top-0 hidden h-screen shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-out lg:flex",
            collapsedNav ? "w-16" : "w-64",
          )}
        >
          <div
            className={cn(
              "flex h-16 items-center gap-3 border-b border-sidebar-border",
              collapsedNav ? "justify-center px-2" : "px-6",
            )}
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            {!collapsedNav && (
              <div className="min-w-0 animate-fade-in">
                <p className="truncate text-sm font-semibold tracking-tight">e-Formular OBP</p>
                <p className="truncate text-[11px] text-sidebar-foreground/60">Platforma Zyrtare</p>
              </div>
            )}
          </div>

          <nav className={cn("flex-1 space-y-1 py-6", collapsedNav ? "px-2" : "px-3")}>
            {!collapsedNav && (
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/40">
                Menaxhim
              </p>
            )}
            {nav.map((item, i) => {
              const itemStatus = item.search?.status;
              const onForms = pathname === "/forms" || pathname.startsWith("/forms/");
              let active = false;
              if (item.search) {
                active = onForms && locSearch?.status === itemStatus;
              } else if (item.exact) {
                if (item.to === "/forms") {
                  active = onForms && !locSearch?.status;
                } else {
                  active = pathname === item.to;
                }
              } else {
                active = pathname === item.to || pathname.startsWith(item.to + "/");
              }
              const isAllForms = item.to === "/forms" && item.exact && !item.search;
              const isObpPanel = item.to === "/opb" && item.exact && user?.role === "opb";
              const allFormsBadgeCount = user?.role === "opb" ? opbFreshCount : unseenCount;
              const badge = isAllForms
                ? allFormsBadgeCount > 0 ? allFormsBadgeCount : undefined
                : isObpPanel
                  ? opbFreshCount > 0 ? opbFreshCount : undefined
                  : item.to === "/forms" && (item.exact || item.search)
                    ? countFor(itemStatus)
                    : undefined;
              const showTooltip = isAllForms && allFormsBadgeCount > 0 && !collapsedNav;
              const link = (
                <Link
                  key={`${item.to}-${item.label}-${i}`}
                  to={item.to}
                  search={item.search ? item.search : undefined}
                  title={collapsedNav ? item.label : undefined}
                  data-obp-target={itemStatus === "submitted_to_opb" ? "" : undefined}
                  data-nav-key={isAllForms ? "forms-all" : isObpPanel ? "opb-panel" : undefined}
                  onClick={() => {
                    if (isAllForms) {
                      setAllFormsTooltipOpen(false);
                      if (typeof window !== "undefined") {
                        window.sessionStorage.setItem("lov.forms.playIntro.v1", "1");
                        window.dispatchEvent(new Event("lov:forms-intro-requested"));
                      }
                    } else if (isObpPanel && typeof window !== "undefined") {
                      window.dispatchEvent(new Event("lov:opb-panel-requested"));
                    }
                  }}
                  className={cn(
                    "group relative flex items-center rounded-md text-sm font-medium transition-all duration-200 ease-out",
                    collapsedNav ? "h-10 w-full justify-center" : "gap-3 px-3 py-2",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "text-sidebar-foreground/70 hover:translate-x-0.5 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  )}
                >
                  {active && (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-gold shadow-[0_0_10px_var(--color-gold)]"
                    />
                  )}
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform duration-200",
                      active
                        ? "text-gold scale-110"
                        : "text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground",
                    )}
                  />
                  {!collapsedNav && (
                    <>
                      <span className="truncate">{item.label}</span>
                      {badge !== undefined && (
                        <span
                          className={cn(
                            "ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-md px-1.5 text-[11px] font-semibold tabular-nums",
                            active
                              ? "bg-sidebar/60 text-sidebar-foreground"
                              : "bg-sidebar-accent/60 text-sidebar-foreground/80",
                          )}
                        >
                          {badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              );
              return showTooltip ? (
                <Tooltip
                  key={`tooltip-${item.to}-${i}`}
                  open={allFormsTooltipOpen}
                  onOpenChange={setAllFormsTooltipOpen}
                >
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    <p>
                      Ke {allFormsBadgeCount} formular
                      {allFormsBadgeCount === 1 ? " të ri" : "ë të rinj"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                link
              );
            })}
          </nav>

          {!collapsedNav && <HelpBlock />}
        </aside>
      </TooltipProvider>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/85 px-4 backdrop-blur sm:px-8">
          <div className="hidden flex-1 md:block">
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Kërko formularë, NID, aplikues..."
                className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring/40"
              />
            </div>
          </div>
          <div className="flex flex-1 items-center justify-end gap-3 md:flex-none">
            <button className="relative grid h-9 w-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent" />
            </button>
            <div className="flex items-center gap-3 border-l border-border pl-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium leading-tight">{user?.name ?? "—"}</p>
                <p className="text-[11px] text-muted-foreground">
                  {user?.role === "superadmin"
                    ? "Super Admin"
                    : user?.role === "opb"
                      ? (user.institucioni ?? "Operator OPB")
                      : "Aplikues"}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                    {user?.initials ?? "·"}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Dil nga llogaria
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="border-b border-border bg-card/50">
          <div className="px-4 py-6 sm:px-8 sm:py-8">
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
                {breadcrumbs.map((b, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {b.to ? (
                      <Link to={b.to} className="hover:text-foreground">
                        {b.label}
                      </Link>
                    ) : (
                      <span className="text-foreground">{b.label}</span>
                    )}
                    {i < breadcrumbs.length - 1 && <ChevronRight className="h-3 w-3" />}
                  </span>
                ))}
              </nav>
            )}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
                {description && (
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
                )}
              </div>
              {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
            </div>
          </div>
        </div>

        <main className="flex-1 px-4 py-8 sm:px-8">{children}</main>

        <footer className="border-t border-border px-4 py-5 text-xs text-muted-foreground sm:px-8">
          © 2026 e-Formular OBP · Sistem Zyrtar i Formularëve OBP
        </footer>
      </div>
    </div>
  );
}
