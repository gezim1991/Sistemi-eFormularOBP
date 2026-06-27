import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PickerOption {
  id: string;
  label: string;
  defaults?: Record<string, string>;
}

interface Props {
  label: string;
  hint?: string;
  options: PickerOption[];
  selected: string[];
  onChange: (next: string[]) => void;
}

/**
 * DropdownPicker — multi-select used to push rows into a DataTable.
 * Micro-interactions: chevron rotates, options fade-in with stagger.
 */
export function DropdownPicker({ label, hint, options, selected, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
    setOpen(false);
  };

  return (
    <div className="print:hidden">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "group flex w-full items-center justify-between gap-3 rounded-md border bg-white px-4 py-2.5 text-left text-sm font-semibold text-navy transition-all duration-150",
          "hover:border-gold hover:bg-gold/10 active:scale-[0.997]",
          open ? "border-gold bg-gold/10" : "border-navy/20",
        )}
      >
        <span className="flex-1">{label}</span>
        {selected.length > 0 && (
          <span className="inline-flex items-center justify-center rounded-full bg-navy px-2 py-0.5 text-[10px] font-bold text-navy-foreground">
            {selected.length}
          </span>
        )}
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {hint && <p className="mt-1 px-1 text-[11px] italic text-muted-foreground">{hint}</p>}

      {open && (
        <div className="mt-2 origin-top animate-[scale-in_160ms_ease-out] overflow-hidden rounded-md border border-navy/15 bg-white shadow-lg">
          {options.map((opt, i) => {
            const checked = selected.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggle(opt.id)}
                style={{ animationDelay: `${i * 30}ms` }}
                className={cn(
                  "flex w-full animate-[fade-in_200ms_ease-out] items-start gap-3 border-b border-navy/5 px-4 py-2.5 text-left text-sm transition-colors last:border-0",
                  checked ? "bg-gold/10 text-navy" : "text-foreground hover:bg-navy/5",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border transition-all duration-150",
                    checked
                      ? "scale-100 border-navy bg-navy text-navy-foreground"
                      : "scale-90 border-navy/30",
                  )}
                >
                  {checked && <Check className="h-3 w-3" />}
                </span>
                <span className="leading-snug">{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
