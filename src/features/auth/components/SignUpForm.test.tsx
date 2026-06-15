import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import { ApiError } from "@/infrastructure/http/api";
import { SignUpForm } from "./SignUpForm";

const mockRouter = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
const mockRegisterPersonal = vi.hoisted(() => vi.fn());
const mockApiFetch = vi.hoisted(() => vi.fn());

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => mockRouter,
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("@/hooks/useAuthRedirect", () => ({
  useAuthRedirect: () => ({ email: null, isChecking: false }),
}));

vi.mock("../hooks/useSignUp", () => ({
  useRegisterPersonal: () => ({
    isPending: false,
    mutateAsync: mockRegisterPersonal,
  }),
}));

vi.mock("@/infrastructure/http/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/infrastructure/http/api")>();
  return { ...actual, apiFetch: mockApiFetch };
});

function fillValidPersonalInfo() {
  fireEvent.change(document.getElementById("firstName") as HTMLInputElement, {
    target: { value: "Sara" },
  });
  fireEvent.change(document.getElementById("lastName") as HTMLInputElement, {
    target: { value: "Ali" },
  });
  fireEvent.change(document.getElementById("email") as HTMLInputElement, {
    target: { value: "sara@example.com" },
  });
  fireEvent.change(document.getElementById("password") as HTMLInputElement, {
    target: { value: "Password1!" },
  });
  fireEvent.change(
    document.getElementById("confirmPassword") as HTMLInputElement,
    { target: { value: "Password1!" } },
  );
}

function submit() {
  fireEvent.submit(
    document.getElementById("firstName")!.closest("form") as HTMLFormElement,
  );
}

const apiError = (status: number, fields: string[]) =>
  new ApiError(status, "conflict", {
    error: { details: { fields } },
  });

describe("SignUpForm", () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (k: string) => storage.get(k) ?? null,
        removeItem: (k: string) => storage.delete(k),
        setItem: (k: string, v: string) => storage.set(k, v),
      },
    });
    mockRouter.push.mockClear();
    mockRouter.replace.mockClear();
    mockRegisterPersonal.mockReset();
    mockApiFetch.mockReset();
  });

  it("advances to the verify step and stores the pending email on success", async () => {
    mockRegisterPersonal.mockResolvedValue({});
    renderWithIntl(<SignUpForm />);

    fillValidPersonalInfo();
    submit();

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith("/sign-up/verify"),
    );
    expect(storage.get("cradlen-signup-email")).toBe("sara@example.com");
  });

  it("shows the phone-taken message on a phone-only 409 without checking status or navigating", async () => {
    mockRegisterPersonal.mockRejectedValue(apiError(409, ["phone_number"]));
    renderWithIntl(<SignUpForm />);

    fillValidPersonalInfo();
    submit();

    expect(
      await screen.findByText(
        "A phone number matching this account already exists.",
      ),
    ).toBeInTheDocument();
    // Phone-only conflict short-circuits — no status lookup, no redirect.
    expect(mockApiFetch).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("on an email 409 with VERIFY_OTP status, resumes at the verify step", async () => {
    mockRegisterPersonal.mockRejectedValue(apiError(409, ["email"]));
    mockApiFetch.mockResolvedValue({ step: "VERIFY_OTP" });
    renderWithIntl(<SignUpForm />);

    fillValidPersonalInfo();
    submit();

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith("/sign-up/verify"),
    );
    expect(mockApiFetch).toHaveBeenCalledWith(
      expect.stringContaining("/auth/registration/status?email="),
    );
  });

  it("on an email 409 with DONE status, sends the user to sign-in", async () => {
    mockRegisterPersonal.mockRejectedValue(apiError(409, ["email"]));
    mockApiFetch.mockResolvedValue({ step: "DONE" });
    renderWithIntl(<SignUpForm />);

    fillValidPersonalInfo();
    submit();

    await waitFor(() =>
      expect(mockRouter.replace).toHaveBeenCalledWith(
        "/sign-in?notice=organization-exists",
      ),
    );
  });

  it("shows a generic server error on a non-409 failure", async () => {
    mockRegisterPersonal.mockRejectedValue(apiError(500, []));
    renderWithIntl(<SignUpForm />);

    fillValidPersonalInfo();
    submit();

    expect(
      await screen.findByText("Something went wrong. Please try again."),
    ).toBeInTheDocument();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});
