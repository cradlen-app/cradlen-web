import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent } from "@testing-library/react";
import { renderWithIntl } from "@/test/render";
import { toast } from "sonner";
import { ProofUploader } from "./ProofUploader";
import { useUploadProof } from "../hooks/useSubscription";

const mutate = vi.fn();

vi.mock("../hooks/useSubscription", () => ({
  useUploadProof: vi.fn(() => ({ mutate, isPending: false })),
}));
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

function fileInput(container: HTMLElement) {
  return container.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
}

describe("ProofUploader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUploadProof).mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useUploadProof>);
  });

  it("rejects a disallowed file type and does not upload", () => {
    const { container } = renderWithIntl(
      <ProofUploader organizationId="org-1" paymentId="pay-1" />,
    );
    const bad = new File(["x"], "note.txt", { type: "text/plain" });
    fireEvent.change(fileInput(container), { target: { files: [bad] } });

    expect(toast.error).toHaveBeenCalled();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("rejects a file over the size limit and does not upload", () => {
    const { container } = renderWithIntl(
      <ProofUploader organizationId="org-1" paymentId="pay-1" />,
    );
    const big = new File(["x"], "big.png", { type: "image/png" });
    Object.defineProperty(big, "size", { value: 20 * 1024 * 1024 });
    fireEvent.change(fileInput(container), { target: { files: [big] } });

    expect(toast.error).toHaveBeenCalled();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("uploads a valid image file", () => {
    const { container } = renderWithIntl(
      <ProofUploader organizationId="org-1" paymentId="pay-1" />,
    );
    const good = new File(["x"], "receipt.png", { type: "image/png" });
    fireEvent.change(fileInput(container), { target: { files: [good] } });

    expect(mutate).toHaveBeenCalledWith(good, expect.any(Object));
    expect(toast.error).not.toHaveBeenCalled();
  });
});
