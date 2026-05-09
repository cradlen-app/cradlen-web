import type { ReactElement } from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderWithIntl } from "@/test/render";
import type { CurrentUser, UserRole } from "@/types/user.types";
import { apiAuthFetch } from "@/lib/api";
import { toast } from "sonner";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { SettingsPage } from "./SettingsPage";

function renderPage(): ReactElement {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsPage />
    </QueryClientProvider>
  );
}

vi.mock("@/features/auth/hooks/useCurrentUser", () => ({
  useCurrentUser: vi.fn(),
  CURRENT_USER_QUERY_KEY: ["currentUser"],
}));

vi.mock("@/lib/api", () => {
  class MockApiError extends Error {
    constructor(
      message: string,
      public status: number,
    ) {
      super(message);
    }
  }
  return {
    apiAuthFetch: vi.fn(),
    apiFetch: vi.fn(),
    ApiError: MockApiError,
  };
});

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  Link: ({ children, ...props }: { children: React.ReactNode }) => (
    <a {...props}>{children}</a>
  ),
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
        executive_title: null,
        engagement_type: "FULL_TIME",
        roles: [{ id: "role-1", name: role }],
        organization: {
          id: "org-1",
          name: "Cradlen Clinic",
          specialties: [
            { id: "s1", code: "OBGYN", name: "OB-GYN" },
          ],
          status: "ACTIVE",
        },
        branches: [
          {
            id: "branch-1",
            name: "Main",
            address: "123 Medical St",
            city: "Cairo",
            country: "Egypt",
            governorate: "Cairo",
            is_main: true,
          },
        ],
        specialties: [{ id: "s1", code: "OBGYN", name: "OB-GYN" }],
        job_functions: [],
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
    vi.mocked(apiAuthFetch).mockResolvedValue({ data: [] });
  });

  it("renders all owner tabs for an owner", () => {
    mockCurrentUser("owner");

    renderWithIntl(renderPage());

    expect(
      screen.getByRole("heading", { name: "Organization settings" }),
    ).toBeInTheDocument();
    // Owner-only tabs should be visible
    expect(screen.getByRole("button", { name: /Organization/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Branches/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Danger Zone/ })).toBeInTheDocument();
  });

  it("hides owner-only tabs for a doctor", () => {
    mockCurrentUser("doctor");

    renderWithIntl(renderPage());

    expect(screen.getByRole("button", { name: /Profile/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Account/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Organization/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Branches/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Danger Zone/ }),
    ).not.toBeInTheDocument();
  });

  it("shows the verified timestamp as localized date and time", () => {
    mockCurrentUser("owner");
    const rawTimestamp = "2026-01-01T00:00:00.000Z";
    const formattedTimestamp = new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(rawTimestamp));

    renderWithIntl(renderPage());

    expect(screen.queryByText(rawTimestamp)).not.toBeInTheDocument();
    expect(screen.getByText(formattedTimestamp)).toBeInTheDocument();
  });

  it("submits profile edits with new user-level fields to /profiles/:id", async () => {
    mockCurrentUser("owner");

    renderWithIntl(renderPage());
    fireEvent.click(screen.getByRole("button", { name: /Edit profile/ }));
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: "+201111111111" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save profile/ }));

    await waitFor(() => {
      expect(apiAuthFetch).toHaveBeenCalledWith(
        "/profiles/staff-1",
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining('"phone_number":"+201111111111"'),
        }),
      );
    });
    expect(toast.success).toHaveBeenCalledWith("Profile updated.");
  });

  it("submits organization edits with specialties[] (correct key) to /organizations/:id", async () => {
    mockCurrentUser("owner");

    renderWithIntl(renderPage());
    fireEvent.click(screen.getByRole("button", { name: /Organization/ }));
    fireEvent.click(screen.getByRole("button", { name: /Edit organization/ }));
    fireEvent.change(screen.getByLabelText(/Organization name/i), {
      target: { value: "Updated Clinic" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save organization/ }));

    await waitFor(() => {
      const call = vi.mocked(apiAuthFetch).mock.calls.find(
        ([url]) => url === "/organizations/org-1",
      );
      expect(call).toBeDefined();
      const [, init] = call!;
      expect(init).toMatchObject({ method: "PATCH" });
      const body = JSON.parse((init as { body: string }).body);
      expect(body.name).toBe("Updated Clinic");
      // Critical: must NOT use the legacy `specialities` key.
      expect(body).not.toHaveProperty("specialities");
    });
  });

  it("opens the typed-confirm dialog when deleting an organization", () => {
    mockCurrentUser("owner");

    renderWithIntl(renderPage());
    fireEvent.click(screen.getByRole("button", { name: /Danger Zone/ }));
    fireEvent.click(screen.getByRole("button", { name: /Delete organization/ }));

    // Typed-name confirmation must be displayed.
    expect(
      screen.getByText(/Type "Cradlen Clinic" to confirm/i),
    ).toBeInTheDocument();
  });
});
