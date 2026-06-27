import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FileText, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onComplete: () => void;
  durationMs?: number;
}

const STAGES = [
  { at: 15, label: "Po përgatiten të dhënat e formularit..." },
  { at: 40, label: "Po formatohet dokumenti zyrtar A4..." },
  { at: 70, label: "Po inkorporohen vulat dhe metadata..." },
  { at: 92, label: "Po finalizohet PDF-ja..." },
  { at: 100, label: "PDF-ja u gjenerua me sukses." },
];

export function PdfGeneratingModal({ open, onComplete, durationMs = 2600 }: Props) {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) {
      setProgress(0);
      setDone(false);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(100, ((t - start) / durationMs) * 100);
      setProgress(p);
      if (p < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        setDone(true);
        setTimeout(onComplete, 650);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, durationMs, onComplete]);

  const stage = STAGES.find((s) => progress <= s.at) ?? STAGES[STAGES.length - 1];

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md border-0 bg-card p-0 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.4)] [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="relative overflow-hidden">
          {/* Ambient glow */}
          <div
            className={cn(
              "pointer-events-none absolute -top-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full blur-3xl transition-colors duration-500",
              done ? "bg-success/30" : "bg-accent/30",
            )}
          />

          <div className="relative px-8 py-9 text-center">
            <div
              className={cn(
                "mx-auto grid h-16 w-16 place-items-center rounded-2xl ring-1 ring-inset transition-all duration-500",
                done
                  ? "bg-success/10 text-success ring-success/30"
                  : "bg-primary/5 text-primary ring-primary/15",
              )}
            >
              {done ? (
                <CheckCircle2 className="h-8 w-8 animate-scale-in" />
              ) : (
                <div className="relative">
                  <FileText className="h-7 w-7" />
                  <Sparkles className="absolute -right-2 -top-2 h-4 w-4 animate-pulse text-accent" />
                </div>
              )}
            </div>

            <h3 className="mt-5 text-lg font-semibold tracking-tight">
              {done ? "PDF u gjenerua" : "Po gjenerohet PDF-ja zyrtare"}
            </h3>
            <p className="mt-1 min-h-[20px] text-xs text-muted-foreground transition-all">
              {stage.label}
            </p>

            {/* Progress bar */}
            <div className="mt-7">
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full transition-[width] duration-150 ease-out",
                    done
                      ? "bg-gradient-to-r from-success to-success/80"
                      : "bg-gradient-to-r from-primary via-accent to-primary",
                  )}
                  style={{ width: `${progress}%` }}
                />
                {!done && (
                  <div
                    className="absolute inset-y-0 w-24 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    style={{ left: `${progress}%` }}
                  />
                )}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] font-medium">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  {!done && <Loader2 className="h-3 w-3 animate-spin" />}
                  {done ? "Përfunduar" : "Duke procesuar"}
                </span>
                <span
                  className={cn("font-mono tabular-nums", done ? "text-success" : "text-primary")}
                >
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </Dialog>
  );
}
