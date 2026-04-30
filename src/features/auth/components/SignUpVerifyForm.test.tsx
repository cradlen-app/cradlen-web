import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import { SignUpVerifyForm } from "./SignUpVerifyForm";

const mockRouter = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));
const mockVerifyEmail = vi.hoisted(() => vi.fn());
const mockResendOtp = vi.hoisted(() => vi.fn());

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => mockRouter,
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
  });

  it("redirects without mounting the form when the signup token is missing", async () => {
    renderWithIntl(<SignUpVerifyForm />);

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith("/sign-up");
    });
    expect(screen.queryByLabelText("Verification code")).not.toBeInTheDocument();
  });

  it("renders the verification input with id and name when the signup token exists", async () => {
    window.localStorage.setItem("cradlen-signup-token", "signup-token");
    window.localStorage.setItem("cradlen-signup-email", "person@example.com");

    renderWithIntl(<SignUpVerifyForm />);

    const input = await screen.findByLabelText("Verification code");

    expect(input).toHaveAttribute("id", "verificationCode");
    expect(input).toHaveAttribute("name", "verificationCode");
    expect(screen.getByText(/person@example.com/)).toBeInTheDocument();
  });

  it("submits the verification code with the signup token", async () => {
    window.localStorage.setItem("cradlen-signup-token", "signup-token");

    renderWithIntl(<SignUpVerifyForm />);

    const input = await screen.findByLabelText("Verification code");
    fireEvent.change(input, { target: { value: "123456" } });
    fireEvent.submit(input.closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(mockVerifyEmail).toHaveBeenCalledWith({
        code: "123456",
        signup_token: "signup-token",
      });
    });
  });
});
