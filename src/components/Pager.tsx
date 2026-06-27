import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const DEFAULT_PAGE_SIZE = 8;

export function usePaged<T>(items: T[], page: number, pageSize: number) {
  return useMemo(() => {
    const total = items.length;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), pageCount);
    const start = (safePage - 1) * pageSize;
    const slice = items.slice(start, start + pageSize);
    return { slice, total, pageCount, page: safePage, start };
  }, [items, page, pageSize]);
}

function pageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);
  if (left > 2) pages.push("…");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}

export function Pager({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
  label = "rezultate",
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  label?: string;
}) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const pages = pageList(page, pageCount);

  return (
    <div className="flex flex-col gap-3 border-t px-5 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <p>
        Po shfaqen{" "}
        <span className="font-medium text-foreground">
          {from}–{to}
        </span>{" "}
        nga <span className="font-medium text-foreground">{total}</span> {label}
      </p>
      {pageCount > 1 && (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Faqja e mëparshme"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {pages.map((p, i) =>
            p === "…" ? (
              <span key={`e-${i}`} className="px-1.5 text-muted-foreground">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`h-8 min-w-8 rounded-md px-2 text-xs font-medium transition-colors ${
                  p === page
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {p}
              </button>
            ),
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
            aria-label="Faqja tjetër"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
