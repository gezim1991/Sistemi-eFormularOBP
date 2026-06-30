import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FileText,
  FilePlus2,
  ShieldCheck,
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
  PlayCircle,
  Tags,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-store";
import { useForms } from "@/lib/forms-store";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import type { FormStatus } from "@/lib/forms-types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  { to: "/admin/cpv-codes", label: "Kodet CPV", icon: Tags, exact: true },
  { to: "/admin/system", label: "Sistemi & Storage", icon: Activity, exact: true },
];

export function AppShell({
  children,
  title,
  description,
  breadcrumbs,
  actions,
  actionsPlacement = "side",
  collapsedNav = false,
}: {
  children: ReactNode;
  title: string;
  description?: string;
  breadcrumbs?: { label: string; to?: string }[];
  actions?: ReactNode;
  actionsPlacement?: "side" | "below";
  collapsedNav?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const locSearch = useRouterState({ select: (s) => s.location.search }) as { status?: string };
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { forms, unseenCount } = useForms();
  const [opbFreshCount, setOpbFreshCount] = useState(0);
  const [allFormsTooltipOpen, setAllFormsTooltipOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
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
                ? allFormsBadgeCount > 0
                  ? allFormsBadgeCount
                  : undefined
                : isObpPanel
                  ? opbFreshCount > 0
                    ? opbFreshCount
                    : undefined
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
                  data-nav-key={isAllForms ? "forms-all" : undefined}
                  onClick={() => {
                    if (isAllForms) {
                      setAllFormsTooltipOpen(false);
                      if (typeof window !== "undefined") {
                        window.sessionStorage.setItem("lov.forms.playIntro.v1", "1");
                        window.dispatchEvent(new Event("lov:forms-intro-requested"));
                      }
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
            <button
              type="button"
              onClick={() => setTutorialOpen(true)}
              className={cn(
                "group hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm sm:inline-flex",
                "transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/60 hover:bg-accent/10 hover:text-primary hover:shadow-[var(--shadow-card)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 active:translate-y-0 active:scale-[0.98]",
              )}
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground transition-transform duration-200 group-hover:scale-105">
                <PlayCircle className="h-4 w-4" />
              </span>
              Tutorial
            </button>
            <button
              type="button"
              onClick={() => setTutorialOpen(true)}
              className={cn(
                "group grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-muted-foreground shadow-sm sm:hidden",
                "transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-accent/60 hover:bg-accent/10 hover:text-primary",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 active:translate-y-0 active:scale-95",
              )}
              aria-label="Hap tutorialin"
            >
              <PlayCircle className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            </button>
            <NotificationsDropdown />
            <div className="flex items-center gap-2 border-l border-border pl-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "group flex items-center gap-3 rounded-full py-1 pl-3 pr-1 text-right",
                      "transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-primary/5 hover:shadow-sm",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 active:translate-y-0 active:scale-[0.99]",
                    )}
                  >
                    <span className="hidden min-w-0 sm:block">
                      <span className="block truncate text-sm font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
                        {user?.name ?? "—"}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {user?.role === "superadmin"
                          ? "Super Admin"
                          : user?.role === "opb"
                            ? (user.institucioni ?? "Operator OPB")
                            : "Aplikues"}
                      </span>
                    </span>
                    <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm transition-all duration-200 group-hover:scale-105 group-hover:shadow-[0_8px_22px_-14px_var(--color-primary)]">
                      <span className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />
                      <span className="relative">{user?.initials ?? "·"}</span>
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="w-64 overflow-hidden rounded-xl p-0 shadow-[var(--shadow-elevated)] animate-[scale-in_150ms_ease-out] origin-top-right"
                >
                  <DropdownMenuLabel className="bg-muted/30 px-4 py-3 font-normal">
                    <p className="text-sm font-semibold">{user?.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{user?.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className={cn(
                      "group/logout m-2 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-destructive",
                      "transition-all duration-200 ease-out hover:translate-x-0.5 focus:bg-destructive/8 focus:text-destructive",
                    )}
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-md bg-destructive/10 transition-all duration-200 group-hover/logout:bg-destructive group-hover/logout:text-destructive-foreground">
                      <LogOut className="h-4 w-4 transition-transform duration-200 group-hover/logout:translate-x-0.5" />
                    </span>
                    <span className="font-medium">Dil nga llogaria</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <Dialog open={tutorialOpen} onOpenChange={setTutorialOpen}>
          <DialogContent className="grid w-[min(96vw,calc((94dvh-76px)*16/9))] max-w-none grid-rows-[auto_auto] gap-0 overflow-hidden rounded-xl p-0">
            <DialogHeader className="border-b bg-card px-5 py-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
                  <PlayCircle className="h-5 w-5" />
                </span>
                <div>
                  <DialogTitle>Tutorial e-Formular OBP</DialogTitle>
                  <DialogDescription>
                    Shiko udhëzuesin shpjegues për përdorimin e sistemit.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="aspect-video overflow-hidden bg-primary">
              <iframe
                title="Tutorial e-Formular OBP"
                src="/tutorial-e-formular-obp.html"
                className="h-full w-full border-0 bg-primary"
                allow="autoplay; fullscreen; picture-in-picture"
              />
            </div>
          </DialogContent>
        </Dialog>

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
            <div
              className={cn(
                "flex flex-col gap-4",
                actionsPlacement === "side" && "sm:flex-row sm:items-end sm:justify-between",
              )}
            >
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
                {description && (
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
                )}
              </div>
              {actions && (
                <div
                  className={cn(
                    "flex flex-wrap gap-2",
                    actionsPlacement === "side" ? "sm:justify-end" : "justify-start",
                  )}
                >
                  {actions}
                </div>
              )}
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
