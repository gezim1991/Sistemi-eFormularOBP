import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  FileText,
  FileDown,
  Maximize2,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  Send,
} from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { PdfPreview } from "@/components/PdfPreview";
import { FormularDocumentPreview } from "@/components/FormularDocumentPreview";
import { UploadBox } from "@/components/UploadBox";
import { useAuth } from "@/lib/auth-store";
import { useForms } from "@/lib/forms-store";
import { formsApi } from "@/lib/api/forms";
import { triggerDownload } from "@/lib/download";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function fmtDateTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("sq-AL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtSize(b?: number) {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

type FlyBox = { x: number; y: number; width: number; height: number };

const FLIGHT_MS = 3000;

function FormularFlyOverlay({ from, to }: { from: FlyBox; to?: FlyBox }) {
  const [phase, setPhase] = useState<"start" | "end">("start");

  useEffect(() => {
    const raf = requestAnimationFrame(() => setPhase("end"));
    return () => cancelAnimationFrame(raf);
  }, []);

  const size = 48;
  const fromCenter = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
  const toCenter = to
    ? { x: to.x + to.width / 2, y: to.y + to.height / 2 }
    : { x: 48, y: fromCenter.y };
  const dx = toCenter.x - fromCenter.x;
  const dy = toCenter.y - fromCenter.y;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute flex items-center justify-center rounded-full border border-warning/30 bg-warning text-warning-foreground shadow-lg"
        style={{
          width: size,
          height: size,
          left: fromCenter.x - size / 2,
          top: fromCenter.y - size / 2,
          transform:
            phase === "end" ? `translate(${dx}px, ${dy}px) scale(0.4)` : "translate(0, 0) scale(1)",
          opacity: phase === "end" ? 0 : 1,
          transition: `transform ${FLIGHT_MS}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${FLIGHT_MS * 0.35}ms ease-out ${FLIGHT_MS * 0.65}ms`,
        }}
      >
        <FileText className="h-5 w-5" />
      </div>
    </div>
  );
}

