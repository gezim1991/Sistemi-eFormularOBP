import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShieldCheck, Lock, Mail, Loader2, ArrowRight, KeyRound, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth-store";

const TEST_ACCOUNTS = [
  { role: "aplikues" as const, email: "ak@eformular.gov.al", password: "Ak2026!" },
  { role: "opb" as const, email: "opb@eformular.gov.al", password: "Opb2026!" },
];
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "e-Formular OBP · Hyr" },
      { name: "description", content: "Hyr në platformën zyrtare e-Formular OBP." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      navigate({ to: user.role === "opb" ? "/opb" : "/", replace: true });
    }
  }, [user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const u = await login(email.trim(), password);
      setSuccess(true);
      toast.success(`Mirë se erdhe, ${u.name}`);
      navigate({ to: u.role === "opb" ? "/opb" : "/", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gabim gjatë hyrjes.");
      setSuccess(false);
    } finally {
      setSubmitting(false);
    }
  }

  function quickFill(role: "aplikues" | "opb") {
    const acc = TEST_ACCOUNTS.find((a) => a.role === role)!;
    setEmail(acc.email);
    setPassword(acc.password);
  }

  async function handleResetRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setResetSubmitting(false);
    setResetOpen(false);
    toast.success("Kërresa u dërgua", {
      description: `Nëse ${resetEmail} ekziston, do të marrësh një email me udhëzime për reset.`,
    });
    setResetEmail("");
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4 py-10 text-foreground">
      {/* Soft animated background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="login-blob absolute -top-20 left-1/4 h-[420px] w-[420px] rounded-full bg-primary/[0.06] blur-[90px]" />
        <div
          className="login-blob absolute -bottom-24 right-1/4 h-[360px] w-[360px] rounded-full bg-accent/[0.10] blur-[90px]"
          style={{ animationDelay: "-8s" }}
        />
        <div
          className="login-blob absolute top-1/3 -left-20 h-[300px] w-[300px] rounded-full bg-info/[0.05] blur-[80px]"
          style={{ animationDelay: "-16s" }}
        />
      </div>

      {/* Fine grid overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Centered card */}
      <div
        className={cn(
          "relative w-full max-w-md transition-all duration-700 ease-out",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        )}
      >
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-elevated">
          <div className="flex flex-col items-center gap-3 border-b border-border bg-gradient-to-b from-secondary/50 to-secondary/20 px-8 pb-6 pt-8 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg transition-transform duration-500 hover:scale-105">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight">e-Formular OBP</p>
              <p className="text-[11px] text-muted-foreground">
                Hyrje për Autoritetet Kontraktore dhe OPB
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 px-8 py-7">
            <div
              className={cn(
                "login-field transition-all duration-500",
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
              )}
              style={{ transitionDelay: "80ms" }}
            >
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Email zyrtar
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="emri@institucion.al"
                  className="h-11 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm outline-none transition-all focus:border-ring/40 focus:ring-2 focus:ring-ring/30"
                />
              </div>
            </div>

            <div
              className={cn(
                "login-field transition-all duration-500",
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
              )}
              style={{ transitionDelay: "160ms" }}
            >
              <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Fjalëkalimi
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 w-full rounded-md border border-input bg-background pl-10 pr-10 text-sm outline-none transition-all focus:border-ring/40 focus:ring-2 focus:ring-ring/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Fshih fjalëkalimin" : "Shfaq fjalëkalimin"}
                  aria-pressed={showPassword}
                  className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="animate-fade-in rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}

            <div
              className={cn(
                "transition-all duration-500",
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
              )}
              style={{ transitionDelay: "240ms" }}
            >
              <Button
                type="submit"
                disabled={submitting}
                className={cn(
                  "group h-11 w-full transition-all duration-300",
                  success
                    ? "bg-success text-success-foreground"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-elevated",
                )}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Po hyn...
                  </>
                ) : success ? (
                  <>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Sukses
                  </>
                ) : (
                  <>
                    Hyr në sistem
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </Button>
            </div>

            <div
              className={cn(
                "flex flex-col gap-3 transition-all duration-500",
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
              )}
              style={{ transitionDelay: "320ms" }}
            >
              <div className="flex items-center justify-center">
                <Dialog open={resetOpen} onOpenChange={setResetOpen}>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                    >
                      Harrova fjalëkalimin
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-primary" />
                        Rikthe fjalëkalimin
                      </DialogTitle>
                      <DialogDescription>
                        Jep emailin e llogarisë tënde. Do të dërgojmë një link për rikthimin e
                        fjalëkalimit.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleResetRequest} className="space-y-4 pt-2">
                      <div>
                        <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                          Email zyrtar
                        </label>
                        <div className="relative mt-1.5">
                          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <input
                            type="email"
                            required
                            autoComplete="email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            placeholder="emri@institucion.al"
                            className="h-11 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm outline-none transition-all focus:border-ring/40 focus:ring-2 focus:ring-ring/30"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setResetOpen(false)}
                          className="h-10 px-4"
                        >
                          Anulo
                        </Button>
                        <Button
                          type="submit"
                          disabled={resetSubmitting || !resetEmail.trim()}
                          className="h-10 bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          {resetSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Po dërgohet...
                            </>
                          ) : (
                            "Dërgo linkun"
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
                <button
                  type="button"
                  onClick={() => quickFill("aplikues")}
                  className="flex-1 rounded-md border border-dashed border-border bg-muted/30 px-2.5 py-1.5 text-left font-mono transition-colors hover:border-accent/40 hover:bg-accent/5"
                >
                  AK · ak@eformular.gov.al
                </button>
                <button
                  type="button"
                  onClick={() => quickFill("opb")}
                  className="flex-1 rounded-md border border-dashed border-border bg-muted/30 px-2.5 py-1.5 text-left font-mono transition-colors hover:border-accent/40 hover:bg-accent/5"
                >
                  OPB · opb@eformular.gov.al
                </button>
              </div>
            </div>
          </form>
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          © 2026 e-Formular OBP · Sistem Zyrtar i Formularëve OBP
        </p>
      </div>
    </div>
  );
}
