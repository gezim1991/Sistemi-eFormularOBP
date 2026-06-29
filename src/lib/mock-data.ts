// FormularDocumentData — the structured "Word-like" document captured by the
// Formular elektronik për planifikimin e prokurimit form.

export type FormType = "mallra-sherbime" | "pune";

export interface PunePublikeDocumentData {
  formType: "pune";
  titulli: string;
  llojiDokumentit: string;
  objekti: string;
  bazaDokumentit: string;
  detaje: string;
  shenimeTregu: string;
  dokumentacionNdertim: string;
  dokumentacionSherbim: string;
  numriKopjeve: string;
  grupiPunes: string;
  rows: Array<Record<string, string>>;
}

export interface FormularDocumentData {
  formType?: "mallra-sherbime";
  adresaFooter: string;
  titulliProjekti: string;

  // Hyrje
  emertimiInst: string;
  objektiProkurimit: string;
  kodiCPV: string;
  panoramaObjektivat: string;

  // Baza ligjore
  bazaRows: Array<Record<string, string>>;

  // Nevoja
  nevojaArgument?: string;
  nevojaPlanifikim?: string;
  tab1Rows: Array<Record<string, string>>;

  // Specifikimet teknike
  tab2Rows: Array<Record<string, string>>;

  // III. Përllogaritja
  mallraRows: Array<Record<string, string>>;
  puneRows: Array<Record<string, string>>;
  sherbimeRows: Array<Record<string, string>>;
  neni76BRows: Array<Record<string, string>>;
  neni76CRows: Array<Record<string, string>>;
  neni76CcRows: Array<Record<string, string>>;

  // IV. Grafiku
  grafiku: string;
  grafikuFileName: string;

  // Kontakti & grupi i punës
  kontaktEmer: string;
  kontaktEmail: string;
  kontaktTel: string;
  grupiPunes: string;

  /** Custom column headers per table. Key = tableId, value = { colKey: label } */
  tableHeaders?: Record<string, Record<string, string>>;
}
