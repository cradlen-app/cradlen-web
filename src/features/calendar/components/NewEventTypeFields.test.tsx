import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { useForm } from "react-hook-form";

import { renderWithIntl } from "@/test/render";
import type { NewEventFormValues } from "../lib/calendar.schemas";

const mockProcedures = vi.fn();
const mockPatientSearch = vi.fn();
const mockStaff = vi.fn();

vi.mock("../hooks/useProcedures", () => ({
  useProcedures: (q: string) => mockProcedures(q),
}));
vi.mock("@/features/visits/hooks/usePatientSearch", () => ({
  usePatientSearch: (q: string) => mockPatientSearch(q),
}));
vi.mock("@/core/staff/api", () => ({
  useStaff: (org?: string, branch?: string) => mockStaff(org, branch),
}));
vi.mock("@/features/auth/hooks/useUserProfileContext", () => ({
  useUserProfileContext: () => ({
    organizationId: "org-1",
    branchId: "br-1",
    currentUserStaffId: "self",
  }),
}));

import { ProcedureFields } from "./NewEventTypeFields";

function Harness({
  defaultValues,
}: {
  defaultValues?: Partial<NewEventFormValues>;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<any>({
    defaultValues,
  });
  return (
    <ProcedureFields
      register={form.register}
      control={form.control}
      errors={form.formState.errors}
      setValue={form.setValue}
      watch={form.watch}
    />
  );
}

describe("ProcedureFields", () => {
  beforeEach(() => {
    mockProcedures.mockReset();
    mockPatientSearch.mockReset();
    mockStaff.mockReset();
    mockProcedures.mockReturnValue({ data: [], isFetching: false });
    mockPatientSearch.mockReturnValue({ data: [], isFetching: false });
    mockStaff.mockReturnValue({ data: [] });
  });

  it("renders the procedure, patient and assistants fields", () => {
    renderWithIntl(<Harness />);
    expect(screen.getByText(/Procedure \*/)).toBeInTheDocument();
    expect(screen.getByText("Patient (optional)")).toBeInTheDocument();
    expect(screen.getByText("Assistants")).toBeInTheDocument();
    expect(screen.getByText("No assistants added.")).toBeInTheDocument();
  });

  it("shows procedure results and selects one on click", async () => {
    mockProcedures.mockReturnValue({
      data: [
        { id: "proc-1", name: "Hysteroscopy", code: "HYS", specialty: null },
      ],
      isFetching: false,
    });
    renderWithIntl(<Harness />);
    const input = screen.getByPlaceholderText("Search by name or code...");
    fireEvent.focus(input);
    const option = await screen.findByText("Hysteroscopy");
    fireEvent.click(option);
    // After select, the query value becomes the chosen name.
    await waitFor(() =>
      expect(input).toHaveValue("Hysteroscopy"),
    );
  });

  it("shows the procedure not-found message for an empty result set", () => {
    mockProcedures.mockReturnValue({ data: [], isFetching: false });
    renderWithIntl(<Harness />);
    fireEvent.focus(screen.getByPlaceholderText("Search by name or code..."));
    expect(screen.getByText("No procedure found.")).toBeInTheDocument();
  });

  it("adds and removes assistant rows, listing clinical staff except self", () => {
    mockStaff.mockReturnValue({
      data: [
        {
          id: "doc-2",
          firstName: "Omar",
          lastName: "Naguib",
          isClinical: true,
          email: "omar@x.com",
          specialty: { name: "Gyn" },
        },
        // Non-clinical staff are filtered out of the picker.
        {
          id: "rec-1",
          firstName: "Reem",
          lastName: "Desk",
          isClinical: false,
        },
        // Self is excluded.
        { id: "self", firstName: "Me", lastName: "Self", isClinical: true },
      ],
    });
    renderWithIntl(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Add assistant" }));

    const select = screen.getByRole("combobox");
    const options = Array.from(select.querySelectorAll("option")).map(
      (o) => o.textContent,
    );
    // Placeholder + the single eligible doctor.
    expect(options).toContain("Select doctor");
    expect(options.some((o) => o?.includes("Omar Naguib"))).toBe(true);
    expect(options.some((o) => o?.includes("Reem"))).toBe(false);
    expect(options.some((o) => o?.includes("Me Self"))).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Remove assistant" }));
    expect(screen.getByText("No assistants added.")).toBeInTheDocument();
  });
});
