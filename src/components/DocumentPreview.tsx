/**
 * DocumentPreview — React renderer i unifikuar i DDL-it.
 *
 * Merr një FormDoc (nga document-builder.ts) dhe e vizaton si Preview.
 * Nuk ka logjikë dokumenti brenda — vetëm rendering.
 */

import type { FormDoc, DocNode, DocPage, Seg, Col } from "@/lib/document-types"

// ─── Entry point ────────────────────────────────────────────────────────────

export function DocumentPreview({ doc }: { doc: FormDoc }) {
  const total = doc.pages.length
  return (
    <div className="mx-auto flex flex-col gap-8 print:gap-0" style={{ maxWidth: 900 }}>
      {doc.pages.map((page, i) => (
        <Page key={i} index={i + 1} total={total} adresa={doc.adresa} pageIdx={i}>
          {page.nodes.map((node, j) => (
            <NodeRenderer key={j} node={node} />
          ))}
        </Page>
      ))}
    </div>
  )
}

// ─── Page wrapper ───────────────────────────────────────────────────────────

function Page({
  index,
  total,
  adresa,
  pageIdx,
  children,
}: {
  index: number
  total: number
  adresa: string
  pageIdx: number
  children: React.ReactNode
}) {
  return (
    <div
      className="group/page relative mx-auto bg-white px-10 py-12 shadow-md ring-1 ring-border transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_55px_-32px_rgba(15,23,42,0.45)] hover:ring-navy/20 print:transform-none print:shadow-none sm:px-16"
      style={{
        width: 794,
        animation: `field-slide-in 260ms cubic-bezier(0.22, 1, 0.36, 1) both`,
        animationDelay: `${Math.min(pageIdx, 4) * 55}ms`,
      }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gold/70 transition-transform duration-300 group-hover/page:scale-x-100 print:hidden" />
      <div className="pb-24">{children}</div>
      <div className="absolute inset-x-10 bottom-6 sm:inset-x-16">
        <div className="border-t border-foreground/20 pt-2 text-center transition-colors duration-200 group-hover/page:border-gold/50">
          <p
            className="mx-auto max-w-full whitespace-normal break-words italic text-foreground/80 transition-colors duration-200 group-hover/page:text-navy"
            style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: "10pt" }}
          >
            {adresa ? `Adresa: ${adresa}` : "—"}
          </p>
          <div className="mt-1 text-[10px] text-muted-foreground">
            Faqe {index} / {total}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Node dispatcher ────────────────────────────────────────────────────────

function NodeRenderer({ node }: { node: DocNode }) {
  switch (node.type) {
    case "shtojca":
      return <ShtojcaHeading text={node.text} footnoteRef={node.footnoteRef} />
    case "big_title":
      return <BigTitle text={node.text} />
    case "h2":
      return <H2 title={node.title} />
    case "h3":
      return <H3 title={node.title} />
    case "para":
      return <Para segs={node.segs} italic={node.italic} />
    case "text":
      return <TextBlock value={node.value} italic={node.italic} bold={node.bold} pre={node.pre} />
    case "bullets":
      return <BulletList items={node.items} />
    case "table":
      return <DataTable cols={node.cols} rows={node.rows} total_row={node.total_row} />
    case "kv_table":
      return <KvTable rows={node.rows} />
    case "signature_block":
      return <SignatureBlock title={node.title} value={node.value} />
    case "footnote":
      return <Footnote text={node.text} />
    case "separator":
      return <Separator />
    case "spacer":
      return <div className="h-6" />
    default:
      return null
  }
}

// ─── Node renderers ─────────────────────────────────────────────────────────

function ShtojcaHeading({ text, footnoteRef }: { text: string; footnoteRef?: string }) {
  return (
    <p className="font-serif text-[14px] font-bold text-navy">
      {text}
      {footnoteRef && <sup className="text-[9px]">{footnoteRef}</sup>}
    </p>
  )
}

function BigTitle({ text }: { text: string }) {
  return (
    <div className="flex min-h-[480px] items-center justify-center py-16 text-center">
      {text ? (
        <p
          className="mx-auto max-w-[580px] font-semibold"
          style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: "14pt" }}
        >
          {text}
        </p>
      ) : (
        <p className="italic text-muted-foreground" style={{ fontSize: "14pt" }}>
          [Titulli i projektit]
        </p>
      )}
    </div>
  )
}

function H2({ title }: { title: string }) {
  return (
    <section className="group/section mt-10 animate-[field-slide-in_240ms_ease-out]">
      <h2 className="relative inline-flex font-serif text-[15px] font-bold tracking-wide text-navy">
        {title}
        <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-gold transition-transform duration-300 group-hover/section:scale-x-100" />
      </h2>
    </section>
  )
}

function H3({ title }: { title: string }) {
  return (
    <div className="group/calc mt-4">
      <p className="rounded-md border border-gold/40 bg-gold/10 px-3 py-2 font-sans text-sm font-semibold text-navy transition-all duration-200 group-hover/calc:-translate-y-0.5 group-hover/calc:border-gold/70 group-hover/calc:bg-gold/15 group-hover/calc:shadow-sm">
        {title}
      </p>
    </div>
  )
}

