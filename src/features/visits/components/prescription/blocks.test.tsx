import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/render";
import type { PrescriptionDocument } from "../../types/visits.api.types";
import {
  HeaderBlock,
  DoctorBlock,
  PatientBlock,
  DiagnosisBlock,
  MedicationsBlock,
  NotesBlock,
  SignatureBlock,
  FooterBlock,
  PRESCRIPTION_BLOCKS,
  blockSeparatorClass,
} from "./blocks";

function buildDocument(over: Partial<PrescriptionDocument> = {}): PrescriptionDocument {
  return {
    prescribed_at: "2026-03-12T10:00:00.000Z",
    notes: "Drink plenty of water.",
    organization: {
      id: "org-1",
      name: "Cradlen Clinic",
      logo_image_url: "https://cdn.example.com/logo.png",
    },
    branch: {
      id: "br-1",
      name: "Main Branch",
      address: "12 Nile St",
      city: "Cairo",
      governorate: "Cairo",
    },
    doctor: {
      id: "doc-1",
      name: "Dr. Hala Younis",
      specialty: "Obstetrics",
      license_number: "LIC-9988",
    },
    patient: {
      id: "p-1",
      full_name: "Sara Mahmoud",
      phone_number: "+20 100 1234567",
      date_of_birth: "1994-03-12",
    },
    diagnosis: {
      chief_complaint: "Nausea",
      provisional_diagnosis: "First-trimester pregnancy",
    },
    items: [
      {
        name: "Folic Acid",
        strength: "5mg",
        form: "Tablet",
        dose: "1 tab",
        frequency: "Once daily",
        duration: "30 days",
        instructions: "After breakfast",
      },
    ],
    ...over,
  };
}

describe("prescription blocks", () => {
  it("HeaderBlock renders org name, branch line, address and logo", () => {
    renderWithIntl(<HeaderBlock document={buildDocument()} />);
    expect(screen.getByText("Cradlen Clinic")).toBeInTheDocument();
    expect(screen.getByText("Main Branch · Cairo, Cairo")).toBeInTheDocument();
    expect(screen.getByText("12 Nile St")).toBeInTheDocument();
    const logo = screen.getByAltText("Cradlen Clinic") as HTMLImageElement;
    expect(logo.src).toContain("logo.png");
  });

  it("HeaderBlock omits the logo when no url is supplied", () => {
    const doc = buildDocument({
      organization: { id: "org-1", name: "Cradlen Clinic", logo_image_url: null },
    });
    renderWithIntl(<HeaderBlock document={doc} />);
    expect(screen.queryByAltText("Cradlen Clinic")).not.toBeInTheDocument();
  });

  it("DoctorBlock renders name, specialty and license", () => {
    renderWithIntl(<DoctorBlock document={buildDocument()} />);
    expect(screen.getByText("Dr. Hala Younis")).toBeInTheDocument();
    expect(screen.getByText("Obstetrics")).toBeInTheDocument();
    expect(screen.getByText(/LIC-9988/)).toBeInTheDocument();
  });

  it("PatientBlock renders name, computed age and phone", () => {
    renderWithIntl(<PatientBlock document={buildDocument()} />);
    expect(screen.getByText("Sara Mahmoud")).toBeInTheDocument();
    expect(screen.getByText("+20 100 1234567")).toBeInTheDocument();
    // computeAge from a 1994 DOB yields a positive age string ("{count} yrs").
    expect(screen.getByText(/\d+\s*yrs/i)).toBeInTheDocument();
  });

  it("DiagnosisBlock returns null when no complaint or diagnosis", () => {
    const doc = buildDocument({ diagnosis: { chief_complaint: null, provisional_diagnosis: null } });
    const { container } = renderWithIntl(<DiagnosisBlock document={doc} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("DiagnosisBlock renders complaint and diagnosis values", () => {
    renderWithIntl(<DiagnosisBlock document={buildDocument()} />);
    expect(screen.getByText("Nausea")).toBeInTheDocument();
    expect(screen.getByText("First-trimester pregnancy")).toBeInTheDocument();
  });

  it("MedicationsBlock renders a numbered item with regimen and subtitle", () => {
    renderWithIntl(<MedicationsBlock document={buildDocument()} />);
    expect(screen.getByText("Folic Acid")).toBeInTheDocument();
    expect(screen.getByText("(5mg · Tablet)")).toBeInTheDocument();
    expect(screen.getByText("1 tab · Once daily · 30 days")).toBeInTheDocument();
    expect(screen.getByText("After breakfast")).toBeInTheDocument();
  });

  it("MedicationsBlock renders an empty placeholder when there are no items", () => {
    renderWithIntl(<MedicationsBlock document={buildDocument({ items: [] })} />);
    // visits.prescription.noMedications
    expect(screen.getByText(/no medication/i)).toBeInTheDocument();
  });

  it("NotesBlock returns null when notes are empty", () => {
    const { container } = renderWithIntl(<NotesBlock document={buildDocument({ notes: null })} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("NotesBlock renders the note text", () => {
    renderWithIntl(<NotesBlock document={buildDocument()} />);
    expect(screen.getByText("Drink plenty of water.")).toBeInTheDocument();
  });

  it("SignatureBlock renders the doctor name", () => {
    renderWithIntl(<SignatureBlock document={buildDocument()} />);
    expect(screen.getByText(/Dr. Hala Younis/)).toBeInTheDocument();
  });

  it("FooterBlock joins org, branch and city line", () => {
    renderWithIntl(<FooterBlock document={buildDocument()} />);
    expect(
      screen.getByText("Cradlen Clinic · Main Branch · Cairo, Cairo"),
    ).toBeInTheDocument();
  });

  it("exposes a complete block registry", () => {
    expect(Object.keys(PRESCRIPTION_BLOCKS).sort()).toEqual(
      [
        "diagnosis",
        "doctor",
        "footer",
        "header",
        "medications",
        "notes",
        "patient",
        "signature",
      ].sort(),
    );
  });

  it("blockSeparatorClass adds a divider for every block after the first", () => {
    expect(blockSeparatorClass(0)).toBe("");
    expect(blockSeparatorClass(1)).toContain("border-t");
  });
});
