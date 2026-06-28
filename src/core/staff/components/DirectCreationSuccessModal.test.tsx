import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";
import DirectCreationSuccessModal from "./DirectCreationSuccessModal";

const credentials = { email: "staff@clinic.com", password: "secret-123" };

describe("DirectCreationSuccessModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing without credentials", () => {
    const { container } = renderWithIntl(
      <DirectCreationSuccessModal credentials={null} onClose={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the generated email and password", () => {
    renderWithIntl(
      <DirectCreationSuccessModal credentials={credentials} onClose={vi.fn()} />,
    );
    expect(screen.getByText("staff@clinic.com")).toBeInTheDocument();
    expect(screen.getByText("secret-123")).toBeInTheDocument();
  });

  it("gates the Done button behind the acknowledgement checkbox", () => {
    const onClose = vi.fn();
    renderWithIntl(
      <DirectCreationSuccessModal credentials={credentials} onClose={onClose} />,
    );

    const done = screen.getByRole("button", { name: "Done" });
    expect(done).toBeDisabled();

    fireEvent.click(screen.getByRole("checkbox"));
    expect(done).toBeEnabled();

    fireEvent.click(done);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("honors custom title and hint overrides", () => {
    renderWithIntl(
      <DirectCreationSuccessModal
        credentials={credentials}
        onClose={vi.fn()}
        title="Custom heading"
        hint="Custom hint"
      />,
    );
    expect(screen.getByText("Custom heading")).toBeInTheDocument();
    expect(screen.getByText("Custom hint")).toBeInTheDocument();
  });
});
