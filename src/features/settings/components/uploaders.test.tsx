import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import type { UserProfile } from "@/common/types/user.types";
import type { SettingsT } from "./settings.utils";
import { OrganizationLogoUploader } from "./OrganizationLogoUploader";
import { StaffAvatarUploader } from "./StaffAvatarUploader";
import {
  useRemoveOrganizationLogo,
  useUploadOrganizationLogo,
} from "../hooks/useOrganizationLogo";
import {
  useRemoveProfileImage,
  useUploadProfileImage,
} from "../hooks/useProfileImage";

const { MockApiError } = vi.hoisted(() => {
  class MockApiError extends Error {
    public messages: string[];
    constructor(public status: number, message: string | string[]) {
      const messages = Array.isArray(message) ? message : [message];
      super(messages.join("\n"));
      this.messages = messages;
    }
  }
  return { MockApiError };
});

vi.mock("@/common/errors/api-error", () => ({ ApiError: MockApiError }));
vi.mock("@/infrastructure/http/api", () => ({ ApiError: MockApiError }));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

vi.mock("../hooks/useOrganizationLogo", () => ({
  useUploadOrganizationLogo: vi.fn(),
  useRemoveOrganizationLogo: vi.fn(),
}));

vi.mock("../hooks/useProfileImage", () => ({
  useUploadProfileImage: vi.fn(),
  useRemoveProfileImage: vi.fn(),
}));

// Stub the cropper: jsdom has no canvas/layout, so render a placeholder and
// immediately report a crop area on mount so the Save button becomes enabled.
vi.mock("react-easy-crop", async () => {
  const React = await import("react");
  function MockCropper({
    onCropComplete,
  }: {
    onCropComplete?: (a: unknown, b: unknown) => void;
  }) {
    const ref = React.useRef(onCropComplete);
    ref.current = onCropComplete;
    // Fire once on mount only — avoids re-running on the parent's re-render
    // (onCropComplete is a fresh inline closure each render).
    React.useEffect(() => {
      ref.current?.(null, { x: 0, y: 0, width: 100, height: 100 });
    }, []);
    return React.createElement("div", { "data-testid": "cropper" });
  }
  return { default: MockCropper };
});

// Stub the canvas crop util (jsdom cannot encode) — return a ready File.
vi.mock("../lib/cropImage", () => ({
  getCroppedFile: vi.fn(
    async () => new File(["cropped"], "cropped.webp", { type: "image/webp" }),
  ),
}));

/** Pick a file, wait for the crop modal Save button, then click it. */
async function pickAndSave(container: HTMLElement, file: File) {
  fireEvent.change(getFileInput(container), { target: { files: [file] } });
  const save = await screen.findByRole("button", { name: /imageCrop.save/ });
  await waitFor(() => expect(save).not.toBeDisabled());
  fireEvent.click(save);
}

// Identity translator: returns the key so assertions can match it directly.
const t = ((key: string) => key) as unknown as SettingsT;

type MutationStub = {
  mutate: ReturnType<typeof vi.fn>;
  isPending: boolean;
};

function stub(isPending = false): MutationStub {
  return { mutate: vi.fn(), isPending };
}

