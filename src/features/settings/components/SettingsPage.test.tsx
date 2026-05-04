import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import type { CurrentUser, UserRole } from "@/types/user.types";
import { apiAuthFetch } from "@/lib/api";
import { toast } from "sonner";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { SettingsPage } from "./SettingsPage";

vi.mock("@/features/auth/hooks/useCurrentUser", () => ({
  useCurrentUser: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  apiAuthFetch: vi.fn(),
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

function createCurrentUser(role: UserRole): CurrentUser {
  return {
    id: "user-1",
    first_name: "Mona",
    last_name: "Amin",
    email: "mona@example.com",
    phone_number: "+201000000000",
    is_active: true,
    verified_at: "2026-01-01T00:00:00.000Z",
    created_at: "2026-01-01T00:00:00.000Z",
    profiles: [
      {
        staff_id: "staff-1",
        job_title: "Clinic owner",
        roles: [{ id: "role-1", name: role }],
        organization: {
          id: "org-1",
          name: "Cradlen Clinic",
          specialities: ["Cardiology", "Pediatrics"],
          status: "active",
        },
        branches: [
          {
            id: "branch-1",
            address: "123 Medical St",
            city: "Cairo",
            country: "Egypt",
            governorate: "Cairo",
            is_main: true,
          },
        ],
      },
    ],
  };
}

function mockCurrentUser(role: UserRole) {
  vi.mocked(useCurrentUser).mockReturnValue({
    data: createCurrentUser(role),
    isError: false,
    isLoading: false,
  } as ReturnType<typeof useCurrentUser>);
}

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiAuthFetch).mockResolvedValue({});
  });

  it("renders organization settings for an owner", () => {
    mockCurrentUser("owner");

    renderWithIntl(<SettingsPage />);

    expect(screen.getByRole("heading", { name: "Organization settings" })).toBeInTheDocument();
    expect(screen.getByText("+201000000000")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Organization/ }));
    expect(screen.getAllByText("Cradlen Clinic").length).toBeGreaterThan(0);
    expect(screen.getByText("Owner")).toBeInTheDocument();
  });

  it("renders organization settings for a doctor", () => {
    mockCurrentUser("doctor");

    renderWithIntl(<SettingsPage />);

    expect(screen.getByRole("heading", { name: "Organization settings" })).toBeInTheDocument();
    expect(screen.getAllByText("Doctor").length).toBeGreaterThan(0);
  });

  it("shows the verified timestamp as localized date and time", () => {
    mockCurrentUser("owner");
    const rawTimestamp = "2026-01-01T00:00:00.000Z";
    const formattedTimestamp = new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(rawTimestamp));

    renderWithIntl(<SettingsPage />);

    expect(screen.queryByText(rawTimestamp)).not.toBeInTheDocument();
    expect(screen.getByText(formattedTimestamp)).toBeInTheDocument();
  });

  it("validates required organization fields before calling the backend", () => {
    mockCurrentUser("owner");

    renderWithIntl(<SettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /Organization/ }));
    fireEvent.click(screen.getByRole("button", { name: /Add organization/ }));
    fireEvent.click(screen.getAllByRole("button", { name: /Add organization/ }).at(-1)!);

    expect(toast.error).toHaveBeenCalledWith("Please complete all required fields.");
    expect(apiAuthFetch).not.toHaveBeenCalled();
  });

  it("submits branch creation through the backend proxy", async () => {
    mockCurrentUser("doctor");

    renderWithIntl(<SettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /Branches/ }));
    fireEvent.click(screen.getByRole("button", { name: /Add branch/ }));
    fireEvent.change(screen.getByLabelText("Country"), { target: { value: "Egypt" } });
    fireEvent.change(screen.getByLabelText("City"), { target: { value: "Cairo" } });
    fireEvent.change(screen.getByLabelText("Governorate"), { target: { value: "Cairo" } });
    fireEvent.change(screen.getByLabelText("Address"), { target: { value: "456 Clinic Ave" } });
    fireEvent.click(screen.getAllByRole("button", { name: /Add branch/ }).at(-1)!);

    await waitFor(() => {
      expect(apiAuthFetch).toHaveBeenCalledWith("/owner/branches", {
        method: "POST",
        body: JSON.stringify({
          organization_id: "org-1",
          country: "Egypt",
          city: "Cairo",
          governorate: "Cairo",
          address: "456 Clinic Ave",
          is_main: false,
        }),
      });
    });
    expect(toast.success).toHaveBeenCalledWith("Branch created.");
  });

  it("submits organization edits through the backend proxy", async () => {
    mockCurrentUser("owner");

    renderWithIntl(<SettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /Organization/ }));
    fireEvent.click(screen.getByRole("button", { name: /Edit organization/ }));
    fireEvent.change(screen.getByLabelText("Organization name"), {
      target: { value: "Updated Clinic" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save organization/ }));

    await waitFor(() => {
      expect(apiAuthFetch).toHaveBeenCalledWith("/owner/organizations/org-1", {
        method: "PATCH",
        body: JSON.stringify({
          name: "Updated Clinic",
          specialities: ["Cardiology", "Pediatrics"],
        }),
      });
    });
    expect(toast.success).toHaveBeenCalledWith("Organization updated.");
  });

  it("submits profile edits with the phone number", async () => {
    mockCurrentUser("owner");

    renderWithIntl(<SettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /Edit profile/ }));
    fireEvent.change(screen.getByLabelText("Phone"), {
      target: { value: "+201111111111" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save profile/ }));

    await waitFor(() => {
      expect(apiAuthFetch).toHaveBeenCalledWith("/profiles/staff-1", {
        method: "PATCH",
        body: JSON.stringify({
          first_name: "Mona",
          last_name: "Amin",
          job_title: "Clinic owner",
          phone_number: "+201111111111",
        }),
      });
    });
    expect(toast.success).toHaveBeenCalledWith("Profile updated.");
  });

  it("confirms branch delete through the backend proxy", async () => {
    mockCurrentUser("doctor");

    renderWithIntl(<SettingsPage />);
    fireEvent.click(screen.getByRole("button", { name: /Branches/ }));
    fireEvent.click(screen.getByRole("button", { name: /Delete branch/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Soft delete$/ }));

    await waitFor(() => {
      expect(apiAuthFetch).toHaveBeenCalledWith(
        "/owner/branches/branch-1?organization_id=org-1",
        { method: "DELETE" },
      );
    });
    expect(toast.success).toHaveBeenCalledWith("Branch deleted.");
  });
});