export function FormDetailsPage({ id }: { id: string }) {
  const { getById, setStatus, update } = useForms();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [previewPulse, setPreviewPulse] = useState(false);
  const [previewFullscreen, setPreviewFullscreen] = useState(false);
  const [fly, setFly] = useState<{ from: FlyBox; to?: FlyBox } | null>(null);

  const form = getById(id);
  const isOpb = user?.role === "opb";

  // Mark as viewed server-side when OPB opens the form
  useEffect(() => {
    if (!isOpb || !form) return;
    formsApi.markViewed(form.id).catch(() => null);
  }, [form?.id, isOpb]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!form) {
    return (
      <AppShell
        title="Aplikim i pagjetur"
        breadcrumbs={[
          { label: "Paneli", to: "/" },
          { label: "Formularët", to: "/forms" },
          { label: id },
        ]}
        actions={
          <Button asChild variant="outline">
            <Link to="/forms">
              <ArrowLeft className="mr-2 h-4 w-4" /> Kthehu te lista
            </Link>
          </Button>
        }
      >
        <div className="rounded-xl border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Aplikimi me ID <span className="font-mono">{id}</span> nuk u gjet.
          </p>
        </div>
      </AppShell>
    );
  }

  const timeline = [
    {
      label: "Formulari u krijua",
      at: form.createdAt,
      icon: FileText,
      done: true,
    },
    {
      label: "PDF u gjenerua",
      at: form.pdfGeneratedAt,
      icon: CheckCircle2,
      done: !!form.pdfGeneratedAt,
    },
    {
      label: "Dokumenti i firmosur u ngarkua",
      at: form.signedUploadedAt,
      icon: Upload,
      done: !!form.signedUploadedAt,
    },
    {
      label: form.status === "rejected" ? "Aplikimi u refuzua" : "Dërguar në OBP",
      at: ["submitted_to_opb", "verified", "rejected"].includes(form.status)
        ? form.submittedToOpbAt || form.updatedAt
        : undefined,
      icon: form.status === "rejected" ? XCircle : Send,
      done: ["submitted_to_opb", "verified", "rejected"].includes(form.status),
      danger: form.status === "rejected",
    },
  ];

  const onGenerate = async () => {
    if (!form) return;
    try {
      const updated = await formsApi.generatePdf(form.id);
      await setStatus(form.id, updated.status);
      setPreviewKey((k) => k + 1);
      setPreviewPulse(true);
      window.setTimeout(() => setPreviewPulse(false), 900);
      window.setTimeout(() => {
        document
          .getElementById("a4-preview-card")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
      toast.success("PDF u gjenerua — pamja paraprake u rifreskua.");
    } catch (err) {
      toast.error("Gabim gjatë gjenerimit të PDF.", {
        description: err instanceof Error ? err.message : "Provoni sërish.",
      });
    }
  };

  const onDownload = () => {
    if (!form) return;
    triggerDownload(formsApi.downloadPdfUrl(form.id), `${form.id}.pdf`);
  };

  const onUpload = async (file: File) => {
    if (!form) return;
    setUploading(true);
    try {
      const updated = await formsApi.uploadSigned(form.id, file);
      await setStatus(form.id, updated.status);
      setUploading(false);
      setUploadOpen(false);
      toast.success("Dokumenti i firmosur u ngarkua.");
    } catch (err) {
      setUploading(false);
      toast.error("Ngarkimi dështoi.", {
        description: err instanceof Error ? err.message : "Provoni sërish.",
      });
    }
  };

  const onVerify = (trigger?: HTMLElement) => {
    if (fly || !form) return;
    const target =
      typeof document !== "undefined"
        ? document.querySelector<HTMLElement>("[data-obp-target]")
        : null;
    const fromRect = trigger?.getBoundingClientRect();
    const toRect = target?.getBoundingClientRect();
    const from = fromRect
      ? { x: fromRect.x, y: fromRect.y, width: fromRect.width, height: fromRect.height }
      : { x: window.innerWidth - 80, y: window.innerHeight / 3, width: 48, height: 48 };
    setFly({
      from,
      to: toRect
        ? { x: toRect.x, y: toRect.y, width: toRect.width, height: toRect.height }
        : undefined,
    });
    window.setTimeout(async () => {
      try {
        const updated = await formsApi.submitToOpb(form.id);
        await setStatus(form.id, updated.status);
        toast.success("Formulari u dërgua në OPB.");
      } catch (err) {
        toast.error("Dërgimi dështoi.", {
          description: err instanceof Error ? err.message : "Provoni sërish.",
        });
      }
      window.setTimeout(() => setFly(null), 500);
    }, FLIGHT_MS);
  };

  const doc = form.document;
  const canDownload = Boolean(form.pdfGeneratedAt || doc);
  const titleName =
    doc?.titulliProjekti?.trim() ||
    form.emerFormulari ||
    `${form.emri} ${form.mbiemri}`.trim() ||
    form.id;
  const institucioni = doc?.emertimiInst?.trim() || form.institucioni;

  return (
    <AppShell
      title={titleName}
      description={`Aplikim zyrtar ${form.id} · ${institucioni}`}
      breadcrumbs={[
        { label: "Paneli", to: "/" },
        { label: "Formularët", to: "/forms" },
        { label: form.id },
      ]}
      actions={
        <>
          <Button variant="outline" onClick={() => navigate({ to: "/forms" })}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Kthehu te lista
          </Button>
          {!isOpb && (form.status === "draft" || form.status === "pdf_generated") && (
            <Button
              onClick={onGenerate}
              variant="outline"
              className="border-primary/20 text-primary hover:bg-primary/5"
            >
              <FileText className="mr-2 h-4 w-4" />
              {form.status === "draft" ? "Gjenero PDF" : "Rigjenero PDF"}
            </Button>
          )}
          {canDownload && (
            <Button
              variant="outline"
              onClick={onDownload}
              className="group/download transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:text-primary hover:shadow-sm"
            >
              <FileDown className="mr-2 h-4 w-4 transition-transform duration-200 group-hover/download:translate-y-0.5" />{" "}
              Shkarko PDF
            </Button>
          )}
          {!isOpb && (
            <>
              <Button
                onClick={() => setUploadOpen(true)}
                variant={form.status === "signed_uploaded" ? "outline" : "default"}
                className={
                  form.status === "signed_uploaded"
                    ? ""
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }
              >
                <Upload className="mr-2 h-4 w-4" /> Ngarko të firmosur
              </Button>
              {form.status === "signed_uploaded" && (
                <Button
                  onClick={(e) => onVerify(e.currentTarget)}
                  className="bg-warning text-warning-foreground shadow-[0_8px_24px_-12px_var(--warning)] hover:bg-warning/90"
                >
                  <Send className="mr-2 h-4 w-4" /> Dërgo në OBP
                </Button>
              )}
            </>
          )}
        </>
      }
    >
      {!isOpb && fly && <FormularFlyOverlay from={fly.from} to={fly.to} />}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Status card */}
          <div className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-[var(--shadow-card)] md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary/5 text-primary ring-1 ring-inset ring-primary/10">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="font-mono text-xs text-muted-foreground">{form.id}</p>
                <p className="font-medium">
                  {doc ? "Formular planifikimi prokurimi" : "Formular aplikimi zyrtar"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              {!isOpb && (
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Statusi
                  </p>
                  <div className="mt-1">
                    <StatusBadge status={form.status} />
                  </div>
                </div>
              )}
              {isOpb && (
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Qasja
                  </p>
                  <p className="mt-1 text-sm font-medium text-primary">Vetëm lexim</p>
                </div>
              )}
              <div className="hidden md:block">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Përditësuar
                </p>
                <p className="mt-1 text-sm font-medium">{fmtDateTime(form.updatedAt)}</p>
              </div>
            </div>
          </div>

          {!isOpb && form.status === "rejected" && form.rejectionReason && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
              <div className="flex items-start gap-3">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <div>
                  <p className="text-sm font-semibold text-destructive">Arsyeja e refuzimit</p>
                  <p className="mt-1 text-sm text-foreground">{form.rejectionReason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Data summary — matches what's actually in the document */}
          <div className="rounded-xl border bg-card shadow-[var(--shadow-card)]">
            <div className="border-b px-5 py-4">
              <h2 className="text-base font-semibold">Të dhënat e formularit</h2>
            </div>
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 px-5 py-5 sm:grid-cols-2">
              {doc ? (
                <>
                  <Detail label="Titulli i projektit" value={doc.titulliProjekti} />
                  <Detail label="Objekti i prokurimit" value={doc.objektiProkurimit} />
                  <Detail label="Institucioni" value={doc.emertimiInst} />
                  <Detail label="Kodi CPV" value={doc.kodiCPV} mono />
                  <Detail label="Personi i kontaktit" value={doc.kontaktEmer} />
                  <Detail label="E-mail" value={doc.kontaktEmail} />
                  <Detail label="Telefon" value={doc.kontaktTel} />
                  <Detail label="Adresa" value={doc.adresaFooter} />
                  <div className="sm:col-span-2">
                    <Detail
                      label="Panoramë e përgjithshme"
                      value={doc.panoramaObjektivat}
                      multiline
                    />
                  </div>
                </>
              ) : (
                <>
                  <Detail label="Emri" value={form.emri} />
                  <Detail label="Mbiemri" value={form.mbiemri} />
                  <Detail label="Atësia" value={form.atesia} />
                  <Detail label="NID" value={form.nid} mono />
                  <Detail label="Datëlindja" value={form.datelindja} />
                  <Detail label="Email" value={form.email} />
                  <Detail label="Telefon" value={form.telefon} />
                  <Detail label="Institucioni" value={form.institucioni} />
                  <div className="sm:col-span-2">
                    <Detail label="Adresa" value={form.adresa} />
                  </div>
                  <div className="sm:col-span-2">
                    <Detail label="Arsyeja e aplikimit" value={form.arsyeja} multiline />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* PDF preview */}
          <div
            id="a4-preview-card"
            className={cn(
              "rounded-xl border bg-card shadow-[var(--shadow-card)] transition-all duration-500",
              previewPulse && "ring-2 ring-primary/40 shadow-[0_0_0_6px_hsl(var(--primary)/0.08)]",
            )}
          >
            <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold">Pamja paraprake e PDF-së</h2>
                <p className="text-xs text-muted-foreground">
                  Fiks ajo që u gjenerua — formati zyrtar A4.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPreviewFullscreen(true)}
                  className="group/fullscreen transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:text-primary hover:shadow-sm"
                >
                  <Maximize2 className="mr-1.5 h-3.5 w-3.5 transition-transform duration-200 group-hover/fullscreen:scale-110" />
                  Full screen
                </Button>
                {canDownload && (
                  <Button size="sm" variant="outline" onClick={onDownload}>
                    <FileDown className="mr-1.5 h-3.5 w-3.5" /> Shkarko
                  </Button>
                )}
              </div>
            </div>
            <div className="overflow-x-auto bg-muted/30 p-6">
              <div key={previewKey} className="animate-in fade-in-0 zoom-in-[0.99] duration-500">
                {doc ? <FormularDocumentPreview document={doc} /> : <PdfPreview form={form} />}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar info */}
        <aside className="space-y-6">
          {!isOpb && (
            <div className="rounded-xl border bg-card p-5 shadow-[var(--shadow-card)]">
              <h3 className="text-sm font-semibold">Rrjedha</h3>
              <ol className="mt-4 space-y-4">
                {timeline.map((t, i) => (
                  <li key={i} className="relative flex gap-3 pl-1">
                    {i < timeline.length - 1 && (
                      <span
                        aria-hidden
                        className={cn(
                          "absolute left-[14px] top-7 h-full w-px",
                          t.done ? "bg-success/30" : "bg-border",
                        )}
                      />
                    )}
                    <div
                      className={cn(
                        "relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full ring-1 ring-inset",
                        t.done && !t.danger && "bg-success/10 text-success ring-success/20",
                        t.done &&
                          t.danger &&
                          "bg-destructive/10 text-destructive ring-destructive/20",
                        !t.done && "bg-muted text-muted-foreground ring-border",
                      )}
                    >
                      <t.icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className={cn("text-sm font-medium", !t.done && "text-muted-foreground")}>
                        {t.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t.at ? fmtDateTime(t.at) : "Në pritje"}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="rounded-xl border bg-card p-5 shadow-[var(--shadow-card)]">
            <h3 className="text-sm font-semibold">Detaje</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <Meta icon={Clock} label="Krijuar" value={fmtDateTime(form.createdAt)} />
              <Meta icon={Clock} label="Përditësuar" value={fmtDateTime(form.updatedAt)} />
              {form.signedFileName && (
                <>
                  <Meta icon={FileText} label="Dokumenti i firmosur" value={form.signedFileName} />
                  <Meta icon={FileText} label="Madhësia" value={fmtSize(form.signedFileSize)} />
                </>
              )}
            </dl>
          </div>

          {!isOpb && form.status === "signed_uploaded" && (
            <div className="rounded-xl border border-warning/30 bg-warning/5 p-5">
              <p className="text-sm font-medium text-warning">Gati për dërgim në OBP</p>
              <p className="mt-1 text-xs text-foreground/70">
                Dokumenti i firmosur është ngarkuar. Mund ta dërgosh në OBP për shqyrtim.
              </p>
              <Button
                onClick={(e) => onVerify(e.currentTarget)}
                size="sm"
                className="mt-3 bg-warning text-warning-foreground hover:bg-warning/90"
              >
                <Send className="mr-2 h-4 w-4" /> Dërgo në OBP
              </Button>
            </div>
          )}
        </aside>
      </div>

      {!isOpb && (
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Ngarko dokumentin e firmosur</DialogTitle>
              <DialogDescription>
                Pas firmosjes, ngarko PDF-në përfundimtare për verifikim.
              </DialogDescription>
            </DialogHeader>
            <UploadBox onUpload={onUpload} uploading={uploading} />
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={previewFullscreen} onOpenChange={setPreviewFullscreen}>
        <DialogContent className="flex h-[94vh] w-[96vw] max-w-none flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b bg-card px-5 py-4">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Maximize2 className="h-4 w-4 text-primary" />
              Pamja paraprake në full screen
            </DialogTitle>
            <DialogDescription>
              Shiko dokumentin në hapësirë të plotë pa humbur formatin zyrtar A4.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-muted/40 p-6">
            <div className="mx-auto animate-[field-slide-in_240ms_ease-out]">
              {doc ? <FormularDocumentPreview document={doc} /> : <PdfPreview form={form} />}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Detail({
  label,
  value,
  mono,
  multiline,
}: {
  label: string;
  value: string;
  mono?: boolean;
  multiline?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-sm",
          mono && "font-mono",
          multiline && "whitespace-pre-line leading-relaxed",
        )}
      >
        {value || <span className="text-muted-foreground">—</span>}
      </p>
    </div>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
        <dd className="truncate text-sm font-medium">{value}</dd>
      </div>
    </div>
  );
}