function pngFile(name = "logo.png", size = 1024): File {
  const file = new File(["data"], name, { type: "image/png" });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

function getFileInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

const upload = stub();
const remove = stub();

beforeEach(() => {
  vi.clearAllMocks();
  upload.mutate = vi.fn();
  upload.isPending = false;
  remove.mutate = vi.fn();
  remove.isPending = false;
  vi.mocked(useUploadOrganizationLogo).mockReturnValue(
    upload as unknown as ReturnType<typeof useUploadOrganizationLogo>,
  );
  vi.mocked(useRemoveOrganizationLogo).mockReturnValue(
    remove as unknown as ReturnType<typeof useRemoveOrganizationLogo>,
  );
  vi.mocked(useUploadProfileImage).mockReturnValue(
    upload as unknown as ReturnType<typeof useUploadProfileImage>,
  );
  vi.mocked(useRemoveProfileImage).mockReturnValue(
    remove as unknown as ReturnType<typeof useRemoveProfileImage>,
  );
});

const organization = {
  id: "org-1",
  name: "Cradlen Clinic",
} as UserProfile["organization"];

describe("OrganizationLogoUploader", () => {
  it("shows the add-logo button and a placeholder when no logo is set", () => {
    render(<OrganizationLogoUploader organization={organization} t={t} />);

    expect(screen.getByText("Cradlen Clinic")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /organization.addLogo/ }),
    ).toBeInTheDocument();
    // No remove button without an existing logo.
    expect(
      screen.queryByRole("button", { name: /organization.removeLogo/ }),
    ).not.toBeInTheDocument();
  });

  it("rejects an unsupported file type with a toast and does not upload", () => {
    const { container } = render(
      <OrganizationLogoUploader organization={organization} t={t} />,
    );

    const file = new File(["x"], "logo.gif", { type: "image/gif" });
    fireEvent.change(getFileInput(container), { target: { files: [file] } });

    expect(toast.error).toHaveBeenCalledWith("profile.imageTypeError");
    expect(upload.mutate).not.toHaveBeenCalled();
  });

  it("rejects a file that exceeds the size limit", () => {
    const { container } = render(
      <OrganizationLogoUploader organization={organization} t={t} />,
    );

    fireEvent.change(getFileInput(container), {
      target: { files: [pngFile("big.png", 6 * 1024 * 1024)] },
    });

    expect(toast.error).toHaveBeenCalledWith("profile.imageTooLarge");
    expect(upload.mutate).not.toHaveBeenCalled();
  });

  it("opens the crop modal on pick without uploading immediately", async () => {
    const { container } = render(
      <OrganizationLogoUploader organization={organization} t={t} />,
    );

    fireEvent.change(getFileInput(container), {
      target: { files: [pngFile()] },
    });

    // Crop dialog is shown and nothing is uploaded until the user saves.
    expect(
      await screen.findByRole("button", { name: /imageCrop.save/ }),
    ).toBeInTheDocument();
    expect(upload.mutate).not.toHaveBeenCalled();
  });

  it("uploads the cropped image and toasts success", async () => {
    upload.mutate = vi.fn((_file, opts) => opts?.onSuccess?.());
    const { container } = render(
      <OrganizationLogoUploader organization={organization} t={t} />,
    );

    await pickAndSave(container, pngFile());

    await waitFor(() => expect(upload.mutate).toHaveBeenCalledTimes(1));
    expect(toast.success).toHaveBeenCalledWith("organization.logoUpdated");
  });

  it("surfaces an ApiError message when the upload fails", async () => {
    upload.mutate = vi.fn((_file, opts) =>
      opts?.onError?.(new MockApiError(413, "Payload too large")),
    );
    const { container } = render(
      <OrganizationLogoUploader organization={organization} t={t} />,
    );

    await pickAndSave(container, pngFile());

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Payload too large"),
    );
  });

  it("renders the remove button when a logo exists and triggers removal", () => {
    remove.mutate = vi.fn((_arg, opts) => opts?.onSuccess?.());
    render(
      <OrganizationLogoUploader
        organization={
          { ...organization, logo_image_url: "https://x/logo.png" } as UserProfile["organization"]
        }
        t={t}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /organization.removeLogo/ }),
    );
    expect(remove.mutate).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith("organization.logoRemoved");
  });
});

describe("StaffAvatarUploader", () => {
  const profile = {
    staff_id: "staff-1",
    organization: { id: "org-1", name: "Clinic" },
  } as UserProfile;

  it("renders initials when there is no avatar image", () => {
    render(
      <StaffAvatarUploader profile={profile} displayName="Mona Amin" t={t} />,
    );

    expect(screen.getByText("Mona Amin")).toBeInTheDocument();
    expect(screen.getByText("MA")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /profile.addPhoto/ }),
    ).toBeInTheDocument();
  });

  it("rejects an unsupported avatar type", () => {
    const { container } = render(
      <StaffAvatarUploader profile={profile} displayName="Mona Amin" t={t} />,
    );

    fireEvent.change(getFileInput(container), {
      target: { files: [new File(["x"], "a.bmp", { type: "image/bmp" })] },
    });

    expect(toast.error).toHaveBeenCalledWith("profile.imageTypeError");
    expect(upload.mutate).not.toHaveBeenCalled();
  });

  it("uploads the cropped avatar and toasts success", async () => {
    upload.mutate = vi.fn((_file, opts) => opts?.onSuccess?.());
    const { container } = render(
      <StaffAvatarUploader profile={profile} displayName="Mona Amin" t={t} />,
    );

    await pickAndSave(container, pngFile("avatar.png"));

    await waitFor(() => expect(upload.mutate).toHaveBeenCalledTimes(1));
    expect(toast.success).toHaveBeenCalledWith("profile.imageUpdated");
  });

  it("falls back to the generic error when removal fails", () => {
    remove.mutate = vi.fn((_arg, opts) => opts?.onError?.(new Error("nope")));
    render(
      <StaffAvatarUploader
        profile={{ ...profile, profile_image_url: "https://x/a.png" } as UserProfile}
        displayName="Mona Amin"
        t={t}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /profile.removePhoto/ }));
    expect(toast.error).toHaveBeenCalledWith("profile.updateError");
  });
});
