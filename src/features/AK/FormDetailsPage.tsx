import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  FileText,
  FileDown,
  Maximize2,
  Paperclip,
  Pencil,
  Trash2,
  Upload,
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  XCircle,
  ShieldCheck,
  Send,
  Eye,
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
import { PuneDocumentPreview } from "@/components/PuneDocumentPreview";
import { DocumentPreview } from "@/components/DocumentPreview";
import { UploadBox } from "@/components/UploadBox";
import { useAuth } from "@/lib/auth-store";
import { useForms } from "@/lib/forms-store";
import { formsApi } from "@/lib/api/forms";
import { useFormPdfDownload } from "@/lib/use-form-pdf-download";
import type { FormDoc } from "@/lib/document-types";
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
  const { getById, setStatus } = useForms();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { download: downloadPdf, pdfState } = useFormPdfDownload();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [attachmentUpload, setAttachmentUpload] = useState<{
    name: string;
    progress: number;
    status: "uploading" | "done";
  } | null>(null);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<number | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [previewPulse, setPreviewPulse] = useState(false);
  const [previewFullscreen, setPreviewFullscreen] = useState(false);
  const [documentPreview, setDocumentPreview] = useState<FormDoc | null>(null);
  const [fly, setFly] = useState<{ from: FlyBox; to?: FlyBox } | null>(null);
  const [submittingToOpb, setSubmittingToOpb] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<{
    id: number;
    name: string;
    downloadUrl: string;
  } | null>(null);

  const cachedForm = getById(id);
  const [freshForm, setFreshForm] = useState<ReturnType<typeof getById>>(undefined);
  const form = freshForm ?? cachedForm;

  useEffect(() => {
    if (!attachmentUpload || attachmentUpload.status !== "uploading") return;

    const timer = window.setInterval(() => {
      setAttachmentUpload((current) => {
        if (!current || current.status !== "uploading") return current;
        const step = current.progress < 55 ? 9 : current.progress < 84 ? 4 : 1.4;
        return { ...current, progress: Math.min(96, current.progress + step) };
      });
    }, 240);

    return () => window.clearInterval(timer);
  }, [attachmentUpload?.status]);
  const isOpb = user?.role === "opb";

  // Always fetch fresh form data on mount so canUploadAttachment / attachments are up-to-date
  useEffect(() => {
    formsApi.get(id).then((data) => {
      setFreshForm(data);
      setStatus(id, data.status).catch(() => null);
    }).catch(() => null);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false;
    setDocumentPreview(null);
    formsApi.documentPreview(id)
      .then((doc) => {
        if (!cancelled) setDocumentPreview(doc);
      })
      .catch(() => {
        if (!cancelled) setDocumentPreview(null);
      });
    return () => {
      cancelled = true;
    };
  }, [id, previewKey]);

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
      setFreshForm(updated);
      await setStatus(form.id, updated.status);
      const preview = await formsApi.documentPreview(form.id).catch(() => null);
      if (preview) setDocumentPreview(preview);
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

  const onDownload = async () => {
    if (!form) return;
    try {
      await downloadPdf(form);
    } catch (err) {
      toast.error("Shkarkimi dështoi.", {
        description: err instanceof Error ? err.message : "Provoni sërish.",
      });
    }
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
    if (fly || submittingToOpb || !form) return;
    setSubmittingToOpb(true);
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
        setFreshForm(updated);
        await setStatus(form.id, updated.status);
        toast.success("Formulari u dërgua në OPB.");
      } catch (err) {
        setSubmittingToOpb(false);
        toast.error("Dërgimi dështoi.", {
          description: err instanceof Error ? err.message : "Provoni sërish.",
        });
      }
      window.setTimeout(() => setFly(null), 500);
    }, FLIGHT_MS);
  };

  const handleUploadAttachment = async (file: File) => {
    if (!form) return;
    setUploadingAttachment(true);
    setAttachmentUpload({ name: file.name, progress: 12, status: "uploading" });
    try {
      const updated = await formsApi.uploadAttachment(form.id, file);
      setFreshForm(updated);
      await setStatus(form.id, form.status);
      setAttachmentUpload({ name: file.name, progress: 100, status: "done" });
      toast.success(`"${file.name}" u ngarkua.`);
      window.setTimeout(() => {
        setAttachmentUpload((current) => (current?.name === file.name ? null : current));
      }, 1500);
    } catch (err) {
      setAttachmentUpload(null);
      toast.error("Ngarkimi dështoi.", { description: err instanceof Error ? err.message : "Provoni sërish." });
    } finally {
      setUploadingAttachment(false);
      if (attachmentInputRef.current) attachmentInputRef.current.value = "";
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!form) return;
    setDeletingAttachmentId(attachmentId);
    try {
      await formsApi.deleteAttachment(form.id, attachmentId);
      await setStatus(form.id, form.status);
      toast.success("Bashkëlidhësi u fshi.");
    } catch (err) {
      toast.error("Fshirja dështoi.", { description: err instanceof Error ? err.message : "Provoni sërish." });
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  const doc = form.document?.formType !== "pune" ? (form.document as import("@/lib/mock-data").FormularDocumentData | undefined) : undefined;
  const puneDoc = form.document?.formType === "pune" ? (form.document as import("@/lib/mock-data").PunePublikeDocumentData) : undefined;
  const canDownload = Boolean(form.pdfGeneratedAt || form.document);
  const titleName =
    doc?.titulliProjekti?.trim() ||
    puneDoc?.titulli?.trim() ||
    form.emerFormulari ||
    `${form.emri} ${form.mbiemri}`.trim() ||
    form.id;
  const institucioni = doc?.emertimiInst?.trim() || form.institucioni;
  const canUploadSignedAction =
    !isOpb && Boolean(form.canUploadSigned) && form.status === "pdf_generated";
  const canSubmitToOpbAction =
    !isOpb && form.status === "signed_uploaded" && !submittingToOpb && !fly;
  const renderPreview = () => {
    if (documentPreview) return <DocumentPreview doc={documentPreview} />;
    if (doc) return <FormularDocumentPreview document={doc} />;
    if (puneDoc) return <PuneDocumentPreview document={puneDoc} adresa={form.adresa || form.institucioni} />;
    return <PdfPreview form={form} />;
  };

  return (
    <AppShell
      title={titleName}
      actionsPlacement="below"
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
          {!isOpb && form.canEdit && (
            <Button
              asChild
              variant="outline"
              className="border-amber-300/60 text-amber-700 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800"
            >
              <Link to="/formulare/$id" params={{ id: form.id }}>
                <Pencil className="mr-2 h-4 w-4" /> Ndrysho formularin
              </Link>
            </Button>
          )}
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
              disabled={pdfState !== "idle"}
              className="group/download transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:text-primary hover:shadow-sm"
            >
              {pdfState === "downloading" ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Duke shkarkuar...
                </>
              ) : pdfState === "done" ? (
                <>
                  <FileDown className="mr-2 h-4 w-4" /> U shkarkua!
                </>
              ) : (
                <>
                  <FileDown className="mr-2 h-4 w-4 transition-transform duration-200 group-hover/download:translate-y-0.5" />
                  Shkarko PDF
                </>
              )}
            </Button>
          )}
          {canUploadSignedAction && (
            <Button
              onClick={() => setUploadOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Upload className="mr-2 h-4 w-4" /> Ngarko të firmosur
            </Button>
          )}
          {canSubmitToOpbAction && (
            <Button
              onClick={(e) => onVerify(e.currentTarget)}
              className="bg-warning text-warning-foreground shadow-[0_8px_24px_-12px_var(--warning)] hover:bg-warning/90"
            >
              <Send className="mr-2 h-4 w-4" /> Dërgo në OBP
            </Button>
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
                  {puneDoc ? "Formular punësh publike" : doc ? "Formular planifikimi prokurimi" : "Formular aplikimi zyrtar"}
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
                    <Detail label="Panoramë e përgjithshme" value={doc.panoramaObjektivat} multiline />
                  </div>
                </>
              ) : puneDoc ? (
                <>
                  <Detail label="Titulli i projektit" value={puneDoc.titulli} />
                  <Detail label="Objekti i prokurimit" value={puneDoc.objekti} />
                  <Detail label="Institucioni" value={form.institucioni} />
                  <div className="sm:col-span-2">
                    <Detail label="Identifikimi i nevojave" value={puneDoc.detaje} multiline />
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
                {!isOpb && form.canEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                    className="border-amber-300/60 text-amber-700 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800"
                  >
                    <Link to="/formulare/$id" params={{ id: form.id }}>
                      <Pencil className="mr-1.5 h-3.5 w-3.5" /> Ndrysho
                    </Link>
                  </Button>
                )}
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
                {renderPreview()}
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

          {/* Attachments card */}
          <div className="rounded-xl border bg-card shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Bashkëlidhës</h3>
                {form.attachments && form.attachments.length > 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {form.attachments.length}
                  </span>
                )}
              </div>
              {form.canUploadAttachment && (
                <>
                  <input
                    ref={attachmentInputRef}
                    type="file"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadAttachment(file);
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={uploadingAttachment}
                    onClick={() => attachmentInputRef.current?.click()}
                  >
                    {uploadingAttachment ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Ngarko
                  </Button>
                </>
              )}
            </div>
            <div className="divide-y px-4">
              {attachmentUpload && (
                <div className="py-3">
                  <div
                    className={cn(
                      "group/upload relative overflow-hidden rounded-xl border border-dashed p-3 transition-all duration-300 animate-in fade-in-0 slide-in-from-top-2",
                      attachmentUpload.status === "done"
                        ? "border-success/40 bg-success/5"
                        : "border-accent/70 bg-accent/5",
                    )}
                  >
                    <div className="pointer-events-none absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition-all duration-700 group-hover/upload:translate-x-[120%] group-hover/upload:opacity-100" />
                    <div className="relative flex items-center gap-3">
                      <div
                        className={cn(
                          "grid h-10 w-10 shrink-0 place-items-center rounded-md transition-all duration-300",
                          attachmentUpload.status === "done"
                            ? "bg-success text-success-foreground"
                            : "bg-primary text-primary-foreground",
                        )}
                      >
                        {attachmentUpload.status === "done" ? (
                          <CheckCircle2 className="h-5 w-5 animate-in zoom-in-50 duration-200" />
                        ) : (
                          <FileText className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-xs font-semibold">{attachmentUpload.name}</p>
                          <span
                            className={cn(
                              "shrink-0 text-[11px] font-semibold tabular-nums",
                              attachmentUpload.status === "done"
                                ? "text-success"
                                : "text-accent-foreground",
                            )}
                          >
                            {attachmentUpload.status === "done"
                              ? "U ngarkua"
                              : `${Math.round(attachmentUpload.progress)}%`}
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              "h-full rounded-full transition-[width] duration-300 ease-out",
                              attachmentUpload.status === "done" ? "bg-success" : "bg-accent",
                            )}
                            style={{ width: `${attachmentUpload.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {(!form.attachments || form.attachments.length === 0) && !attachmentUpload ? (
                <p className="py-5 text-center text-xs text-muted-foreground">
                  Nuk ka bashkëlidhës.
                </p>
              ) : (
                form.attachments?.map((att) => (
                  <div key={att.id} className="flex items-center gap-2 py-2.5">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{att.name}</p>
                      <p className="text-xs text-muted-foreground">{fmtSize(att.size)}</p>
                    </div>
                    <div className="flex shrink-0 gap-0.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="group/eye h-7 w-7 transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                        onClick={() => setPreviewAttachment(att)}
                        title="Shiko dokumentin"
                      >
                        <Eye className="h-3.5 w-3.5 transition-all duration-200 group-hover/eye:scale-110 group-hover/eye:drop-shadow-[0_0_4px_hsl(var(--primary)/0.6)]" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                        <a href={att.downloadUrl} download={att.name} target="_blank" rel="noreferrer">
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                      {form.canUploadAttachment && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive/70 hover:text-destructive"
                          disabled={deletingAttachmentId === att.id}
                          onClick={() => handleDeleteAttachment(att.id)}
                        >
                          {deletingAttachmentId === att.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

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

          {canSubmitToOpbAction && (
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

      <AttachmentViewerModal
        attachment={previewAttachment}
        onClose={() => setPreviewAttachment(null)}
      />

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
              {renderPreview()}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function getAttachmentType(name: string): "pdf" | "image" | "other" {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "image";
  return "other";
}

function AttachmentViewerModal({
  attachment,
  onClose,
}: {
  attachment: { id: number; name: string; downloadUrl: string } | null;
  onClose: () => void;
}) {
  const type = attachment ? getAttachmentType(attachment.name) : "other";
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  // Fetch as blob so session credentials are included (iframe can't do this)
  useEffect(() => {
    if (!attachment) {
      setBlobUrl(null);
      return;
    }
    if (type === "image") {
      // Images don't need blob — fetch with credentials still needed if protected
      let cancelled = false;
      setLoading(true);
      setFetchError(false);
      fetch(attachment.downloadUrl, { credentials: "include" })
        .then((r) => (r.ok ? r.blob() : Promise.reject(r.status)))
        .then((blob) => {
          if (!cancelled) setBlobUrl(URL.createObjectURL(blob));
        })
        .catch(() => { if (!cancelled) setFetchError(true); })
        .finally(() => { if (!cancelled) setLoading(false); });
      return () => { cancelled = true; };
    }
    if (type === "pdf") {
      let cancelled = false;
      let url: string | null = null;
      setLoading(true);
      setFetchError(false);
      setBlobUrl(null);
      fetch(attachment.downloadUrl, { credentials: "include" })
        .then((r) => (r.ok ? r.blob() : Promise.reject(r.status)))
        .then((blob) => {
          if (cancelled) return;
          url = URL.createObjectURL(blob);
          setBlobUrl(url);
        })
        .catch(() => { if (!cancelled) setFetchError(true); })
        .finally(() => { if (!cancelled) setLoading(false); });
      return () => {
        cancelled = true;
        if (url) URL.revokeObjectURL(url);
      };
    }
  }, [attachment?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup blob URL on close
  const handleClose = (open: boolean) => {
    if (!open) {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
      setLoading(false);
      setFetchError(false);
      onClose();
    }
  };

  return (
    <Dialog open={!!attachment} onOpenChange={handleClose}>
      <DialogContent className="flex h-[92vh] w-[92vw] max-w-5xl flex-col gap-0 overflow-hidden p-0 animate-in fade-in-0 zoom-in-[0.97] duration-200">
        <DialogHeader className="flex-row items-center gap-4 border-b bg-card px-5 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
              <Eye className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate text-sm font-semibold leading-tight">
                {attachment?.name}
              </DialogTitle>
              <DialogDescription className="text-[11px] leading-tight">
                Pamja paraprake e dokumentit
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="relative flex-1 overflow-hidden bg-muted/30">
          {/* Loading */}
          {loading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-150">
              <div className="relative">
                <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-muted border-t-primary" />
                <Eye className="absolute inset-0 m-auto h-4 w-4 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Duke ngarkuar dokumentin…</p>
            </div>
          )}

          {/* Error */}
          {fetchError && !loading && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
                <XCircle className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-medium">Dokumenti nuk u ngarkua</p>
                <p className="mt-1 text-xs text-muted-foreground">Provo ta shkarkosh drejtpërsëdrejti.</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <a href={attachment?.downloadUrl} download={attachment?.name}>
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Shkarko
                </a>
              </Button>
            </div>
          )}

          {/* PDF via blob URL */}
          {!loading && !fetchError && type === "pdf" && blobUrl && (
            <iframe
              key={blobUrl}
              src={blobUrl}
              className="h-full w-full border-0 animate-in fade-in-0 duration-300"
              title={attachment?.name}
            />
          )}

          {/* Image via blob URL */}
          {!loading && !fetchError && type === "image" && blobUrl && (
            <div className="flex h-full items-center justify-center p-8">
              <img
                src={blobUrl}
                alt={attachment?.name}
                className="max-h-full max-w-full rounded-md object-contain shadow-md ring-1 ring-border animate-in fade-in-0 zoom-in-95 duration-300"
              />
            </div>
          )}

          {/* Unsupported type */}
          {!loading && !fetchError && type === "other" && (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-muted ring-1 ring-border">
                <FileText className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Ky lloj skedari nuk mund të parapamjet</p>
                <p className="mt-1 text-xs text-muted-foreground">Shkarkoje për ta hapur me aplikacionin e duhur.</p>
              </div>
              <Button asChild variant="outline">
                <a href={attachment?.downloadUrl} download={attachment?.name}>
                  <Download className="mr-2 h-4 w-4" /> Shkarko skedarin
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Detail({
  label,
  value,
  mono,
  multiline,
}: {
  label: string;
  value: string | null | undefined;
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
