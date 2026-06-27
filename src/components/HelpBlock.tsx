import { useState } from "react";
import {
  BookOpen,
  Mail,
  Send,
  Loader2,
  FileText,
  Upload,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-store";

const SUPPORT_EMAIL = "obp@info.al";

const MANUAL_SECTIONS: {
  icon: typeof FileText;
  title: string;
  body: string;
}[] = [
  {
    icon: FileText,
    title: "1. Krijimi i një formulari të ri",
    body: "Shko te 'Krijo Formular të Ri', plotëso të dhënat e aplikuesit (emër, mbiemër, NID, institucioni) dhe ruaj si draft në çdo kohë.",
  },
  {
    icon: FileText,
    title: "2. Gjenerimi i PDF-së zyrtare",
    body: "Pasi formulari plotësohet, kliko 'Gjenero PDF'. Sistemi përgatit dokumentin zyrtar të gatshëm për nënshkrim.",
  },
  {
    icon: Upload,
    title: "3. Ngarkimi i dokumentit të firmosur",
    body: "Pas firmosjes, kthehu te formulari dhe ngarko skedarin e nënshkruar (PDF). Statusi kalon automatikisht në 'I dorëzuar'.",
  },
  {
    icon: ShieldCheck,
    title: "4. Verifikimi nga OPB",
    body: "Zyra e Pranimit të Formularëve (OPB) shqyrton aplikimin, verifikon nënshkrimin dhe e miraton ose e refuzon me arsye.",
  },
  {
    icon: CheckCircle2,
    title: "5. Ndjekja e statusit",
    body: "Çdo formular ka një status të dukshëm (Draft, PDF i gjeneruar, I dorëzuar, I verifikuar, I refuzuar). Filtra dhe kërkimi në listë e bëjnë navigimin të shpejtë.",
  },
];

export function HelpBlock({ collapsed = false }: { collapsed?: boolean }) {
  const { user } = useAuth();
  const [manualOpen, setManualOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error("Plotëso subjektin dhe mesazhin.");
      return;
    }
    setSubmitting(true);
    try {
      await new Promise((resolve, reject) =>
        setTimeout(() => {
          // Simulate occasional network failure so both success and error toasts are covered
          if (Math.random() < 0.15) {
            reject(new Error("Lidhja me serverin dështoi. Provoni përsëri."));
          } else {
            resolve(undefined);
          }
        }, 800),
      );
      setContactOpen(false);
      toast.success("Mesazhi u dërgua", {
        description: `Kërkesa juaj u dërgua te ${SUPPORT_EMAIL}. Do të kontaktoheni së shpejti.`,
      });
      setSubject("");
      setMessage("");
    } catch (err) {
      toast.error("Dërgimi dështoi", {
        description:
          err instanceof Error ? err.message : "Ndodhi një gabim. Provoni përsëri më vonë.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (collapsed) {
    return (
      <>
        <button
          type="button"
          onClick={() => setManualOpen(true)}
          aria-label="Hap manualin e përdorimit"
          className="mx-auto mb-3 grid h-9 w-9 place-items-center rounded-lg border border-sidebar-border bg-sidebar-accent/40 text-sidebar-accent-foreground transition-colors hover:bg-sidebar-accent"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
        <ManualDialog
          open={manualOpen}
          onOpenChange={setManualOpen}
          onContact={() => {
            setManualOpen(false);
            setContactOpen(true);
          }}
        />
        <ContactDialog
          open={contactOpen}
          onOpenChange={setContactOpen}
          subject={subject}
          setSubject={setSubject}
          message={message}
          setMessage={setMessage}
          submitting={submitting}
          onSubmit={sendMessage}
          userEmail={user?.email ?? ""}
        />
      </>
    );
  }

  return (
    <>
      <div className="m-3 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-4 animate-fade-in">
        <p className="text-xs font-semibold text-sidebar-accent-foreground">Nevojë për ndihmë?</p>
        <p className="mt-1 text-[11px] leading-relaxed text-sidebar-foreground/60">
          Konsulto{" "}
          <button
            type="button"
            onClick={() => setManualOpen(true)}
            className="font-medium text-sidebar-accent-foreground underline-offset-2 hover:underline focus:outline-none focus:underline"
          >
            manualin e përdorimit
          </button>{" "}
          ose kontakto{" "}
          <button
            type="button"
            onClick={() => setContactOpen(true)}
            className="font-medium text-sidebar-accent-foreground underline-offset-2 hover:underline focus:outline-none focus:underline"
          >
            mbështetjen institucionale
          </button>
          .
        </p>
      </div>

      <ManualDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        onContact={() => {
          setManualOpen(false);
          setContactOpen(true);
        }}
      />

      <ContactDialog
        open={contactOpen}
        onOpenChange={setContactOpen}
        subject={subject}
        setSubject={setSubject}
        message={message}
        setMessage={setMessage}
        submitting={submitting}
        onSubmit={sendMessage}
        userEmail={user?.email ?? ""}
      />
    </>
  );
}

function ManualDialog({
  open,
  onOpenChange,
  onContact,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onContact: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Manuali i përdorimit
          </DialogTitle>
          <DialogDescription>
            Udhëzues i shkurtër për përdorimin e platformës e-Formular OBP — nga krijimi i
            formularit deri te verifikimi nga OPB.
          </DialogDescription>
        </DialogHeader>

        <ol className="mt-4 space-y-3">
          {MANUAL_SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <li
                key={s.title}
                className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{s.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-4 flex flex-col gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Nuk gjete përgjigjen që kërkon? Na kontakto direkt.
          </p>
          <Button
            size="sm"
            onClick={onContact}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Mail className="mr-1.5 h-3.5 w-3.5" />
            Kontakto OPB
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ContactDialog({
  open,
  onOpenChange,
  subject,
  setSubject,
  message,
  setMessage,
  submitting,
  onSubmit,
  userEmail,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  subject: string;
  setSubject: (v: string) => void;
  message: string;
  setMessage: (v: string) => void;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  userEmail: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            Kontakto mbështetjen institucionale
          </DialogTitle>
          <DialogDescription>
            Mesazhi do të dërgohet te{" "}
            <span className="font-mono text-foreground">{SUPPORT_EMAIL}</span>. Përgjigja zakonisht
            vjen brenda 1–2 ditëve pune.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Nga
            </label>
            <input
              type="email"
              value={userEmail}
              readOnly
              className="mt-1.5 h-10 w-full cursor-not-allowed rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Subjekti
            </label>
            <input
              type="text"
              required
              maxLength={120}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="P.sh. Problem me ngarkimin e PDF-së"
              className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Mesazhi
            </label>
            <Textarea
              required
              maxLength={1500}
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Përshkruani me detaje pyetjen ose problemin..."
              className="mt-1.5 resize-none"
            />
            <p className="mt-1 text-right text-[10px] text-muted-foreground">
              {message.length}/1500
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-10 px-4"
            >
              Anulo
            </Button>
            <Button
              type="submit"
              disabled={submitting || !subject.trim() || !message.trim()}
              className="h-10 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Po dërgohet...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Dërgo mesazhin
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
