import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ApiError } from "@/infrastructure/http/api";
import { renderWithIntl } from "@/test/render";
import {
  getProfilesFromAuthResponse,
  resolveAuthRedirect,
} from "@/lib/auth/redirect";
import { classifySignInError, isInvalidSignInError } from "../lib/sign-in-errors";
import { getSafeRedirectPath } from "../lib/redirect";
import { SignInForm } from "./SignInForm";

const mockRouter = vi.hoisted(() => ({
  replace: vi.fn(),
}));
const mockSignIn = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: React.ComponentProps<"a">) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
  useRouter: () => mockRouter,
}));

vi.mock("../hooks/useSignIn", () => ({
  useSignIn: () => ({
    mutateAsync: mockSignIn,
    isError: false,
    error: null,
  }),
}));

vi.mock("../hooks/useSelectProfile", () => ({
  useSelectProfile: () => ({
    mutateAsync: vi.fn(),
  }),
}));

describe("getSafeRedirectPath", () => {
  it("allows same-origin absolute paths", () => {
    expect(getSafeRedirectPath("/staff?tab=invitations")).toBe(
      "/staff?tab=invitations",
    );
  });

  it("returns null for missing or unsafe redirect paths", () => {
    expect(getSafeRedirectPath(null)).toBeNull();
    expect(getSafeRedirectPath("https://example.com")).toBeNull();
    expect(getSafeRedirectPath("//example.com")).toBeNull();
  });
});

describe("isInvalidSignInError", () => {
  it("treats only 401 as invalid credentials (anti-enumeration)", () => {
    expect(isInvalidSignInError(new ApiError(401, "Unauthorized"))).toBe(true);
    expect(isInvalidSignInError(new ApiError(403, "Forbidden"))).toBe(false);
  });

  it("does not treat other failures as invalid credentials", () => {
    expect(isInvalidSignInError(new ApiError(500, "Server error"))).toBe(false);
    expect(isInvalidSignInError(new Error("Network error"))).toBe(false);
  });
});

describe("classifySignInError", () => {
  it("maps backend statuses to UX-distinct error kinds", () => {
    expect(classifySignInError(new ApiError(401, "Unauthorized"))).toBe(
      "invalidCredentials",
    );
    expect(classifySignInError(new ApiError(403, "Forbidden"))).toBe(
      "accountSuspended",
    );
    expect(classifySignInError(new ApiError(429, "Too many"))).toBe(
      "tooManyAttempts",
    );
    expect(classifySignInError(new ApiError(500, "Boom"))).toBe("serverError");
    expect(classifySignInError(new Error("network"))).toBe("serverError");
    expect(classifySignInError(null)).toBe(null);
  });
});

describe("sign-in auth redirect responses", () => {
  it("routes onboarding-required sign-in responses", () => {
    expect(
      resolveAuthRedirect({
        data: {
          type: "ONBOARDING_REQUIRED",
          step: "VERIFY_OTP",
        },
      }),
    ).toBe("/sign-up");
  });

  it("extracts profiles from normal sign-in responses", () => {
    const response = { data: { profiles: [{ id: "profile-1" }] } };

    expect(resolveAuthRedirect(response)).toBe("/select-profile");
    expect(getProfilesFromAuthResponse(response)).toEqual([{ id: "profile-1" }]);
  });
});

describe("SignInForm", () => {
  beforeEach(() => {
    mockRouter.replace.mockClear();
    mockSignIn.mockReset();
  });

  it("shows a fallback error when sign-in returns no selectable profiles", async () => {
    mockSignIn.mockResolvedValue({ data: { profiles: [] }, meta: {} });

    renderWithIntl(<SignInForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "person@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "Password1!" },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(
        screen.getByText("No profiles are available for this sign-in."),
      ).toBeInTheDocument();
    });
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});
