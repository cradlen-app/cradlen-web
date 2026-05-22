import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CasePathInput } from "./CasePathInput";
import type { FieldInputProps } from "@/builder/fields/input-props";
import * as carePathsApi from "@/features/care-paths/lib/care-paths.api";

const MOCK_CARE_PATHS = [
  { id: "1", code: "OBGYN_GENERAL", name: "General GYN", order: 1, description: null, specialty_id: "s1", organization_id: null, is_system: true, parent_id: null, episodes: [] },
  { id: "2", code: "OBGYN_PREGNANCY", name: "Pregnancy", order: 2, description: null, specialty_id: "s1", organization_id: null, is_system: true, parent_id: null, episodes: [] },
  { id: "3", code: "OBGYN_SURGICAL", name: "Surgical", order: 3, description: null, specialty_id: "s1", organization_id: null, is_system: true, parent_id: null, episodes: [] },
  { id: "4", code: "OBGYN_INFERTILITY", name: "Infertility", order: 4, description: null, specialty_id: "s1", organization_id: null, is_system: true, parent_id: null, episodes: [] },
];

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

function makeProps(value: string | null, onChange = vi.fn()): FieldInputProps {
  return {
    field: {
      id: "f1",
      code: "case_path",
      label: "Case path",
      type: "SELECT",
      binding: { namespace: "VISIT_ENCOUNTER", path: "case_path" },
      config: {
        ui: { variant: "case-path", specialtyCode: "OBGYN" },
        validation: { options: [] },
        logic: {},
      },
      colSpan: 12,
      order: 1,
      required: false,
      is_deleted: false,
    } as unknown as FieldInputProps["field"],
    value,
    onChange,
    required: false,
    disabled: false,
  };
}

beforeEach(() => {
  vi.spyOn(carePathsApi, "fetchCarePaths").mockResolvedValue(MOCK_CARE_PATHS);
});

describe("CasePathInput", () => {
  it("renders a tab for each care path from the API", async () => {
    render(<CasePathInput {...makeProps("OBGYN_GENERAL")} />, { wrapper });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "General GYN" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Pregnancy" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Surgical" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Infertility" })).toBeInTheDocument();
    });
  });

  it("marks the current value tab as active (aria-pressed=true)", async () => {
    render(<CasePathInput {...makeProps("OBGYN_GENERAL")} />, { wrapper });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "General GYN" })).toHaveAttribute("aria-pressed", "true")
    );
    expect(screen.getByRole("button", { name: "Pregnancy" })).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onChange with code when clicking an implemented path", async () => {
    const onChange = vi.fn();
    render(<CasePathInput {...makeProps("OBGYN_PREGNANCY", onChange)} />, { wrapper });
    await waitFor(() => screen.getByRole("button", { name: "General GYN" }));
    fireEvent.click(screen.getByRole("button", { name: "General GYN" }));
    expect(onChange).toHaveBeenCalledWith("OBGYN_GENERAL");
  });

  it("does NOT call onChange when clicking the already-active tab", async () => {
    const onChange = vi.fn();
    render(<CasePathInput {...makeProps("OBGYN_GENERAL", onChange)} />, { wrapper });
    await waitFor(() => screen.getByRole("button", { name: "General GYN" }));
    fireEvent.click(screen.getByRole("button", { name: "General GYN" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("opens coming-soon dialog when clicking Pregnancy", async () => {
    render(<CasePathInput {...makeProps("OBGYN_GENERAL")} />, { wrapper });
    await waitFor(() => screen.getByRole("button", { name: "Pregnancy" }));
    fireEvent.click(screen.getByRole("button", { name: "Pregnancy" }));
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });

  it("opens coming-soon dialog when clicking Surgical", async () => {
    render(<CasePathInput {...makeProps("OBGYN_GENERAL")} />, { wrapper });
    await waitFor(() => screen.getByRole("button", { name: "Surgical" }));
    fireEvent.click(screen.getByRole("button", { name: "Surgical" }));
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });

  it("opens coming-soon dialog when clicking Infertility", async () => {
    render(<CasePathInput {...makeProps("OBGYN_GENERAL")} />, { wrapper });
    await waitFor(() => screen.getByRole("button", { name: "Infertility" }));
    fireEvent.click(screen.getByRole("button", { name: "Infertility" }));
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });

  it("does NOT call onChange when a coming-soon dialog is dismissed", async () => {
    const onChange = vi.fn();
    render(<CasePathInput {...makeProps("OBGYN_GENERAL", onChange)} />, { wrapper });
    await waitFor(() => screen.getByRole("button", { name: "Pregnancy" }));
    fireEvent.click(screen.getByRole("button", { name: "Pregnancy" }));
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
