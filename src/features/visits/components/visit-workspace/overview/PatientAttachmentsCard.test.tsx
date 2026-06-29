import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";

import { renderWithIntl } from "@/test/render";
import type { PatientAttachmentGroup } from "@/features/investigations/types/investigation-review.types";

const mockAttachments = vi.fn();
vi.mock("@/features/investigations/hooks/useInvestigationReview", () => ({
  usePatientAttachments: (id: string) => mockAttachments(id),
}));

const openReview = vi.fn();
vi.mock(
  "@/features/investigations/store/investigationReviewStore",
  () => ({
    useInvestigationReviewStore: (
      selector: (s: { open: (id: string) => void }) => unknown,
    ) => selector({ open: openReview }),
  }),
);

import { PatientAttachmentsCard } from "./PatientAttachmentsCard";

function group(over: Partial<PatientAttachmentGroup> = {}): PatientAttachmentGroup {
  return {
    id: "g-1",
    testName: "Ultrasound",
    typeLabel: "Imaging",
    orderedAt: "2026-03-12T00:00:00.000Z",
    status: "REVIEWED",
    attachments: [
      { id: "a-1", url: "https://x/img.png", contentType: "image/png" },
      { id: "a-2", url: "https://x/report.pdf", contentType: "application/pdf" },
    ],
    ...over,
  } as PatientAttachmentGroup;
}

describe("PatientAttachmentsCard", () => {
  beforeEach(() => {
    mockAttachments.mockReset();
    openReview.mockReset();
  });

  it("renders nothing when there are no attachments", () => {
    mockAttachments.mockReturnValue({ data: [], isLoading: false, isError: false });
    const { container } = renderWithIntl(
      <PatientAttachmentsCard patientId="p-1" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing on error", () => {
    mockAttachments.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    const { container } = renderWithIntl(
      <PatientAttachmentsCard patientId="p-1" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the skeleton while loading", () => {
    mockAttachments.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });
    const { container } = renderWithIntl(
      <PatientAttachmentsCard patientId="p-1" />,
    );
    expect(screen.getByText("Attachments & results")).toBeInTheDocument();
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("renders a group with file chips and opens review on click", () => {
    mockAttachments.mockReturnValue({
      data: [group()],
      isLoading: false,
      isError: false,
    });
    renderWithIntl(<PatientAttachmentsCard patientId="p-1" />);
    expect(screen.getByText("Ultrasound")).toBeInTheDocument();
    expect(screen.getByText("IMG")).toBeInTheDocument();
    expect(screen.getByText("PDF")).toBeInTheDocument();
    expect(screen.getByText("Reviewed")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Ultrasound"));
    expect(openReview).toHaveBeenCalledWith("g-1");
  });
});
