"""
PyMuPDF renderer for FormDoc JSON.

This file contains layout/rendering only. The document content is built in
document_builder.py and reused by the React preview endpoint.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

import fitz

A4_W, A4_H = 595.0, 842.0
ML, MR = 56.0, 56.0
MT, MB = 54.0, 42.0
FOOTER_H = 46.0
CONTENT_W = A4_W - ML - MR
CONTENT_BOTTOM = A4_H - MB - FOOTER_H

C_BLACK = (0, 0, 0)
C_NAVY = (0.059, 0.09, 0.165)
C_GRAY = (0.38, 0.42, 0.48)
C_LIGHT = (0.88, 0.90, 0.93)
C_SOFT = (0.96, 0.97, 0.98)
C_GOLD_SOFT = (1.0, 0.965, 0.84)
C_WHITE = (1, 1, 1)

F_REG = "tiro"
F_BOLD = "tibo"
F_ITALIC = "tiit"


@dataclass
class PdfLayout:
    doc: fitz.Document
    adresa: str
    page: fitz.Page
    y: float
    has_content: bool = False

    @classmethod
    def create(cls, adresa: str) -> "PdfLayout":
        doc = fitz.open()
        page = doc.new_page(width=A4_W, height=A4_H)
        return cls(doc=doc, adresa=adresa, page=page, y=MT)

    def new_page(self) -> None:
        if not self.has_content and len(self.doc) == 1:
            self.y = MT
            return
        self.page = self.doc.new_page(width=A4_W, height=A4_H)
        self.y = MT
        self.has_content = False

    def ensure_space(self, height: float) -> None:
        if self.y + height <= CONTENT_BOTTOM:
            return
        self.new_page()

    def draw_footers(self) -> None:
        for page in self.doc:
            y_line = A4_H - MB - 8
            page.draw_line((ML, y_line), (A4_W - MR, y_line), color=C_BLACK, width=0.35)
            if self.adresa:
                lines = wrap_text(self.adresa, F_ITALIC, 7.5, CONTENT_W)
                if lines:
                    page.insert_text(
                        (ML, y_line + 12),
                        lines[0],
                        fontname=F_ITALIC,
                        fontsize=7.5,
                        color=C_GRAY,
                    )


def render_pdf(doc: dict) -> bytes:
    layout = PdfLayout.create(adresa=str(doc.get("adresa") or ""))
    pages = doc.get("pages") or []

    for page_index, page_def in enumerate(pages):
        nodes = page_def.get("nodes") or []
        if not nodes:
            continue
        if page_index == 0 and any(node.get("type") == "big_title" for node in nodes):
            render_cover_page(layout, nodes)
            if any((p.get("nodes") or []) for p in pages[page_index + 1:]):
                layout.new_page()
            continue
        render_nodes(layout, nodes)

    if not layout.has_content and len(layout.doc) == 1:
        draw_text_wrapped(layout, "Dokumenti nuk ka te dhena.", ML, layout.y, CONTENT_W, F_REG, 11, C_GRAY)

    layout.draw_footers()
    return layout.doc.tobytes(garbage=4, deflate=True)


def render_cover_page(layout: PdfLayout, nodes: list[dict]) -> None:
    title = ""
    shtojca = None
    footnotes: list[dict] = []
    for node in nodes:
        if node.get("type") == "big_title":
            title = str(node.get("text") or "[Titulli i projektit]")
        elif node.get("type") == "shtojca":
            shtojca = node
        elif node.get("type") == "footnote":
            footnotes.append(node)

    if shtojca:
        render_shtojca(layout, shtojca)

    rect = fitz.Rect(ML, MT + 220, A4_W - MR, MT + 360)
    layout.page.insert_textbox(
        rect,
        title,
        fontname=F_BOLD,
        fontsize=14,
        color=C_NAVY,
        align=fitz.TEXT_ALIGN_CENTER,
    )

    foot_y = CONTENT_BOTTOM - 48
    for node in footnotes[:1]:
        text = str(node.get("text") or "")
        if text:
            layout.page.draw_line((ML, foot_y - 6), (ML + CONTENT_W * 0.35, foot_y - 6), color=C_LIGHT, width=0.45)
            draw_text_wrapped(layout, text, ML, foot_y + 4, CONTENT_W, F_ITALIC, 7.5, C_GRAY, mark=False)

    layout.y = CONTENT_BOTTOM
    layout.has_content = True


def render_nodes(layout: PdfLayout, nodes: list[dict]) -> None:
    for i, node in enumerate(nodes):
        next_node = nodes[i + 1] if i + 1 < len(nodes) else None
        if node.get("type") in {"h2", "h3"} and next_node:
            layout.ensure_space(measure_node(node) + min(measure_node(next_node), 70))
        render_node(layout, node)


def render_node(layout: PdfLayout, node: dict) -> None:
    t = node.get("type")
    if t == "shtojca":
        render_shtojca(layout, node)
    elif t == "big_title":
        render_big_title(layout, node)
    elif t == "h2":
        render_h2(layout, node)
    elif t == "h3":
        render_h3(layout, node)
    elif t == "para":
        render_para(layout, node)
    elif t == "text":
        render_text(layout, node)
    elif t == "bullets":
        render_bullets(layout, node)
    elif t == "table":
        render_table(layout, node)
    elif t == "kv_table":
        render_kv_table(layout, node)
    elif t == "signature_block":
        render_signature_block(layout, node)
    elif t == "footnote":
        render_footnote(layout, node)
    elif t == "separator":
        layout.ensure_space(36)
        layout.page.insert_text((A4_W / 2 - 10, layout.y + 16), "***", fontname=F_REG, fontsize=11, color=C_GRAY)
        layout.y += 36
        layout.has_content = True
    elif t == "spacer":
        layout.y += 14


def render_shtojca(layout: PdfLayout, node: dict) -> None:
    text = str(node.get("text") or "")
    if node.get("footnoteRef"):
        text = f"{text} {node['footnoteRef']}"
    h = measure_text_wrapped(text, F_REG, 10, CONTENT_W) + 8
    layout.ensure_space(h)
    layout.y = draw_text_wrapped(layout, text, ML, layout.y, CONTENT_W, F_REG, 10, C_NAVY) + 8


def render_big_title(layout: PdfLayout, node: dict) -> None:
    text = str(node.get("text") or "[Titulli i projektit]")
    block_h = 320
    layout.ensure_space(block_h)
    rect = fitz.Rect(ML, layout.y + 105, A4_W - MR, layout.y + block_h)
    layout.page.insert_textbox(rect, text, fontname=F_BOLD, fontsize=14, color=C_NAVY, align=fitz.TEXT_ALIGN_CENTER)
    layout.y += block_h
    layout.has_content = True


def render_h2(layout: PdfLayout, node: dict) -> None:
    title = str(node.get("title") or "")
    layout.ensure_space(34)
    layout.y += 10
    layout.page.insert_text((ML, layout.y), title, fontname=F_BOLD, fontsize=11, color=C_NAVY)
    layout.y += 16
    layout.has_content = True


def render_h3(layout: PdfLayout, node: dict) -> None:
    title = str(node.get("title") or "")
    h = measure_text_wrapped(title, F_BOLD, 9, CONTENT_W - 10) + 12
    layout.ensure_space(h + 8)
    layout.y += 5
    rect = fitz.Rect(ML, layout.y, A4_W - MR, layout.y + h)
    layout.page.draw_rect(rect, color=(0.86, 0.66, 0.18), fill=C_GOLD_SOFT, width=0.35)
    draw_text_wrapped(layout, title, ML + 5, layout.y + 10, CONTENT_W - 10, F_BOLD, 9, C_NAVY, mark=False)
    layout.y += h + 6
    layout.has_content = True


def render_para(layout: PdfLayout, node: dict) -> None:
    text = segs_to_text(node.get("segs") or [])
    if not text.strip():
        return
    font = F_ITALIC if node.get("italic") else F_REG
    h = measure_text_wrapped(text, font, 10.5, CONTENT_W) + 10
    layout.ensure_space(h)
    layout.y = draw_text_wrapped(layout, text, ML, layout.y + 4, CONTENT_W, font, 10.5, C_BLACK) + 6


def render_text(layout: PdfLayout, node: dict) -> None:
    value = str(node.get("value") or "").strip()
    if not value:
        return
    font = F_BOLD if node.get("bold") else (F_ITALIC if node.get("italic") else F_REG)
    color = C_GRAY if node.get("italic") else C_BLACK
    for part in split_preserved_lines(value, bool(node.get("pre"))):
        h = measure_text_wrapped(part or " ", font, 10, CONTENT_W) + 4
        layout.ensure_space(h)
        layout.y = draw_text_wrapped(layout, part or " ", ML, layout.y + 2, CONTENT_W, font, 10, color) + 2


def render_bullets(layout: PdfLayout, node: dict) -> None:
    for item in node.get("items") or []:
        text = str(item or "")
        lines = wrap_text(text, F_REG, 10, CONTENT_W - 20)
        h = max(1, len(lines)) * 13 + 4
        layout.ensure_space(h)
        layout.page.insert_text((ML + 4, layout.y + 10), "-", fontname=F_REG, fontsize=10, color=C_BLACK)
        for line in lines:
            layout.page.insert_text((ML + 18, layout.y + 10), line, fontname=F_REG, fontsize=10, color=C_BLACK)
            layout.y += 13
        layout.y += 3
        layout.has_content = True


def render_table(layout: PdfLayout, node: dict) -> None:
    cols = node.get("cols") or []
    rows = node.get("rows") or []
    total_row = node.get("total_row")
    if not cols:
        return
    if not rows and not total_row:
        render_empty_table(layout)
        return

    widths = column_widths(cols)
    header_h = measure_table_header(cols, widths)
    rows_to_draw = list(rows)
    if total_row:
        rows_to_draw.append({"__total_row__": total_row})

    layout.ensure_space(header_h + min(measure_table_row(cols, rows_to_draw[0], widths), 80) + 8)
    draw_table_header(layout, cols, widths, header_h)

    for row in rows_to_draw:
        row_h = measure_table_row(cols, row, widths)
        if row_h > CONTENT_BOTTOM - MT - header_h:
            row_h = CONTENT_BOTTOM - MT - header_h
        if layout.y + row_h > CONTENT_BOTTOM:
            layout.new_page()
            draw_table_header(layout, cols, widths, header_h)
        draw_table_row(layout, cols, row, widths, row_h)

    layout.y += 8


def render_kv_table(layout: PdfLayout, node: dict) -> None:
    rows = node.get("rows") or []
    if not rows:
        return
    label_w = 150.0
    table_w = CONTENT_W
    total_h = 0.0
    row_heights: list[float] = []
    for row in rows:
        label = str(row.get("label") or "")
        value = str(row.get("value") or "")
        h = max(
            measure_text_wrapped(label, F_BOLD, 10, label_w - 18),
            measure_text_wrapped(value or "-", F_REG, 10, table_w - label_w - 18),
        ) + 16
        h = max(28.0, h)
        row_heights.append(h)
        total_h += h
    layout.ensure_space(total_h + 12)
    y0 = layout.y
    y = y0
    border = (0.76, 0.80, 0.86)
    label_fill = (0.94, 0.94, 0.95)
    for row, h in zip(rows, row_heights):
        label = str(row.get("label") or "")
        value = str(row.get("value") or "")
        layout.page.draw_rect(fitz.Rect(ML, y, ML + table_w, y + h), color=border, fill=C_WHITE, width=0.35)
        layout.page.draw_rect(fitz.Rect(ML, y, ML + label_w, y + h), color=border, fill=label_fill, width=0.35)
        draw_text_wrapped(layout, label, ML + 10, y + 17, label_w - 20, F_BOLD, 10, C_NAVY, mark=False)
        draw_text_wrapped(layout, value or "-", ML + label_w + 10, y + 17, table_w - label_w - 20, F_REG, 10, C_BLACK, mark=False)
        layout.y += h
        y += h
        layout.has_content = True
    layout.page.draw_rect(fitz.Rect(ML, y0, ML + table_w, y0 + total_h), color=border, width=0.5)
    layout.y += 18


def render_signature_block(layout: PdfLayout, node: dict) -> None:
    value = str(node.get("value") or "").strip()
    lines = [line.strip() for line in value.splitlines() if line.strip()]
    if not lines:
        lines = ["Emer Mbiemer - Emertesa e pozicionit (nenshkrimi)"]
    h = 34 + len(lines) * 28
    layout.ensure_space(h)
    title = str(node.get("title") or "GRUPI I PUNES / ZYRTARI PERGJEGJES")
    layout.page.insert_text((ML, layout.y + 12), title, fontname=F_BOLD, fontsize=12, color=C_BLACK)
    layout.y += 36
    for line in lines:
        layout.page.insert_text((ML, layout.y), line, fontname=F_REG, fontsize=13, color=C_BLACK)
        layout.y += 28
    layout.has_content = True


def render_footnote(layout: PdfLayout, node: dict) -> None:
    text = str(node.get("text") or "")
    if not text:
        return
    h = measure_text_wrapped(text, F_ITALIC, 8, CONTENT_W) + 16
    layout.ensure_space(h)
    layout.page.draw_line((ML, layout.y + 4), (ML + CONTENT_W * 0.4, layout.y + 4), color=C_LIGHT, width=0.5)
    layout.y = draw_text_wrapped(layout, text, ML, layout.y + 16, CONTENT_W, F_ITALIC, 8, C_GRAY) + 4


def render_empty_table(layout: PdfLayout) -> None:
    layout.ensure_space(28)
    rect = fitz.Rect(ML, layout.y, A4_W - MR, layout.y + 24)
    layout.page.draw_rect(rect, color=C_LIGHT, fill=C_SOFT, width=0.4)
    layout.page.insert_text((ML + 8, layout.y + 16), "Asnje rresht i plotesuar.", fontname=F_ITALIC, fontsize=9, color=C_GRAY)
    layout.y += 32
    layout.has_content = True


def column_widths(cols: list[dict]) -> list[float]:
    pcts = [float(c.get("pct") or 0) for c in cols]
    if sum(pcts) > 0:
        total = sum(pcts)
        return [CONTENT_W * (p / total) for p in pcts]
    return [CONTENT_W / len(cols)] * len(cols)


def draw_table_header(layout: PdfLayout, cols: list[dict], widths: list[float], h: float) -> None:
    x = ML
    y = layout.y
    layout.page.draw_rect(fitz.Rect(ML, y, A4_W - MR, y + h), color=C_BLACK, fill=(0.97, 0.97, 0.97), width=0.45)
    for col, w in zip(cols, widths):
        rect = fitz.Rect(x + 4, y + 4, x + w - 4, y + h - 4)
        layout.page.insert_textbox(
            rect,
            str(col.get("header") or ""),
            fontname=F_ITALIC,
            fontsize=7.4,
            color=C_BLACK,
            align=align_value(col.get("align")),
        )
        x += w
        layout.page.draw_line((x, y), (x, y + h), color=C_BLACK, width=0.35)
    layout.page.draw_line((ML, y + h), (A4_W - MR, y + h), color=C_BLACK, width=0.45)
    layout.y += h
    layout.has_content = True


def draw_table_row(layout: PdfLayout, cols: list[dict], row: dict, widths: list[float], h: float) -> None:
    y = layout.y
    is_total = "__total_row__" in row
    fill = (0.97, 0.97, 0.97) if is_total else C_WHITE
    layout.page.draw_rect(fitz.Rect(ML, y, A4_W - MR, y + h), color=C_BLACK, fill=fill, width=0.35)
    x = ML
    total_values = row.get("__total_row__") if is_total else None
    for i, (col, w) in enumerate(zip(cols, widths)):
        next_x = x + w
        layout.page.draw_line((next_x, y), (next_x, y + h), color=C_BLACK, width=0.3)
        x = next_x
    x = ML
    for i, (col, w) in enumerate(zip(cols, widths)):
        value = str(total_values[i] if total_values and i < len(total_values) else row.get(col.get("key"), "") or "")
        font = F_BOLD if is_total else F_REG
        rect = fitz.Rect(x + 4, y + 4, x + w - 4, y + h - 4)
        layout.page.insert_textbox(
            rect,
            value or "",
            fontname=font,
            fontsize=7.2,
            color=C_BLACK,
            align=align_value(col.get("align")),
        )
        x += w
    layout.y += h
    layout.has_content = True


def measure_node(node: dict) -> float:
    t = node.get("type")
    if t in {"h2", "h3"}:
        return 34
    if t == "para":
        return measure_text_wrapped(segs_to_text(node.get("segs") or []), F_REG, 10.5, CONTENT_W) + 12
    if t == "text":
        return measure_text_wrapped(str(node.get("value") or ""), F_REG, 10, CONTENT_W) + 8
    if t == "table":
        cols = node.get("cols") or []
        rows = node.get("rows") or []
        if not cols or not rows:
            return 30
        widths = column_widths(cols)
        return measure_table_header(cols, widths) + measure_table_row(cols, rows[0], widths)
    return 26


def measure_table_header(cols: list[dict], widths: list[float]) -> float:
    h = 0.0
    for col, w in zip(cols, widths):
        h = max(h, measure_text_wrapped(str(col.get("header") or ""), F_ITALIC, 7.4, w - 8))
    return max(28.0, h + 12)


def measure_table_row(cols: list[dict], row: dict, widths: list[float]) -> float:
    total_values = row.get("__total_row__")
    h = 0.0
    for i, (col, w) in enumerate(zip(cols, widths)):
        value = str(total_values[i] if total_values and i < len(total_values) else row.get(col.get("key"), "") or "")
        h = max(h, measure_text_wrapped(value or "", F_REG, 7.2, w - 8))
    return max(24.0, h + 12)


def align_value(align: str | None) -> int:
    if align == "c":
        return fitz.TEXT_ALIGN_CENTER
    if align == "r":
        return fitz.TEXT_ALIGN_RIGHT
    return fitz.TEXT_ALIGN_LEFT


def draw_text_wrapped(
    layout: PdfLayout,
    text: str,
    x: float,
    y: float,
    width: float,
    font: str,
    size: float,
    color: tuple[float, float, float],
    *,
    mark: bool = True,
) -> float:
    line_h = size * 1.28
    for line in wrap_text(text, font, size, width):
        layout.page.insert_text((x, y), line, fontname=font, fontsize=size, color=color)
        y += line_h
    if mark:
        layout.has_content = True
    return y


def measure_text_wrapped(text: str, font: str, size: float, width: float) -> float:
    return max(1, len(wrap_text(text, font, size, width))) * size * 1.28


def wrap_text(text: str, font: str, size: float, width: float) -> list[str]:
    normalized = " ".join(str(text or "").replace("\r", " ").split())
    if not normalized:
        return [""]
    lines: list[str] = []
    current = ""
    for word in normalized.split(" "):
        parts = split_long_word(word, font, size, width)
        for part in parts:
            probe = f"{current} {part}".strip()
            if not current or text_width(probe, font, size) <= width:
                current = probe
            else:
                lines.append(current)
                current = part
    if current:
        lines.append(current)
    return lines


def split_long_word(word: str, font: str, size: float, width: float) -> list[str]:
    if text_width(word, font, size) <= width:
        return [word]
    parts: list[str] = []
    current = ""
    for ch in word:
        probe = current + ch
        if current and text_width(probe, font, size) > width:
            parts.append(current)
            current = ch
        else:
            current = probe
    if current:
        parts.append(current)
    return parts


def text_width(text: str, font: str, size: float) -> float:
    try:
        return fitz.get_text_length(str(text), fontname=font, fontsize=size)
    except Exception:
        return len(str(text)) * size * 0.5


def segs_to_text(segs: Iterable[dict]) -> str:
    out = ""
    for seg in segs:
        if seg.get("k") == "t":
            out += str(seg.get("v") or "")
        else:
            value = str(seg.get("v") or "").strip()
            out += value or "[...]"
    return out


def split_preserved_lines(value: str, pre: bool) -> list[str]:
    if pre:
        return value.splitlines() or [value]
    return [value]
