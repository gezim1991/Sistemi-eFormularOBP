## Qëllimi

1. Ristrukturim i plotë i `src/` sipas screenshot-it (folder `features/`, `components/doc-editor/`, etj.).
2. Zëvendësim i formularit aktual të thjeshtë (`forms.new.tsx`, 5 hapa) me formularin e gjatë të prokurimit (1269 rreshta) që përdoruesi pasoi — me të gjitha varësitë e tij (`Btn`, `EditableYellow`, `InlineYellow`, `DropdownPicker`, `DataTable`, `useFormulare`, `mock-data`, CPV CSV).
3. Aplikim micro-interactions (hover scale, fade-in, field slide-in, button scale-down, focus glow, progress fills) në të gjitha komponentët e sistemit.

---

## 1) Struktura e re e `src/`

```text
src/
  components/
    doc-editor/
      data-table.tsx
      dropdown-picker.tsx
      editable.tsx            # EditableYellow + InlineYellow
      ui/                     # tooltips, popovers të vegjël të editorit
    app-shell.tsx             # ish AppShell
    authority-portal-shell.tsx# shell i AK-së (sidebar/topbar specifike)
    btn.tsx                   # buton i unifikuar me micro-interactions
    confirm-modal.tsx
    empty-state.tsx
    flow-steps.tsx            # stepper horizontal me animacion
    pdf-preview.tsx           # ekziston
    signed-pdf-upload-modal.tsx
    status-badge.tsx          # ekziston
    upload-box.tsx            # ekziston
  features/
    auth/
      LoginPage.tsx
      auth-store.tsx
    backend-applications/     # paneli OPB (mbërritjet)
      OpbPanel.tsx
      SubmissionDetail.tsx
    formular-create/
      FormularCreatePage.tsx  # = teksti i pasuar
      sections/               # ndarjet e formularit (Hyrje, Baza, Tab1, ...)
    formular-detail/
      FormularDetailPage.tsx
    formular-lists/
      FormularListPage.tsx
      generated-pdf/PdfListPage.tsx
      sent-obp/SentObpListPage.tsx
      signed/SignedListPage.tsx
    category-types.ts
    formularCategories.ts
  lib/
    formulare-store.tsx       # rishkrim i forms-store me skemën e re
    mock-data.ts              # FormularDocumentData + seed
    api/documents.ts
  routes/                     # vetëm route shells që thërrasin features/*
    __root.tsx
    index.tsx                 # dashboard AK
    login.tsx
    formulare.index.tsx       # listë
    formulare.new.tsx
    formulare.$id.tsx
    formulare.generated.tsx
    formulare.sent.tsx
    formulare.signed.tsx
    opb.tsx
  public/
    cpv-codes.csv             # për DropdownPicker të CPV
```

Lëvizjet kryesore:

- `routes/forms.new.tsx` → hiqet, route i ri `formulare.new.tsx` ngarkon `features/formular-create/FormularCreatePage`.
- `forms-store.tsx` → `formulare-store.tsx` me modelin e ri (`FormularDocumentData`, statuse: `draft`, `pdf_generated`, `signed_uploaded`, `sent_to_opb`, `verified`, `rejected`).
- `routes/opb.tsx` → wrapper që rendon `features/backend-applications/OpbPanel`.

## 2) Komponentët e ri (doc-editor)

- **`editable.tsx`** — `EditableYellow` (bllok i editueshëm me sfond të verdhë të zbehtë, contentEditable + autosize) dhe `InlineYellow` (input inline). Micro-interactions: focus ring i butë, scale-95→100 në mount, transition në sfond kur përdoruesi shkruan.
- **`dropdown-picker.tsx`** — multi-select me kërkim dhe checkbox; popover me `animate-scale-in`, çdo opsion `fade-in` me stagger 30ms.
- **`data-table.tsx`** — tabelë e editueshme me shtim/heqje rreshtash, mbështet `Row` me çelësa dinamikë (emertimi, sasia, cmimi, oferta1..3, etj.); rreshti i ri `slide-in-right`, fshirja `fade-out`.
- **`btn.tsx`** — buton i unifikuar me variants (`primary`, `ghost`, `outline`, `success`, `danger`) dhe micro-interactions: `active:scale-[0.97]`, `transition-transform`, ikona `group-hover:translate-x-0.5`.
- **`flow-steps.tsx`** — stepper horizontal me lidhje që mbushet progresivisht.

## 3) FormularCreatePage

Përdor tekstin e pasuar plotësisht; kërkohet:

- Krijim `formulare-store.tsx` me API: `create`, `get`, `update`, `updateData`, `setStatus`.
- `mock-data.ts` eksporton `FormularDocumentData` (të gjitha fushat që referon teksti: `titulliProjekti`, `adresaFooter`, `emertimiInst`, `objektiProkurimit`, `kodiCPV`, `panoramaObjektivat`, `bazaRows`, `tab1Rows`, `tab2Rows`, `mallraRows`, `puneRows`, `sherbimeRows`, `neni76BRows`, `neni76CRows`, `neni76CcRows`, `grafiku`, `grafikuFileName`, `kontaktEmer`, `kontaktEmail`, `kontaktTel`, `grupiPunes`).
- `public/cpv-codes.csv` minimal (~50 kode demo) që `FormularCreatePage` e bën fetch.
- Modal i gjenerimit të PDF (ekzistues `PdfGeneratingModal`) integrohet me `generationProgress` state-in e ri.

## 4) Micro-interactions globale

Në `styles.css`:

- Reduce default transition: `transition-colors transition-transform duration-150 ease-out` për inputs/butons.
- Keyframes të reja: `field-slide-in` (translateY 6px → 0 + fade), `row-pop` (scale 0.96 → 1), `progress-shimmer`.

Aplikim:

- Sidebar item: `hover:translate-x-0.5`, indicator pill `layoutId`-style me CSS.
- Card hover: `hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]`.
- Status badge: pulse i butë kur statusi është "pending".
- Form fields: çdo `<Field>` me `animate-[field-slide-in_220ms_ease-out]` në mount; focus → ring + scale i lehtë i label-it.
- Buttons: `active:scale-[0.97]`, loading state me shimmer.
- Toast & dialog: tashmë animohen nga shadcn; konfirmohet që ringjyrosen me tokenat e rinj.

## 5) Route-t

- `formulare.new.tsx` → `<FormularCreatePage />` (krijim i ri).
- `formulare.$id.tsx` (mode edit) → `<FormularCreatePage editId={id} />` ose `<FormularDetailPage />` sipas statusit.
- Listat ndahen në 3 tabs/route: `generated`, `sent`, `signed` (në `features/formular-lists/*`).
- Hiqen route-t e vjetra `forms.*`; përditësohen Link-et dhe `breadcrumbs`.

## 6) Verifikim

- `tsgo` për kompilim TypeScript pas çdo grupi ndryshimesh.
- Playwright: login → krijo formular → mbush 2 fusha → gjenero PDF → konfirmo që modaliteti dhe redirect-i funksionojnë.

---

## Vërejtje

Teksti i pasuar i formularit është shumë i gjatë (~1269 rreshta) dhe varet nga shumë komponentë që nuk ekzistojnë. Implementimi do të kërkojë krijim të rreth **15 skedarëve të rinj** dhe lëvizje/rishkrim të rreth **8 ekzistuesve**. Pas miratimit, e kryej në një batch të vetëm me shkrime paralele dhe pastaj verifikim build.
