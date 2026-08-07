import { screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import { ApiError } from "@/infrastructure/http/api";

const {
  useProviderServicesMock,
  mutateAsyncMock,
  pushMock,
  toastErrorMock,
  toastSuccessMock,
  captureMock,
  profileState,
  authState,
} = vi.hoisted(() => ({
  useProviderServicesMock: vi.fn(),
  mutateAsyncMock: vi.fn(),
  pushMock: vi.fn(),
  toastErrorMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  captureMock: vi.fn(),
  profileState: {
    specialtyCode: "OBGYN" as string | null,
    isOwner: false,
  },
  authState: {
    organizationId: "org-1" as string | null,
    branchId: "branch-1" as string | null,
    profileId: "doctor-1" as string | null,
  },
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));
vi.mock("sonner", () => ({
  toast: { error: toastErrorMock, success: toastSuccessMock },
}));
vi.mock("@/core/financial/api", () => ({
  useProviderServices: (...a: unknown[]) => useProviderServicesMock(...a),
}));
vi.mock("@/features/auth/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({ data: { id: "u1" } }),
}));
vi.mock("@/features/auth/lib/current-user", () => ({
  getActiveProfile: () => ({
    id: "profile-1",
    specialty: profileState.specialtyCode
      ? { code: profileState.specialtyCode }
      : null,
  }),
}));
vi.mock("@/features/auth/lib/permissions", () => ({
  isOwner: () => profileState.isOwner,
}));
vi.mock("@/features/auth/store/authContextStore", () => ({
  useAuthContextStore: (selector: (s: typeof authState) => unknown) =>
    selector(authState),
}));
vi.mock("@/infrastructure/analytics/posthog", () => ({
  capture: (...a: unknown[]) => captureMock(...a),
}));
vi.mock("../hooks/useQuickStartVisit", () => ({
  useQuickStartVisit: () => ({
    mutateAsync: mutateAsyncMock,
    isPending: false,
  }),
}));

import { QuickStartVisitDialog } from "./QuickStartVisitDialog";

/** Two authorizations; the consultation is second alphabetically on purpose. */
const AUTHS = [
  {
    id: "a2",
    service_id: "svc-ultrasound",
    branch_id: null,
    is_active: true,
    service: {
      id: "svc-ultrasound",
      name: "Ultrasound",
      code: "US",
      service_type: "PROCEDURE",
    },
  },
  {
    id: "a1",
    service_id: "svc-consult",
    branch_id: "branch-1",
    is_active: true,
    service: {
      id: "svc-consult",
      name: "Consultation",
      code: "CONSULT",
      service_type: "CONSULTATION",
    },
  },
];

function renderDialog() {
  return renderWithIntl(
    <QuickStartVisitDialog
      open
      onOpenChange={() => {}}
      patientId="p1"
      patientName="Mona Amin"
    />,
  );
}

