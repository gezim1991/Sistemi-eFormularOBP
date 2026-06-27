import { useState } from "react";
import { Plus, Search, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Row {
  id: string;
  _sourceId?: string;
  [key: string]: string | undefined;
}

export interface SearchChoice {
  label: string;
  value: string;
  description?: string;
}

export interface ModalChoice {
  label: string;
  value: string;
  description?: string;
}

export interface Column {
  key: string;
  header: string;
  width?: string;
  placeholder?: string;
  editable?: boolean;
  numeric?: boolean;
  choices?: string[];
  searchChoices?: SearchChoice[];
  searchTitle?: string;
  searchPlaceholder?: string;
  searchEmptyText?: string;
  modalChoices?: ModalChoice[];
  modalTitle?: string;
  modalDescription?: string;
  compute?: (row: Row) => string;
}

interface Props {
  columns: Column[];
  rows: Row[];
  onChange: (rows: Row[]) => void;
  showIndex?: boolean;
  footerRow?: { label: string; compute: (rows: Row[]) => string };
}

const uid = () => Math.random().toString(36).slice(2, 9);

/**
 * DataTable — editable, schema-driven table used throughout the procurement
 * planning document. Supports inline text, numeric, fixed-choice, searchable
 * choice (CPV codes) and modal choice columns. Includes computed columns and
 * an optional footer row. Micro-interactions: row pop-in on add, hover
 * elevation, focus ring on cells.
 */
export function DataTable({ columns, rows, onChange, showIndex, footerRow }: Props) {
  const [search, setSearch] = useState<{ rowId: string; col: Column } | null>(null);
  const [modal, setModal] = useState<{ rowId: string; col: Column } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const setCell = (rowId: string, key: string, value: string) =>
    onChange(rows.map((r) => (r.id === rowId ? { ...r, [key]: value } : r)));

  const removeRow = (rowId: string) => onChange(rows.filter((r) => r.id !== rowId));

  const filtered = search
    ? (search.col.searchChoices ?? []).filter((c) => {
        const t = searchTerm.toLowerCase();
        return (
          c.label.toLowerCase().includes(t) ||
          c.value.toLowerCase().includes(t) ||
          (c.description ?? "").toLowerCase().includes(t)
        );
      })
    : [];

  return (
    <div className="mt-3 overflow-hidden rounded-md border border-navy/20 print:rounded-none">
      <table className="w-full table-fixed border-collapse font-serif text-[13px]">
        <thead>
          <tr className="bg-navy/5">
            {showIndex && (
              <th className="w-10 border-b border-navy/15 px-2 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-navy">
                Nr.
              </th>
            )}
            {columns.map((c) => (
              <th
                key={c.key}
                style={{ width: c.width }}
                className="border-b border-l border-navy/15 px-2 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-navy first:border-l-0"
              >
                {c.header}
              </th>
            ))}
            <th className="w-9 border-b border-l border-navy/15 print:hidden" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.id}
              className="animate-[row-pop_220ms_ease-out] border-b border-navy/10 transition-colors last:border-b-0 hover:bg-navy/[0.02]"
            >
              {showIndex && (
                <td className="px-2 py-1.5 text-center text-[12px] text-muted-foreground">
                  {idx + 1}
                </td>
              )}
              {columns.map((c) => {
                const editable = c.editable !== false;
                const value = c.compute ? c.compute(row) : (row[c.key] ?? "");

                if (c.choices) {
                  return (
                    <td key={c.key} className="border-l border-navy/10 p-0 first:border-l-0">
                      <select
                        value={value}
                        onChange={(e) => setCell(row.id, c.key, e.target.value)}
                        className="h-9 w-full bg-transparent px-2 text-[13px] outline-none transition-colors focus:bg-yellow-50"
                      >
                        <option value="">—</option>
                        {c.choices.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                  );
                }

                if (c.searchChoices) {
                  return (
                    <td key={c.key} className="border-l border-navy/10 p-0 first:border-l-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSearch({ rowId: row.id, col: c });
                          setSearchTerm("");
                        }}
                        className={cn(
                          "flex h-9 w-full items-center gap-1.5 px-2 text-left text-[13px] transition-colors hover:bg-navy/5",
                          !value && "italic text-navy/60",
                        )}
                      >
                        <Search className="h-3 w-3 shrink-0 opacity-60" />
                        <span className="truncate">{value || c.placeholder}</span>
                      </button>
                    </td>
                  );
                }

                if (c.modalChoices) {
                  return (
                    <td key={c.key} className="border-l border-navy/10 p-0 first:border-l-0">
                      <button
                        type="button"
                        onClick={() => setModal({ rowId: row.id, col: c })}
                        className={cn(
                          "h-9 w-full px-2 text-left text-[13px] transition-colors hover:bg-navy/5",
                          !value && "italic text-navy/60",
                        )}
                      >
                        <span className="block truncate">{value || c.placeholder}</span>
                      </button>
                    </td>
                  );
                }

                return (
                  <td key={c.key} className="border-l border-navy/10 p-0 first:border-l-0">
                    {editable && !c.compute ? (
                      <textarea
                        rows={1}
                        value={String(row[c.key] ?? "")}
                        onChange={(e) => {
                          setCell(row.id, c.key, e.target.value);
                          const el = e.currentTarget;
                          el.style.height = "auto";
                          el.style.height = el.scrollHeight + "px";
                        }}
                        ref={(el) => {
                          if (el) {
                            el.style.height = "auto";
                            el.style.height = el.scrollHeight + "px";
                          }
                        }}
                        placeholder={c.placeholder}
                        inputMode={c.numeric ? "decimal" : "text"}
                        className={cn(
                          "block w-full resize-none overflow-hidden bg-transparent px-2 py-2 text-[13px] leading-snug outline-none transition-all duration-150 focus:bg-yellow-50 focus:ring-1 focus:ring-yellow-300",
                          c.numeric && "text-right tabular-nums",
                          "whitespace-pre-wrap break-words [overflow-wrap:break-word] [word-break:normal] [hyphens:none]",
                          "placeholder:italic placeholder:text-navy/40",
                        )}
                      />
                    ) : (
                      <div
                        className={cn(
                          "min-h-9 px-2 py-2 text-[13px] leading-snug",
                          c.compute && "bg-navy/[0.03] text-right font-semibold tabular-nums",
                        )}
                      >
                        {value || <span className="italic text-navy/40">—</span>}
                      </div>
                    )}
                  </td>
                );
              })}
              <td className="border-l border-navy/10 p-0 text-center align-middle print:hidden">
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  aria-label="Hiq rreshtin"
                  className="grid h-9 w-9 place-items-center text-navy/40 transition-all duration-150 hover:scale-110 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          ))}
          {footerRow && (
            <tr className="bg-gold/10 font-semibold">
              {showIndex && <td />}
              <td
                colSpan={columns.length - 1}
                className="border-t border-navy/20 px-2 py-2 text-right text-[12px] uppercase tracking-wide text-navy"
              >
                {footerRow.label}
              </td>
              <td className="border-l border-t border-navy/20 px-2 py-2 text-right text-[13px] tabular-nums text-navy">
                {footerRow.compute(rows)}
              </td>
              <td className="border-t border-navy/20 print:hidden" />
            </tr>
          )}
        </tbody>
      </table>

      {/* Add row */}
      <div className="flex justify-end border-t border-navy/10 bg-white p-1.5 print:hidden">
        <button
          type="button"
          onClick={() => {
            const empty: Row = { id: uid() };
            columns.forEach((c) => {
              if (c.editable !== false && !c.compute) empty[c.key] = "";
            });
            onChange([...rows, empty]);
          }}
          className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold text-navy transition-all hover:bg-navy/5 active:scale-95"
        >
          <Plus className="h-3 w-3" /> Shto rresht
        </button>
      </div>

      {/* Search modal */}
      {search && (
        <Modal title={search.col.searchTitle ?? "Kërko"} onClose={() => setSearch(null)}>
          <input
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={search.col.searchPlaceholder}
            className="h-10 w-full rounded-md border border-navy/20 bg-white px-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-gold/50"
          />
          <div className="mt-3 max-h-80 overflow-y-auto rounded-md border border-navy/10">
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm italic text-muted-foreground">
                {search.col.searchEmptyText ?? "Pa rezultate."}
              </p>
            ) : (
              filtered.slice(0, 100).map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    setCell(search.rowId, search.col.key, c.label);
                    setSearch(null);
                  }}
                  className="block w-full border-b border-navy/5 px-3 py-2 text-left text-sm transition-colors hover:bg-gold/10 last:border-0"
                >
                  <div className="font-semibold text-navy">{c.label}</div>
                  {c.description && (
                    <div className="mt-0.5 text-xs text-muted-foreground">{c.description}</div>
                  )}
                </button>
              ))
            )}
          </div>
        </Modal>
      )}

      {/* Modal-choice */}
      {modal && (
        <Modal title={modal.col.modalTitle ?? "Zgjidh"} onClose={() => setModal(null)}>
          {modal.col.modalDescription && (
            <p className="mb-3 text-xs text-muted-foreground">{modal.col.modalDescription}</p>
          )}
          <div className="space-y-2">
            {(modal.col.modalChoices ?? []).map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => {
                  setCell(modal.rowId, modal.col.key, c.value);
                  setModal(null);
                }}
                className="block w-full rounded-md border border-navy/15 p-3 text-left text-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-gold hover:bg-gold/10 hover:shadow-md"
              >
                <div className="font-semibold text-navy">{c.label}</div>
                {c.description && (
                  <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {c.description}
                  </div>
                )}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-navy/40 px-4 backdrop-blur-sm animate-[fade-in_180ms_ease-out]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl origin-center animate-[scale-in_180ms_ease-out] rounded-lg bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="font-display text-base font-bold text-navy">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded text-muted-foreground transition-colors hover:bg-navy/5 hover:text-navy"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
