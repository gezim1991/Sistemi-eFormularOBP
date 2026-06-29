export type FormStatus =
  | "draft"
  | "pdf_generated"
  | "signed_uploaded"
  | "submitted_to_opb"
  | "archived"
  | "verified" // legacy alias kept for backward compat
  | "rejected"; // legacy alias kept for backward compat

import type { FormularDocumentData, PunePublikeDocumentData } from "./mock-data";

export interface AttachmentRecord {
  id: number;
  name: string;
  size: number;
  contentType: string;
  uploadedAt: string;
  downloadUrl: string;
}

export interface FormRecord {
  id: string;
  emri: string;
  mbiemri: string;
  atesia: string;
  nid: string;
  datelindja: string | null;
  email: string;
  telefon: string;
  adresa: string;
  institucioni: string;
  arsyeja: string;
  status: FormStatus;
  createdAt: string;
  updatedAt: string;
  pdfGeneratedAt?: string;
  signedFileName?: string;
  signedFileSize?: number;
  signedUploadedAt?: string;
  submittedToOpbAt?: string;
  rejectionReason?: string;
  emerFormulari?: string;
  document?: FormularDocumentData | PunePublikeDocumentData;
  // OPB activity (from backend)
  opbViewedAt?: string | null;
  opbDownloadedAt?: string | null;
  isNewForMe?: boolean;
  // Attachments
  attachments?: AttachmentRecord[];
  // Permission flags from backend
  canEdit?: boolean;
  canGeneratePdf?: boolean;
  canUploadSigned?: boolean;
  canSubmitToOpb?: boolean;
  canDownloadPdf?: boolean;
  canUploadAttachment?: boolean;
}

export const STATUS_META: Record<
  FormStatus,
  { label: string; tone: "neutral" | "info" | "warning" | "success" | "danger" }
> = {
  draft: { label: "Draft", tone: "neutral" },
  pdf_generated: { label: "PDF i gjeneruar", tone: "info" },
  signed_uploaded: { label: "I firmosur / i ngarkuar", tone: "warning" },
  submitted_to_opb: { label: "Dorëzuar OPB", tone: "success" },
  archived: { label: "Arkivuar", tone: "neutral" },
  verified: { label: "I verifikuar", tone: "success" },
  rejected: { label: "I refuzuar", tone: "danger" },
};

export const seedForms: FormRecord[] = [
  {
    id: "APL-2026-0001",
    emri: "Arjana",
    mbiemri: "Hoxha",
    atesia: "Beqir",
    nid: "J95412078K",
    datelindja: "1995-04-12",
    email: "arjana.hoxha@example.al",
    telefon: "+355 69 234 1122",
    adresa: "Rr. Myslym Shyri 14, Tiranë",
    institucioni: "Ministria e Drejtësisë",
    arsyeja: "Aplikim për pajisje me vërtetim të gjendjes gjyqësore për procedurë punësimi.",
    status: "verified",
    createdAt: "2026-06-10T09:12:00Z",
    updatedAt: "2026-06-18T14:02:00Z",
    pdfGeneratedAt: "2026-06-11T10:00:00Z",
    signedFileName: "aplikim-firmosur.pdf",
    signedFileSize: 412300,
    signedUploadedAt: "2026-06-14T08:30:00Z",
  },
  {
    id: "APL-2026-0002",
    emri: "Endrit",
    mbiemri: "Kola",
    atesia: "Petrit",
    nid: "I80315044L",
    datelindja: "1988-03-15",
    email: "endrit.kola@example.al",
    telefon: "+355 68 991 0044",
    adresa: "Rr. Bardhyl 22, Tiranë",
    institucioni: "Bashkia Tiranë",
    arsyeja: "Kërkesë për çertifikatë familjare.",
    status: "signed_uploaded",
    createdAt: "2026-06-19T11:40:00Z",
    updatedAt: "2026-06-22T09:15:00Z",
    pdfGeneratedAt: "2026-06-20T12:00:00Z",
    signedFileName: "kerkese-firmosur.pdf",
    signedFileSize: 298120,
    signedUploadedAt: "2026-06-22T09:15:00Z",
  },
  {
    id: "APL-2026-0003",
    emri: "Megi",
    mbiemri: "Shehu",
    atesia: "Ardian",
    nid: "K00917055M",
    datelindja: "2000-09-17",
    email: "megi.shehu@example.al",
    telefon: "+355 67 445 7788",
    adresa: "Rr. Kavajës 188, Tiranë",
    institucioni: "Universiteti i Tiranës",
    arsyeja: "Vërtetim studenti për bursë.",
    status: "pdf_generated",
    createdAt: "2026-06-21T14:22:00Z",
    updatedAt: "2026-06-23T10:00:00Z",
    pdfGeneratedAt: "2026-06-23T10:00:00Z",
  },
  {
    id: "APL-2026-0004",
    emri: "Klevis",
    mbiemri: "Dervishi",
    atesia: "Sokol",
    nid: "H92204011N",
    datelindja: "1992-02-04",
    email: "klevis.dervishi@example.al",
    telefon: "+355 69 112 0098",
    adresa: "Rr. Don Bosko 5, Tiranë",
    institucioni: "QKB",
    arsyeja: "Regjistrim biznesi individual.",
    status: "draft",
    createdAt: "2026-06-24T08:05:00Z",
    updatedAt: "2026-06-24T08:05:00Z",
  },
  {
    id: "APL-2026-0005",
    emri: "Iris",
    mbiemri: "Lleshi",
    atesia: "Genti",
    nid: "G87711029P",
    datelindja: "1987-11-29",
    email: "iris.lleshi@example.al",
    telefon: "+355 68 700 4521",
    adresa: "Rr. Komuna e Parisit 9, Tiranë",
    institucioni: "ISSH",
    arsyeja: "Aplikim për përfitime sigurimi shoqëror.",
    status: "rejected",
    createdAt: "2026-06-12T13:11:00Z",
    updatedAt: "2026-06-17T09:30:00Z",
    pdfGeneratedAt: "2026-06-13T09:00:00Z",
    signedFileName: "aplikim-issh.pdf",
    signedFileSize: 521000,
    signedUploadedAt: "2026-06-15T11:00:00Z",
    rejectionReason: "Firma nuk përputhet me dokumentin e identifikimit.",
  },
];
