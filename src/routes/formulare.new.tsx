import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Hammer, PackageCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { FormularCreatePage } from "@/features/AK/FormularCreatePage";
import { PuneFormularCreatePage } from "@/features/AK/PuneFormularCreatePage";
import { AppShell } from "@/components/layout/AppShell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type FormularNewSearch = {
  lloji?: "mallra-sherbime" | "pune";
};

export const Route = createFileRoute("/formulare/new")({
  validateSearch: (s: Record<string, unknown>): FormularNewSearch => {
    const raw = typeof s.lloji === "string" ? s.lloji : undefined;
    return raw === "mallra-sherbime" || raw === "pune" ? { lloji: raw } : {};
  },
  head: () => ({
    meta: [
      { title: "e-Formular OBP · Krijo formular planifikimi" },
      { name: "description", content: "Formulari elektronik për planifikimin e prokurimit." },
    ],
  }),
  component: FormularNewRoute,
});

function FormularNewRoute() {
  const search = Route.useSearch();

  if (search.lloji === "mallra-sherbime") {
    return <FormularCreatePage />;
  }

  if (search.lloji === "pune") {
    return <PuneFormularCreatePage />;
  }

  return <FormularTypeSelectionPage />;
}

function FormularTypeSelectionPage() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<FormularNewSearch["lloji"]>();

  const selectType = (lloji: NonNullable<FormularNewSearch["lloji"]>) => {
    if (selectedType) return;
    setSelectedType(lloji);
    window.setTimeout(() => {
      navigate({ to: "/formulare/new", search: { lloji } });
    }, 560);
  };

  return (
    <AppShell
      title="Krijo formular"
      description="Zgjidh llojin e formularit përpara se të nisësh plotësimin."
      breadcrumbs={[{ label: "Paneli", to: "/" }, { label: "Krijo formular" }]}
    >
      <Dialog
        defaultOpen
        onOpenChange={(open) => {
          if (!open && !selectedType) navigate({ to: "/forms" });
        }}
      >
        <DialogContent className="overflow-hidden rounded-2xl p-0 sm:max-w-2xl">
          <DialogHeader className="border-b bg-card px-6 py-5">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <DialogTitle>Zgjidh tipin e formularit</DialogTitle>
                <DialogDescription className="mt-1">
                  Formulari hapet vetëm pasi të zgjedhësh kategorinë që do të plotësosh.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid gap-3 bg-background p-4 sm:grid-cols-2 sm:p-6">
            <TypeChoiceButton
              icon={PackageCheck}
              title="Mallra / Shërbime"
              description="Hap formularin aktual të planifikimit për mallra dhe shërbime."
              badge="Aktiv"
              selected={selectedType === "mallra-sherbime"}
              onClick={() => selectType("mallra-sherbime")}
            />
            <TypeChoiceButton
              icon={Hammer}
              title="Punë"
              description="Hap formularin e punimeve publike me tabelë të editueshme."
              badge="I ri"
              selected={selectedType === "pune"}
              onClick={() => selectType("pune")}
              muted
            />
          </div>

          {selectedType && (
            <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-background/70 backdrop-blur-[2px]">
              <div className="formular-launch-doc relative h-72 w-52 rounded-md border bg-card shadow-[0_30px_80px_-28px_rgba(0,0,0,0.45)]">
                <span className="absolute left-5 top-5 h-3 w-24 rounded-full bg-primary" />
                <span className="absolute left-5 top-12 h-2 w-36 rounded-full bg-muted" />
                <span className="absolute left-5 top-20 h-2 w-32 rounded-full bg-muted" />
                <span className="absolute left-5 top-32 h-20 w-[calc(100%-40px)] rounded-md border bg-background" />
                <span className="absolute bottom-5 left-5 h-2 w-20 rounded-full bg-accent" />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function TypeChoiceButton({
  icon: Icon,
  title,
  description,
  badge,
  muted = false,
  selected = false,
  onClick,
}: {
  icon: typeof PackageCheck;
  title: string;
  description: string;
  badge: string;
  muted?: boolean;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={selected}
      className={cn(
        "group relative min-h-44 cursor-pointer overflow-hidden rounded-xl border bg-card p-5 text-left shadow-[var(--shadow-card)]",
        "transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 active:translate-y-0 active:scale-[0.99]",
        "disabled:pointer-events-none",
        selected && "scale-[0.99] border-accent/70 bg-accent/5",
        muted ? "hover:border-muted-foreground/30" : "hover:border-accent/60 hover:bg-accent/5",
      )}
    >
      <span className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <span
        className={cn(
          "grid h-12 w-12 place-items-center rounded-xl ring-1 ring-inset transition-all duration-300",
          muted
            ? "bg-muted text-muted-foreground ring-border group-hover:scale-105"
            : "bg-accent/15 text-[oklch(0.42_0.12_60)] ring-accent/30 group-hover:scale-105 group-hover:bg-accent/20",
        )}
      >
        <Icon className="h-5 w-5 transition-transform duration-300 group-hover:rotate-[-4deg] group-hover:scale-110" />
      </span>
      <div className="mt-5 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold",
            muted ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground",
          )}
        >
          {badge}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
        Vazhdo
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </span>
    </button>
  );
}
