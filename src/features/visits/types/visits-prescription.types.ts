// ── Prescription printout ───────────────────────────────────────────────────
// The printed prescription ("paper") is data-driven: the print endpoint returns
// `{ template, document }`. `template.layout.blocks` is an ordered list the
// frontend renders through a block registry, so a future custom template just
// supplies different blocks — no new rendering code per template.

export type PrescriptionBlockType =
  | "header"
  | "doctor"
  | "patient"
  | "diagnosis"
  | "medications"
  | "notes"
  | "signature"
  | "footer";

export type PrescriptionBlock = {
  type: PrescriptionBlockType;
  /** Defaults to true; an explicit `false` hides the block. */
  visible?: boolean;
  options?: Record<string, unknown>;
};

export type PrescriptionTemplateLayout = {
  blocks: PrescriptionBlock[];
};

export type PrescriptionTemplate = {
  id: string;
  name: string;
  layout: PrescriptionTemplateLayout;
};

export type PrescriptionDocumentItem = {
  name: string;
  generic_name?: string | null;
  strength?: string | null;
  form?: string | null;
  dose: string;
  route?: string | null;
  frequency: string;
  duration?: string | null;
  instructions?: string | null;
};

export type PrescriptionDocument = {
  prescribed_at: string;
  notes?: string | null;
  organization: {
    id: string;
    name: string;
    logo_object_key?: string | null;
    /** Presigned GET URL for the logo; render directly. */
    logo_image_url?: string | null;
  };
  branch: {
    id: string;
    name: string;
    address: string;
    city: string;
    governorate: string;
    country?: string | null;
  };
  doctor: {
    id: string;
    name: string;
    specialty?: string | null;
    license_number?: string | null;
    signature_object_key?: string | null;
  };
  patient: {
    id: string;
    full_name: string;
    phone_number?: string | null;
    date_of_birth?: string | null;
  };
  diagnosis: {
    chief_complaint?: string | null;
    provisional_diagnosis?: string | null;
  };
  items: PrescriptionDocumentItem[];
};

export type PrescriptionPrint = {
  template: PrescriptionTemplate;
  document: PrescriptionDocument;
};

