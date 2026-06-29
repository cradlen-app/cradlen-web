import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";
import { makeCalendarEvent } from "./__fixtures__/calendarEvent";

const {
  useUserProfileContextMock,
  isOwnerMock,
  createMutateMock,
  updateMutateMock,
  toastSuccessMock,
  toastErrorMock,
} = vi.hoisted(() => ({
  useUserProfileContextMock: vi.fn(),
  isOwnerMock: vi.fn(),
  createMutateMock: vi.fn(),
  updateMutateMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
}));

vi.mock("@/features/auth/hooks/useUserProfileContext", () => ({
  useUserProfileContext: () => useUserProfileContextMock(),
}));

vi.mock("@/features/auth/lib/permissions", () => ({
  isOwner: (p: unknown) => isOwnerMock(p),
}));

vi.mock("../hooks/useCreateCalendarEvent", () => ({
  useCreateCalendarEvent: () => ({
    mutateAsync: createMutateMock,
    isPending: false,
  }),
}));

vi.mock("../hooks/useUpdateCalendarEvent", () => ({
  useUpdateCalendarEvent: () => ({
    mutateAsync: updateMutateMock,
    isPending: false,
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: toastSuccessMock, error: toastErrorMock },
}));

// The procedure sub-fields pull in many data hooks; stub them — they have their
// own coverage. We only verify the drawer mounts them for PROCEDURE events.
vi.mock("./NewEventTypeFields", () => ({
  ProcedureFields: () => <div data-testid="procedure-fields" />,
}));

import { NewEventDrawer } from "./NewEventDrawer";

function setDatetime(index: number, value: string) {
  const inputs = document.querySelectorAll<HTMLInputElement>(
    'input[type="datetime-local"]',
  );
  fireEvent.change(inputs[index], { target: { value } });
}

describe("NewEventDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUserProfileContextMock.mockReturnValue({ activeProfile: { branches: [] } });
    isOwnerMock.mockReturnValue(false);
    createMutateMock.mockResolvedValue({});
    updateMutateMock.mockResolvedValue({});
  });

  it("opens on the type picker step with all event-type cards", () => {
    renderWithIntl(
      <NewEventDrawer open onOpenChange={vi.fn()} />,
    );

    expect(screen.getByText("Choose event type")).toBeInTheDocument();
    expect(screen.getByText("Day off")).toBeInTheDocument();
    expect(screen.getByText("Procedure")).toBeInTheDocument();
    expect(screen.getByText("Meeting")).toBeInTheDocument();
  });

  it("advances to the form step via Next", () => {
    renderWithIntl(<NewEventDrawer open onOpenChange={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("Name *")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("mounts the procedure-specific fields when PROCEDURE is selected", () => {
    renderWithIntl(<NewEventDrawer open onOpenChange={vi.fn()} />);

    fireEvent.click(screen.getByText("Procedure"));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByTestId("procedure-fields")).toBeInTheDocument();
  });

  it("submits a create request with the entered values", async () => {
    renderWithIntl(<NewEventDrawer open onOpenChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    fireEvent.change(screen.getByPlaceholderText("Day off"), {
      target: { value: "Annual leave" },
    });
    setDatetime(0, "2026-07-01T08:00");
    setDatetime(1, "2026-07-01T09:00");

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(createMutateMock).toHaveBeenCalledWith(
        expect.objectContaining({ event_type: "DAY_OFF", title: "Annual leave" }),
      ),
    );
  });

  it("blocks submit and surfaces a validation error when the title is empty", async () => {
    renderWithIntl(<NewEventDrawer open onOpenChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    setDatetime(0, "2026-07-01T08:00");
    setDatetime(1, "2026-07-01T09:00");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(screen.getByText("Title is required")).toBeInTheDocument(),
    );
    expect(createMutateMock).not.toHaveBeenCalled();
  });

  it("opens directly in edit mode with the event prefilled", async () => {
    const event = makeCalendarEvent({
      id: "ev-9",
      type: "MEETING",
      title: "Board meeting",
      branchId: null,
    });

    renderWithIntl(
      <NewEventDrawer open onOpenChange={vi.fn()} event={event} />,
    );

    expect(screen.getByRole("heading", { name: "Edit event" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Board meeting")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() =>
      expect(updateMutateMock).toHaveBeenCalledWith(
        expect.objectContaining({ id: "ev-9" }),
      ),
    );
  });
});
