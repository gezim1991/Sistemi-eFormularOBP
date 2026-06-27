import { useCallback, useRef, useState } from "react";
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
  const inputRef = useRef<HTMLInputElement>(null);

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
        onClick={() => inputRef.current?.click()}
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-muted/40 p-10 text-center transition-all",
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
        <div className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-[var(--shadow-card)]">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary/5 text-primary ring-1 ring-inset ring-primary/10">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{fmtSize(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => setFile(null)}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Hiq dokumentin"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          disabled={!file || uploading}
          onClick={() => file && onUpload(file)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {uploading ? "Duke ngarkuar..." : "Ngarko dokumentin"}
        </Button>
      </div>
    </div>
  );
}
