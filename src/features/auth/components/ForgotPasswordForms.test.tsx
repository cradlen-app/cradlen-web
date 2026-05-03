import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ApiError } from "@/lib/api";
import { renderWithIntl } from "@/test/render";
import { ForgotPasswordStartForm } from "./ForgotPasswordStartForm";
import { ForgotPasswordVerifyForm } from "./ForgotPasswordVerifyForm";
import { ForgotPasswordResetForm } from "./ForgotPasswordResetForm";

// ---------------------------------------------------------------------------
// Router mock
// ---------------------------------------------------------------------------

const mockRouter = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: React.ComponentProps<"a">) => (
    <a href={String(href)} {...props}>{children}</a>
  ),
  useRouter: () => mockRouter,
}));

// ---------------------------------------------------------------------------
// Session helpers mock (localStorage operations)
// ---------------------------------------------------------------------------

const mockSetPendingEmail = vi.hoisted(() => vi.fn());
const mockStartCooldown = vi.hoisted(() => vi.fn());
const mockGetPendingEmail = vi.hoisted(() => vi.fn(() => "user@example.com"));
const mockGetCooldown = vi.hoisted(() => vi.fn(() => 0));
const mockClearSession = vi.hoisted(() => vi.fn());

vi.mock("../lib/forgot-password-session", () => ({
  setPendingForgotPasswordEmail: mockSetPendingEmail,
  startForgotPasswordResendCooldown: mockStartCooldown,
  getPendingForgotPasswordEmail: mockGetPendingEmail,
  getForgotPasswordResendSecondsRemaining: mockGetCooldown,
  clearForgotPasswordSession: mockClearSession,
}));

// ---------------------------------------------------------------------------
// Mutation mocks
// ---------------------------------------------------------------------------

const mockStartMutateAsync = vi.hoisted(() => vi.fn());
const mockVerifyMutateAsync = vi.hoisted(() => vi.fn());
const mockResendMutate = vi.hoisted(() => vi.fn());
const mockResetMutateAsync = vi.hoisted(() => vi.fn());

vi.mock("../hooks/useForgotPassword", () => ({
  useStartForgotPassword: () => ({
    mutateAsync: mockStartMutateAsync,
    isPending: false,
  }),
  useVerifyForgotPasswordOtp: () => ({
    mutateAsync: mockVerifyMutateAsync,
    isPending: false,
  }),
  useResendForgotPasswordOtp: () => ({
    mutate: mockResendMutate,
    isPending: false,
  }),
  useResetForgotPassword: () => ({
    mutateAsync: mockResetMutateAsync,
    isPending: false,
  }),
}));

beforeEach(() => {
  mockRouter.push.mockClear();
  mockRouter.replace.mockClear();
  mockStartMutateAsync.mockReset();
  mockVerifyMutateAsync.mockReset();
  mockResendMutate.mockReset();
  mockResetMutateAsync.mockReset();
  mockClearSession.mockClear();
});

// ---------------------------------------------------------------------------
// ForgotPasswordStartForm
// ---------------------------------------------------------------------------

describe("ForgotPasswordStartForm", () => {
  it("shows enumeration-safe success and navigates to verify regardless of backend result", async () => {
    mockStartMutateAsync.mockResolvedValue({ data: { success: true }, meta: {} });

    renderWithIntl(<ForgotPasswordStartForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /send code/i }));

    await waitFor(() => {
      expect(screen.getByText(/if this email exists/i)).toBeInTheDocument();
    });
    expect(mockSetPendingEmail).toHaveBeenCalledWith("user@example.com");
    expect(mockStartCooldown).toHaveBeenCalled();
  });

  it("still navigates to verify even when the backend call throws", async () => {
    mockStartMutateAsync.mockRejectedValue(new ApiError(404, "not found"));

    renderWithIntl(<ForgotPasswordStartForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "ghost@example.com" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /send code/i }));

    await waitFor(() => {
      expect(screen.getByText(/if this email exists/i)).toBeInTheDocument();
    });
    expect(mockSetPendingEmail).toHaveBeenCalledWith("ghost@example.com");
  });
});

// ---------------------------------------------------------------------------
// ForgotPasswordVerifyForm
// ---------------------------------------------------------------------------

describe("ForgotPasswordVerifyForm", () => {
  it("navigates to reset page on successful verification", async () => {
    mockVerifyMutateAsync.mockResolvedValue({ data: { success: true }, meta: {} });

    renderWithIntl(<ForgotPasswordVerifyForm />);

    const inputs = screen.getAllByRole("textbox");
    inputs.forEach((input) => fireEvent.change(input, { target: { value: "1" } }));

    fireEvent.submit(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/forgot-password/reset");
    });
  });

  it("redirects to start when the route handler returns SESSION_EXPIRED (401)", async () => {
    mockVerifyMutateAsync.mockRejectedValue(
      new ApiError(401, "Session expired", { error: { code: "SESSION_EXPIRED" } }),
    );

    renderWithIntl(<ForgotPasswordVerifyForm />);

    const inputs = screen.getAllByRole("textbox");
    inputs.forEach((input) => fireEvent.change(input, { target: { value: "1" } }));

    fireEvent.submit(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith("/forgot-password");
    });
    expect(mockClearSession).toHaveBeenCalled();
  });

  it("shows invalid-code error for wrong code responses", async () => {
    mockVerifyMutateAsync.mockRejectedValue(
      new ApiError(400, "Invalid code", { error: { code: "INVALID_CODE" } }),
    );

    renderWithIntl(<ForgotPasswordVerifyForm />);

    const inputs = screen.getAllByRole("textbox");
    inputs.forEach((input) => fireEvent.change(input, { target: { value: "1" } }));

    fireEvent.submit(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid.*code|code.*invalid|incorrect/i)).toBeInTheDocument();
    });
  });

  it("shows try-again-later message when resend is rate-limited", async () => {
    mockResendMutate.mockImplementation((_data: unknown, { onError }: { onError: (e: ApiError) => void }) => {
      onError(new ApiError(429, "Too many requests", { error: { code: "TOO_MANY_REQUESTS" } }));
    });

    renderWithIntl(<ForgotPasswordVerifyForm />);

    fireEvent.click(screen.getByRole("button", { name: /resend/i }));

    await waitFor(() => {
      expect(screen.getByText(/try again later/i)).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// ForgotPasswordResetForm
// ---------------------------------------------------------------------------

describe("ForgotPasswordResetForm", () => {
  it("clears session and redirects to sign-in on successful password reset", async () => {
    mockResetMutateAsync.mockResolvedValue(undefined);

    renderWithIntl(<ForgotPasswordResetForm />);

    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: "NewSecure1!" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "NewSecure1!" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => {
      expect(mockClearSession).toHaveBeenCalled();
    });
  });

  it("shows session-expired UI when the route handler returns SESSION_EXPIRED", async () => {
    mockResetMutateAsync.mockRejectedValue(
      new ApiError(401, "Session expired", { error: { code: "SESSION_EXPIRED" } }),
    );

    renderWithIntl(<ForgotPasswordResetForm />);

    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: "NewSecure1!" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "NewSecure1!" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/start over|session expired/i)).toBeInTheDocument();
    });
    expect(mockClearSession).toHaveBeenCalled();
  });
});
