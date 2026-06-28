import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Button, buttonVariants } from "./button";

describe("Button", () => {
  it("renders a native button by default and forwards clicks", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    const btn = screen.getByRole("button", { name: "Save" });
    expect(btn.tagName).toBe("BUTTON");
    expect(btn).toHaveAttribute("data-slot", "button");
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("reflects the variant and size via data attributes", () => {
    render(
      <Button variant="destructive" size="sm">
        Delete
      </Button>,
    );
    const btn = screen.getByRole("button", { name: "Delete" });
    expect(btn).toHaveAttribute("data-variant", "destructive");
    expect(btn).toHaveAttribute("data-size", "sm");
  });

  it("renders as the child element when asChild is set (Slot)", () => {
    render(
      <Button asChild>
        <a href="/go">Go</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Go" });
    expect(link).toHaveAttribute("href", "/go");
    expect(link).toHaveAttribute("data-slot", "button");
  });

  it("merges custom className through buttonVariants", () => {
    render(<Button className="my-custom">X</Button>);
    expect(screen.getByRole("button", { name: "X" })).toHaveClass("my-custom");
  });

  it("buttonVariants produces variant-specific classes", () => {
    const outline = buttonVariants({ variant: "outline" });
    const def = buttonVariants({ variant: "default" });
    expect(outline).not.toBe(def);
    expect(typeof outline).toBe("string");
  });
});
