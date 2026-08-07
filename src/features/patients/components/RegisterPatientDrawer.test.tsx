import { screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";

const {
  registerMutateMock,
  isPendingRef,
  routerPushMock,
  patientSearchMock,
  fetchPatientIdentityMock,
  toastMock,
  quickStartProps,
} = vi.hoisted(() => ({
  registerMutateMock: vi.fn(),
  isPendingRef: { current: false },
  routerPushMock: vi.fn(),
  patientSearchMock: vi.fn(),
  fetchPatientIdentityMock: vi.fn(),
  toastMock: { success: vi.fn(), error: vi.fn() },
  quickStartProps: { current: null as null | Record<string, unknown> },
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: routerPushMock }),
}));
vi.mock("@/hooks/useDashboardPath", () => ({
  useDashboardPath: () => (path: string) => `/org-1/branch-1/dashboard${path}`,
}));
vi.mock("sonner", () => ({ toast: toastMock }));
vi.mock("../hooks/useRegisterPatient", () => ({
  useRegisterPatient: () => ({
    mutateAsync: registerMutateMock,
    get isPending() {
      return isPendingRef.current;
    },
  }),
}));
vi.mock("@/features/visits/hooks/usePatientSearch", () => ({
  usePatientSearch: (q: string) => patientSearchMock(q),
}));
vi.mock("@/features/visits/lib/visits.api", () => ({
  fetchPatientIdentity: (id: string) => fetchPatientIdentityMock(id),
}));
vi.mock("@/features/visits/components/QuickStartVisitDialog", () => ({
  QuickStartVisitDialog: (props: Record<string, unknown>) => {
    quickStartProps.current = props;
    return <div data-testid="quick-start" />;
  },
}));

import { ApiError } from "@/common/errors/api-error";
import { RegisterPatientDrawer } from "./RegisterPatientDrawer";

const NEW_PATIENT = {
  id: "patient-new",
  full_name: "Sara Ali",
  national_id: "12345678",
};

function renderDrawer() {
  return renderWithIntl(
    <RegisterPatientDrawer open onOpenChange={vi.fn()} />,
  );
}

function fillValidForm() {
  fireEvent.change(screen.getByLabelText("Full name"), {
    target: { value: "Sara Ali" },
  });
  fireEvent.change(screen.getByLabelText("National ID"), {
    target: { value: "12345678" },
  });
  fireEvent.change(screen.getByLabelText("Date of birth"), {
    target: { value: "1990-01-01" },
  });
  fireEvent.change(screen.getByLabelText("Phone number"), {
    target: { value: "01012345678" },
  });
  fireEvent.change(screen.getByLabelText("Address"), {
    target: { value: "Cairo" },
  });
}

