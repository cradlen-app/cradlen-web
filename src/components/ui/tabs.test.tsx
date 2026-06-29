import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";

function Fixture({
  value,
  onValueChange,
}: {
  value?: string;
  onValueChange?: (v: string) => void;
}) {
  return (
    <Tabs defaultValue="one" value={value} onValueChange={onValueChange}>
      <TabsList aria-label="Sections">
        <TabsTrigger value="one">One</TabsTrigger>
        <TabsTrigger value="two">Two</TabsTrigger>
        <TabsTrigger value="three" disabled>
          Three
        </TabsTrigger>
      </TabsList>
      <TabsContent value="one">Panel One</TabsContent>
      <TabsContent value="two">Panel Two</TabsContent>
      <TabsContent value="three" forceMount>
        Panel Three
      </TabsContent>
    </Tabs>
  );
}

describe("Tabs", () => {
  it("shows the default panel and marks its trigger selected", () => {
    render(<Fixture />);
    expect(screen.getByText("Panel One")).toBeInTheDocument();
    expect(screen.queryByText("Panel Two")).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "One" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("switches panels on trigger click", () => {
    render(<Fixture />);
    fireEvent.click(screen.getByRole("tab", { name: "Two" }));
    expect(screen.getByText("Panel Two")).toBeInTheDocument();
    expect(screen.queryByText("Panel One")).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Two" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("moves selection with ArrowRight / ArrowLeft and wraps around", () => {
    render(<Fixture />);
    const first = screen.getByRole("tab", { name: "One" });
    first.focus();
    fireEvent.keyDown(first, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Two" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("jumps to the last and first tab with End / Home", () => {
    render(<Fixture />);
    const first = screen.getByRole("tab", { name: "One" });
    first.focus();
    fireEvent.keyDown(first, { key: "End" });
    expect(screen.getByRole("tab", { name: "Three" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    fireEvent.keyDown(screen.getByRole("tab", { name: "Three" }), { key: "Home" });
    expect(screen.getByRole("tab", { name: "One" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("keeps a forceMount panel mounted but hidden while inactive", () => {
    render(<Fixture />);
    const hidden = screen.getByText("Panel Three");
    expect(hidden).toBeInTheDocument();
    expect(hidden).toHaveAttribute("hidden");
  });

  it("does not update internal state in controlled mode but still calls onValueChange", () => {
    const onValueChange = vi.fn();
    render(<Fixture value="one" onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "Two" }));
    expect(onValueChange).toHaveBeenCalledWith("two");
    // Controlled value stays "one" since the parent did not update it.
    expect(screen.getByText("Panel One")).toBeInTheDocument();
  });

  it("throws when a trigger is rendered outside Tabs", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<TabsTrigger value="x">X</TabsTrigger>)).toThrow(
      /must be used inside/,
    );
    spy.mockRestore();
  });
});