function Para({ segs, italic }: { segs: Seg[]; italic?: boolean }) {
  return (
    <p
      className={italic ? "italic" : undefined}
      style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: "14px", lineHeight: 1.55 }}
    >
      {segs.map((seg, i) => {
        if (seg.k === "t") return <span key={i}>{seg.v}</span>
        if (seg.empty) {
          return (
            <span key={i} className="italic text-muted-foreground">
              [{seg.v || "…"}]
            </span>
          )
        }
        return (
          <span
            key={i}
            className="mx-0.5 inline-block rounded-sm bg-yellow-50 px-1 ring-1 ring-transparent hover:ring-gold/40"
            style={{ fontFamily: '"Times New Roman", Times, serif' }}
          >
            {seg.v}
          </span>
        )
      })}
    </p>
  )
}

function TextBlock({
  value,
  italic,
  bold,
  pre,
}: {
  value: string
  italic?: boolean
  bold?: boolean
  pre?: boolean
}) {
  if (!value) return null
  return (
    <p
      className={[
        "mt-2",
        italic ? "italic" : "",
        bold ? "font-bold" : "",
        "break-words",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        fontFamily: '"Times New Roman", Times, serif',
        fontSize: "14px",
        lineHeight: 1.5,
        whiteSpace: pre ? "pre-wrap" : undefined,
      }}
    >
      {value}
    </p>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="ml-8 mt-2 list-disc space-y-1 font-serif text-[14px] leading-relaxed">
      {items.map((item, i) => (
        <li key={i} className="pl-1">
          {item}
        </li>
      ))}
    </ul>
  )
}

function DataTable({
  cols,
  rows,
  total_row,
}: {
  cols: Col[]
  rows: Record<string, string>[]
  total_row?: string[]
}) {
  const totalPct = cols.reduce((s, c) => s + (c.pct ?? 0), 0)
  const usePct = totalPct > 0

  const alignClass = (a?: "l" | "c" | "r") =>
    a === "c" ? "text-center" : a === "r" ? "text-right" : "text-left"

  if (rows.length === 0) {
    return (
      <p className="mt-2 rounded-md border border-dashed border-navy/20 px-3 py-3 text-center text-xs italic text-muted-foreground">
        Asnjë rresht i plotësuar.
      </p>
    )
  }

  return (
    <div className="mt-2 overflow-hidden rounded-md border border-navy/20 transition-all duration-200 hover:border-navy/35 hover:shadow-sm">
      <table className="w-full font-serif text-[13px]" style={{ tableLayout: usePct ? "fixed" : "auto" }}>
        {usePct && (
          <colgroup>
            {cols.map((c, i) => (
              <col key={i} style={{ width: `${c.pct}%` }} />
            ))}
          </colgroup>
        )}
        <thead className="bg-navy/5 text-navy">
          <tr>
            {cols.map((c) => (
              <th
                key={c.key}
                className={`border-b border-navy/15 px-2 py-2 font-semibold ${alignClass(c.align)}`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              className="border-b border-navy/10 transition-colors duration-150 last:border-b-0 hover:bg-gold/5"
              style={{ animation: `row-pop 180ms ease-out both`, animationDelay: `${ri * 22}ms` }}
            >
              {cols.map((c) => (
                <td
                  key={c.key}
                  className={`whitespace-pre-wrap break-words px-2 py-1.5 align-top ${alignClass(c.align)}`}
                >
                  {row[c.key]?.trim() || <span className="text-muted-foreground">—</span>}
                </td>
              ))}
            </tr>
          ))}
          {total_row && (
            <tr className="bg-navy/5 font-semibold text-navy">
              {total_row.map((cell, i) => (
                <td
                  key={i}
                  className={`px-2 py-1.5 ${alignClass(cols[i]?.align)}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function KvTable({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <div className="mt-2 overflow-hidden rounded-md border border-navy/20">
      <table className="w-full font-serif text-[14px]">
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-navy/15 last:border-b-0 hover:bg-gold/5">
              <td className="w-44 border-r border-navy/15 bg-navy/5 px-3 py-2 font-semibold text-navy">
                {r.label}
              </td>
              <td className="px-3 py-2">
                {r.value?.trim() || <span className="italic text-muted-foreground">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SignatureBlock({ title, value }: { title: string; value: string }) {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  return (
    <section className="mt-8 font-serif text-foreground">
      <h2 className="text-[19px] font-bold uppercase leading-tight text-navy">{title}</h2>
      <div className="mt-5 space-y-4 text-[18px] leading-relaxed">
        {(lines.length ? lines : ["Emër Mbiemër – Emërtesa e pozicionit (nënshkrimi)"]).map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </section>
  )
}

function Footnote({ text }: { text: string }) {
  return (
    <p className="mt-4 border-t border-foreground/20 pt-2 font-serif text-[10pt] text-muted-foreground">
      {text}
    </p>
  )
}

function Separator() {
  return (
    <div className="py-8 text-center font-serif text-[14px] text-muted-foreground">***</div>
  )
}