describe("RegisterPatientDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isPendingRef.current = false;
    quickStartProps.current = null;
    patientSearchMock.mockReturnValue({ data: [], isFetching: false });
    registerMutateMock.mockResolvedValue({
      data: { patient: NEW_PATIENT, journey: { id: "journey-1" } },
    });
  });

  it("posts the create shape and does not start a visit on Save", async () => {
    renderDrawer();
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(registerMutateMock).toHaveBeenCalled());
    expect(registerMutateMock).toHaveBeenCalledWith({
      full_name: "Sara Ali",
      national_id: "12345678",
      date_of_birth: "1990-01-01",
      phone_number: "01012345678",
      address: "Cairo",
      marital_status: "UNKNOWN",
    });
    expect(screen.queryByTestId("quick-start")).not.toBeInTheDocument();
  });

  it("hands the new patient to the quick-start dialog on Save & start visit", async () => {
    renderDrawer();
    fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: /Save & start visit/ }));

    await waitFor(() =>
      expect(screen.getByTestId("quick-start")).toBeInTheDocument(),
    );
    expect(quickStartProps.current).toMatchObject({
      patientId: "patient-new",
      patientName: "Sara Ali",
      open: true,
    });
  });

  it("validates before firing a request", async () => {
    renderDrawer();
    fireEvent.change(screen.getByLabelText("Full name"), {
      target: { value: "Sara Ali" },
    });
    // National id left blank — must be caught client-side.
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(registerMutateMock).not.toHaveBeenCalled();
    expect(toastMock.error).toHaveBeenCalledWith(
      "National ID must be 8–20 digits.",
    );
  });

  it("rejects a non-numeric national id", () => {
    renderDrawer();
    fillValidForm();
    fireEvent.change(screen.getByLabelText("National ID"), {
      target: { value: "abc12345" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(registerMutateMock).not.toHaveBeenCalled();
  });

  describe("search-first name field", () => {
    beforeEach(() => {
      patientSearchMock.mockReturnValue({
        data: [{ id: "patient-existing", fullName: "Mona Adel", phoneLast3: "678" }],
        isFetching: false,
      });
      fetchPatientIdentityMock.mockResolvedValue({
        id: "patient-existing",
        full_name: "Mona Adel",
        national_id: "87654321",
        date_of_birth: "1988-05-05T00:00:00.000Z",
        phone_number: "01099999999",
        address: "Giza",
        marital_status: "MARRIED",
      });
    });

    it("prefills and locks identity when an existing patient is picked", async () => {
      renderDrawer();
      const name = screen.getByLabelText("Full name");
      fireEvent.focus(name);
      fireEvent.change(name, { target: { value: "Mona" } });

      fireEvent.mouseDown(screen.getByRole("button", { name: /Mona Adel/ }));

      await waitFor(() =>
        expect(screen.getByLabelText("National ID")).toHaveValue("87654321"),
      );
      // national_id is the global identity key — correcting it is manager-only,
      // so it must not be editable from registration.
      expect(screen.getByLabelText("National ID")).toBeDisabled();
      expect(screen.getByLabelText("Address")).toHaveValue("Giza");
      expect(screen.getByLabelText("Date of birth")).toHaveValue("1988-05-05");
    });

    it("posts the link shape, not demographics, for a picked patient", async () => {
      renderDrawer();
      const name = screen.getByLabelText("Full name");
      fireEvent.focus(name);
      fireEvent.change(name, { target: { value: "Mona" } });
      fireEvent.mouseDown(screen.getByRole("button", { name: /Mona Adel/ }));

      await waitFor(() => expect(fetchPatientIdentityMock).toHaveBeenCalled());
      fireEvent.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => expect(registerMutateMock).toHaveBeenCalled());
      expect(registerMutateMock).toHaveBeenCalledWith({
        patient_id: "patient-existing",
        marital_status: "MARRIED",
      });
    });

    it("still links the patient when the identity reveal fails", async () => {
      // The reveal endpoint is throttled; a failure must not lose the link.
      fetchPatientIdentityMock.mockRejectedValue(new Error("429"));
      renderDrawer();
      const name = screen.getByLabelText("Full name");
      fireEvent.focus(name);
      fireEvent.change(name, { target: { value: "Mona" } });
      fireEvent.mouseDown(screen.getByRole("button", { name: /Mona Adel/ }));

      await waitFor(() => expect(toastMock.error).toHaveBeenCalled());
      fireEvent.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => expect(registerMutateMock).toHaveBeenCalled());
      expect(registerMutateMock).toHaveBeenCalledWith(
        expect.objectContaining({ patient_id: "patient-existing" }),
      );
    });

    it("unlocks and reverts to create when the link is cleared", async () => {
      renderDrawer();
      const name = screen.getByLabelText("Full name");
      fireEvent.focus(name);
      fireEvent.change(name, { target: { value: "Mona" } });
      fireEvent.mouseDown(screen.getByRole("button", { name: /Mona Adel/ }));

      await waitFor(() =>
        expect(screen.getByTestId("linked-patient")).toBeInTheDocument(),
      );
      fireEvent.click(
        screen.getByRole("button", { name: "Unlink this patient" }),
      );

      expect(screen.getByLabelText("National ID")).not.toBeDisabled();
      expect(screen.getByLabelText("National ID")).toHaveValue("");
    });
  });

  describe("duplicate national id", () => {
    function conflict(details?: Record<string, unknown>) {
      return new ApiError(409, "Conflict", {
        error: { code: "PATIENT_ALREADY_EXISTS", details },
      });
    }

    it("offers to open the colliding patient when the API names it", async () => {
      registerMutateMock.mockRejectedValue(
        conflict({ patientId: "patient-dupe" }),
      );
      renderDrawer();
      fillValidForm();
      fireEvent.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => expect(toastMock.error).toHaveBeenCalled());
      const opts = toastMock.error.mock.calls.at(-1)?.[1] as {
        action?: { onClick: () => void };
      };
      expect(opts.action).toBeDefined();
      opts.action!.onClick();
      expect(routerPushMock).toHaveBeenCalledWith(
        "/org-1/branch-1/dashboard/patients/patient-dupe",
      );
    });

    it("omits the jump when the API did not name the patient", async () => {
      // Patient is a global index — the collision may belong to another clinic
      // and 404 for this caller.
      registerMutateMock.mockRejectedValue(conflict());
      renderDrawer();
      fillValidForm();
      fireEvent.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => expect(toastMock.error).toHaveBeenCalled());
      const opts = toastMock.error.mock.calls.at(-1)?.[1] as {
        action?: unknown;
      };
      expect(opts.action).toBeUndefined();
    });
  });
});
