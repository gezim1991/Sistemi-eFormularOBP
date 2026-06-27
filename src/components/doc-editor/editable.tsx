import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface EditableYellowProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  style?: CSSProperties;
  invalid?: boolean;
}

/**
 * EditableYellow — multi-line editable block painted yellow when empty.
 * Auto-grows with content and fades to transparent once filled.
 */
export function EditableYellow({
  value,
  onChange,
  placeholder,
  className,
  style,
  invalid = false,
}: EditableYellowProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const filled = value.trim().length > 0;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      rows={1}
      style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: "14px", ...style }}
      aria-invalid={invalid || undefined}
      className={cn(
        "block w-full resize-none rounded-sm px-2 py-1 leading-relaxed outline-none transition-all duration-200",
        "placeholder:italic placeholder:text-navy/60",
        filled
          ? "bg-transparent text-foreground hover:bg-yellow-50 focus:bg-yellow-100/70"
          : "animate-[field-slide-in_220ms_ease-out] border border-yellow-400/70 bg-yellow-100/80 text-navy",
        "focus:ring-2 focus:ring-yellow-300",
        invalid &&
          "border border-destructive/70 bg-destructive/5 text-destructive focus:ring-destructive/40 animate-[fade-in_180ms_ease-out]",
        className,
      )}
    />
  );
}

interface InlineYellowProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  /** kept for API compat — no longer used for width, size is auto */
  width?: string;
  className?: string;
  invalid?: boolean;
}

/**
 * InlineYellow — contenteditable span that lives inside a paragraph.
 * Grows horizontally as the user types, wraps to next line when the
 * paragraph overflows — exactly like a Word fill-in-the-blank field.
 */
export function InlineYellow({
  value,
  onChange,
  placeholder,
  className,
  invalid = false,
}: InlineYellowProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const skipSync = useRef(false);
  const filled = value.trim().length > 0;

  // Sync external value into the DOM only when it truly changed from outside
  // (e.g., form hydration on edit). During user typing we skip this to
  // avoid cursor-position resets.
  useEffect(() => {
    const el = ref.current;
    if (!el || skipSync.current) return;
    if (el.textContent !== value) {
      el.textContent = value;
    }
  }, [value]);

  return (
    <span
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label={placeholder}
      aria-invalid={invalid || undefined}
      data-placeholder={!filled ? placeholder : undefined}
      onInput={(e) => {
        skipSync.current = true;
        onChange(e.currentTarget.textContent ?? "");
        // Allow the next external-change effect to re-sync if needed
        requestAnimationFrame(() => { skipSync.current = false; });
      }}
      onKeyDown={(e) => {
        // Prevent Enter from inserting <br> / new block — this is an inline field
        if (e.key === "Enter") e.preventDefault();
      }}
      onPaste={(e) => {
        // Strip rich formatting — paste plain text only
        e.preventDefault();
        const text = e.clipboardData.getData("text/plain").replace(/\n/g, " ");
        document.execCommand("insertText", false, text);
      }}
      className={cn(
        "inline-yellow-field mx-0.5 inline rounded-sm px-1 py-0 outline-none",
        "transition-colors duration-200 focus:ring-2 focus:ring-yellow-300",
        filled
          ? "bg-yellow-50 text-foreground hover:bg-yellow-100"
          : "border border-yellow-400/70 bg-yellow-100/80 text-navy italic",
        invalid &&
          "border border-destructive/70 bg-destructive/5 text-destructive focus:ring-destructive/40",
        className,
      )}
      style={{
        fontFamily: '"Times New Roman", Times, serif',
        fontSize: "14px",
        wordBreak: "break-word",
        overflowWrap: "break-word",
      }}
    />
  );
}