describe("QuickStartVisitDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profileState.specialtyCode = "OBGYN";
    profileState.isOwner = false;
    authState.organizationId = "org-1";
    authState.branchId = "branch-1";
    authState.profileId = "doctor-1";
    useProviderServicesMock.mockReturnValue({
      authorizations: AUTHS,
      isLoading: false,
    });
    mutateAsyncMock.mockResolvedValue({ data: { visit: { id: "visit-77" } } });
  });

  it("preselects the consultation service ahead of other authorizations", () => {
    renderDialog();
    expect(screen.getByRole("combobox")).toHaveValue("svc-consult");
  });

  it("submits a complete self-booking payload and opens the new visit", async () => {
    renderDialog();
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "  Severe headache  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Start visit" }));

    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledTimes(1));
    const payload = mutateAsyncMock.mock.calls[0][0];
    expect(payload).toMatchObject({
      visitor_type: "PATIENT",
      patient_id: "p1",
      specialty_code: "OBGYN",
      service_id: "svc-consult",
      assigned_doctor_id: "doctor-1",
      appointment_type: "VISIT",
      priority: "NORMAL",
      branch_id: "branch-1",
      chief_complaint: "Severe headache",
      start_now: true,
    });
    // Stamped at submit time, not dialog-open time.
    expect(Date.now() - new Date(payload.scheduled_at).getTime()).toBeLessThan(
      5000,
    );

    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith(
        "/org-1/branch-1/dashboard/visits/visit-77",
      ),
    );
    expect(captureMock).toHaveBeenCalledWith("visit_self_started", {
      visitId: "visit-77",
    });
    expect(toastSuccessMock).toHaveBeenCalled();
  });

  it("sends the doctor's own specialty, not the organization's first one", async () => {
    // The API matches specialty_code against the ASSIGNED DOCTOR's profile.
    profileState.specialtyCode = "PEDIATRICIAN";
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Start visit" }));

    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalled());
    expect(mutateAsyncMock.mock.calls[0][0].specialty_code).toBe(
      "PEDIATRICIAN",
    );
  });

  it("omits the complaint when left blank and honours the follow-up toggle", async () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Follow-up" }));
    fireEvent.click(screen.getByRole("button", { name: "Start visit" }));

    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalled());
    const payload = mutateAsyncMock.mock.calls[0][0];
    expect(payload.chief_complaint).toBeUndefined();
    expect(payload.appointment_type).toBe("FOLLOW_UP");
  });

  it("filters out services authorized only at another branch", () => {
    useProviderServicesMock.mockReturnValue({
      authorizations: [
        { ...AUTHS[0], branch_id: "branch-other" },
        { ...AUTHS[1], branch_id: "branch-other" },
      ],
      isLoading: false,
    });
    renderDialog();
    expect(
      screen.getByText(/not authorized for any billable service/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start visit" })).toBeDisabled();
  });

  it("blocks submission when the doctor has no authorized service", () => {
    useProviderServicesMock.mockReturnValue({
      authorizations: [],
      isLoading: false,
    });
    renderDialog();
    expect(screen.getByRole("button", { name: "Start visit" })).toBeDisabled();
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it("blocks submission when no branch is selected", () => {
    authState.branchId = null;
    renderDialog();
    expect(screen.getByText("Select a branch first.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start visit" })).toBeDisabled();
  });

  it("blocks submission when the doctor has no specialty", () => {
    profileState.specialtyCode = null;
    renderDialog();
    expect(
      screen.getByText("Your profile has no specialty set."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start visit" })).toBeDisabled();
  });

  it("offers to open the blocking visit when one is already open", async () => {
    mutateAsyncMock.mockRejectedValue(
      new ApiError(409, "conflict", {
        error: {
          code: "PATIENT_HAS_OPEN_VISIT",
          details: { visitId: "visit-existing" },
        },
      }),
    );
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Start visit" }));

    await waitFor(() => expect(toastErrorMock).toHaveBeenCalled());
    const [, opts] = toastErrorMock.mock.calls[0];
    expect(opts.action.label).toBe("Open it");
    opts.action.onClick();
    expect(pushMock).toHaveBeenCalledWith(
      "/org-1/branch-1/dashboard/visits/visit-existing",
    );
  });

  describe("journey allowance exhausted", () => {
    const allowanceError = new ApiError(403, "forbidden", {
      error: {
        code: "JOURNEY_ALLOWANCE_EXCEEDED",
        details: { remaining: 0, needed: 1, allowance: 50, consumed: 50 },
      },
    });

    it("points an owner at the subscription page", async () => {
      profileState.isOwner = true;
      mutateAsyncMock.mockRejectedValue(allowanceError);
      renderDialog();
      fireEvent.click(screen.getByRole("button", { name: "Start visit" }));

      await waitFor(() => expect(toastErrorMock).toHaveBeenCalled());
      const [, opts] = toastErrorMock.mock.calls[0];
      expect(opts.action.label).toBe("Manage subscription");
      opts.action.onClick();
      expect(pushMock).toHaveBeenCalledWith(
        "/org-1/branch-1/dashboard/settings/subscription",
      );
    });

    it("tells a plain doctor to ask the owner, with no purchase CTA", async () => {
      mutateAsyncMock.mockRejectedValue(allowanceError);
      renderDialog();
      fireEvent.click(screen.getByRole("button", { name: "Start visit" }));

      await waitFor(() => expect(toastErrorMock).toHaveBeenCalled());
      const [, opts] = toastErrorMock.mock.calls[0];
      expect(opts.action).toBeUndefined();
      expect(opts.description).toMatch(/ask your clinic owner/i);
    });
  });
});
