import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import { ApiError } from "@/infrastructure/http/api";
import { SignUpVerifyForm } from "./SignUpVerifyForm";

const mockRouter = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));
const mockVerifyEmail = vi.hoisted(() => vi.fn());
const mockResendOtp = vi.hoisted(() => vi.fn());
const mockUseRegistrationStatus = vi.hoisted(() => vi.fn());
const mockSetQueryData = vi.hoisted(() => vi.fn());

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => mockRouter,
}));

vi.mock("@/infrastructure/query/queryClient", () => ({
  queryClient: { setQueryData: mockSetQueryData },
}));

vi.mock("../hooks/useSignUp", () => ({
  useVerifyEmail: () => ({
    isPending: false,
    mutateAsync: mockVerifyEmail,
  }),
  useResendOtp: () => ({
    isPending: false,
    mutate: mockResendOtp,
  }),
  useRegistrationStatus: (email: string | null) => mockUseRegistrationStatus(email),
}));

describe("SignUpVerifyForm", () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        removeItem: (key: string) => storage.delete(key),
        setItem: (key: string, value: string) => storage.set(key, value),
      },
    });
    mockRouter.push.mockClear();
    mockRouter.replace.mockClear();
    mockVerifyEmail.mockReset();
    mockVerifyEmail.mockResolvedValue({});
    mockResendOtp.mockReset();
    mockSetQueryData.mockReset();
    mockUseRegistrationStatus.mockReset();
    mockUseRegistrationStatus.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: false,
    });
  });

  it("redirects without mounting the form when pending email is missing", async () => {
    renderWithIntl(<SignUpVerifyForm />);

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith("/sign-up");
    });
    expect(screen.queryByLabelText("Verification code")).not.toBeInTheDocument();
  });

  it("renders the verification input with id and name when status allows verification", async () => {
    window.localStorage.setItem("cradlen-signup-email", "person@example.com");
    mockUseRegistrationStatus.mockReturnValue({
      data: { step: "VERIFY_OTP" },
      error: null,
      isLoading: false,
    });

    renderWithIntl(<SignUpVerifyForm />);

    const input = await screen.findByLabelText("Verification code");

    expect(input).toHaveAttribute("id", "verificationCode");
    expect(input).toHaveAttribute("name", "verificationCode");
    expect(screen.getByText(/person@example.com/)).toBeInTheDocument();
  });

  it("submits only the verification code", async () => {
    window.localStorage.setItem("cradlen-signup-email", "person@example.com");
    mockUseRegistrationStatus.mockReturnValue({
      data: { step: "VERIFY_OTP" },
      error: null,
      isLoading: false,
    });

    renderWithIntl(<SignUpVerifyForm />);

    const input = await screen.findByLabelText("Verification code");
    fireEvent.change(input, { target: { value: "123456" } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(mockVerifyEmail).toHaveBeenCalledWith({
        code: "123456",
      });
    });
  });

  it("primes the registration-status cache and advances to the complete step on success", async () => {
    window.localStorage.setItem("cradlen-signup-email", "person@example.com");
    mockUseRegistrationStatus.mockReturnValue({
      data: { step: "VERIFY_OTP" },
      error: null,
      isLoading: false,
    });

    renderWithIntl(<SignUpVerifyForm />);

    const input = await screen.findByLabelText("Verification code");
    fireEvent.change(input, { target: { value: "123456" } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);

    // The cache must be updated so the complete page's guard doesn't read the stale
    // VERIFY_OTP value and bounce the user back here.
    await waitFor(() => {
      expect(mockSetQueryData).toHaveBeenCalledWith(
        ["registration-status", "person@example.com"],
        { step: "COMPLETE_ONBOARDING" },
      );
    });
    expect(mockRouter.replace).toHaveBeenCalledWith("/sign-up/complete");
  });

  // --- redirects driven by the registration status ---

  it("redirects to the complete step when the status says onboarding is pending", async () => {
    window.localStorage.setItem("cradlen-signup-email", "person@example.com");
    mockUseRegistrationStatus.mockReturnValue({
      data: { step: "COMPLETE_ONBOARDING" },
      error: null,
      isLoading: false,
    });

    renderWithIntl(<SignUpVerifyForm />);

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith("/sign-up/complete"),
    );
  });

  it("clears the session and returns to start when the status is DONE", async () => {
    window.localStorage.setItem("cradlen-signup-email", "person@example.com");
    mockUseRegistrationStatus.mockReturnValue({
      data: { step: "DONE" },
      error: null,
      isLoading: false,
    });

    renderWithIntl(<SignUpVerifyForm />);

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith("/sign-up"),
    );
    expect(storage.has("cradlen-signup-email")).toBe(false);
  });

  // --- verify error handling ---

  function renderMountedForm() {
    window.localStorage.setItem("cradlen-signup-email", "person@example.com");
    mockUseRegistrationStatus.mockReturnValue({
      data: { step: "VERIFY_OTP" },
      error: null,
      isLoading: false,
    });
    renderWithIntl(<SignUpVerifyForm />);
  }

  async function submitCode(code = "123456") {
    const input = await screen.findByLabelText("Verification code");
    fireEvent.change(input, { target: { value: code } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);
  }

  it("shows the expired-code message on a 400 CODE_EXPIRED error", async () => {
    mockVerifyEmail.mockRejectedValue(
      new ApiError(400, "expired", { error: { code: "CODE_EXPIRED" } }),
    );
    renderMountedForm();
    await submitCode("000000");

    expect(
      await screen.findByText("This code has expired. Request a new one below."),
    ).toBeInTheDocument();
  });

  it("shows the lockout message on a 400 MAX_ATTEMPTS_EXCEEDED error", async () => {
    mockVerifyEmail.mockRejectedValue(
      new ApiError(400, "locked", {
        error: { code: "MAX_ATTEMPTS_EXCEEDED" },
      }),
    );
    renderMountedForm();
    await submitCode("000000");

    expect(
      await screen.findByText(
        "Too many incorrect attempts. Please request a new code.",
      ),
    ).toBeInTheDocument();
  });

  it("shows the generic invalid-code message on an unclassified 400", async () => {
    mockVerifyEmail.mockRejectedValue(
      new ApiError(400, "bad", { error: { code: "INVALID_CODE" } }),
    );
    renderMountedForm();
    await submitCode("000000");

    expect(
      await screen.findByText("Invalid or expired verification code."),
    ).toBeInTheDocument();
  });

  it("renders the session-expired screen with a start-over action on a 401", async () => {
    mockVerifyEmail.mockRejectedValue(new ApiError(401, "expired session"));
    renderMountedForm();
    await submitCode();

    const startOver = await screen.findByText("Start registration again");
    expect(startOver).toBeInTheDocument();
    // The code input is gone — the user must restart.
    expect(
      screen.queryByLabelText("Verification code"),
    ).not.toBeInTheDocument();

    fireEvent.click(startOver);
    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith("/sign-up"),
    );
  });

  // --- resend handling ---

  it("surfaces a success message after a resend", async () => {
    mockResendOtp.mockImplementation(
      (_vars, opts: { onSuccess: () => void }) => opts.onSuccess(),
    );
    renderMountedForm();

    fireEvent.click(await screen.findByText("Resend code"));

    expect(
      await screen.findByText("A new code has been sent to your email."),
    ).toBeInTheDocument();
    expect(mockResendOtp).toHaveBeenCalledWith(
      { email: "person@example.com" },
      expect.any(Object),
    );
  });

  it("shows the resend-locked message on a 429 RESEND_LIMIT_EXCEEDED", async () => {
    mockResendOtp.mockImplementation(
      (_vars, opts: { onError: (e: unknown) => void }) =>
        opts.onError(
          new ApiError(429, "too many", {
            error: { code: "RESEND_LIMIT_EXCEEDED" },
          }),
        ),
    );
    renderMountedForm();

    fireEvent.click(await screen.findByText("Resend code"));

    expect(
      await screen.findByText(
        "You've requested too many codes. Try again in an hour.",
      ),
    ).toBeInTheDocument();
  });
});
