import { useCallback, useEffect, useRef, useState } from "react";
import { CloudUpload, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function UploadBox({
  onUpload,
  uploading,
}: {
  onUpload: (file: File) => void;
  uploading?: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!uploading) {
      setProgress(file ? 0 : 0);
      return;
    }

    setProgress((current) => Math.max(current, 12));
    const timer = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 96) return current;
        const step = current < 55 ? 8 : current < 82 ? 4 : 1.5;
        return Math.min(96, current + step);
      });
    }, 260);

    return () => window.clearInterval(timer);
  }, [file, uploading]);

  const accept = useCallback((f: File | undefined | null) => {
    setError(null);
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      setError("Lejohen vetëm dokumente PDF.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("Madhësia maksimale është 10 MB.");
      return;
    }
    setFile(f);
    setProgress(0);
  }, []);

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          accept(e.dataTransfer.files?.[0]);
        }}
        onClick={() => !uploading && inputRef.current?.click()}
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-muted/40 p-10 text-center transition-all",
          uploading && "pointer-events-none opacity-70",
          dragOver
            ? "border-accent bg-accent/5"
            : "border-border hover:border-accent/60 hover:bg-accent/5",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => accept(e.target.files?.[0])}
        />
        <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/5 text-primary ring-1 ring-inset ring-primary/10 transition-colors group-hover:bg-accent/10 group-hover:text-accent-foreground">
          <CloudUpload className="h-7 w-7" />
        </div>
        <p className="mt-4 text-sm font-medium text-foreground">
          Tërhiq dokumentin këtu ose{" "}
          <span className="text-primary underline-offset-2 hover:underline">
            zgjidh nga pajisja
          </span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Lejohen vetëm dokumente PDF · maksimumi 10 MB
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive ring-1 ring-inset ring-destructive/20">
          {error}
        </p>
      )}

      {file && (
        <div
          className={cn(
            "group/file relative overflow-hidden rounded-xl border bg-card p-3 shadow-[var(--shadow-card)]",
            "transition-all duration-300 ease-out animate-in fade-in-0 slide-in-from-bottom-2",
            uploading
              ? "border-dashed border-accent/80 bg-accent/5 shadow-[0_14px_32px_-24px_var(--color-gold)]"
              : "hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[var(--shadow-elevated)]",
          )}
        >
          <div className="pointer-events-none absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition-all duration-700 group-hover/file:translate-x-[120%] group-hover/file:opacity-100" />
          <div className="relative flex items-center gap-3">
            <div
              className={cn(
                "grid h-10 w-10 shrink-0 place-items-center rounded-md ring-1 ring-inset transition-all duration-300",
                uploading
                  ? "bg-primary text-primary-foreground ring-primary/20"
                  : "bg-primary/5 text-primary ring-primary/10",
              )}
            >
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-semibold">{file.name}</p>
                {uploading && (
                  <span className="shrink-0 text-[11px] font-semibold tabular-nums text-accent-foreground">
                    {Math.round(progress)}%
                  </span>
                )}
              </div>
              {uploading ? (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">{fmtSize(file.size)}</p>
              )}
            </div>
            {!uploading && (
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setProgress(0);
                }}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Hiq dokumentin"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          disabled={!file || uploading}
          onClick={() => {
            if (!file) return;
            setProgress(12);
            onUpload(file);
          }}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {uploading ? "Duke ngarkuar..." : "Ngarko dokumentin"}
        </Button>
      </div>
    </div>
  );
}
