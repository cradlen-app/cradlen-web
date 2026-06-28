import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render";

const hoisted = vi.hoisted(() => ({
  lookup: { data: undefined as { data: Array<{ code: string; name: string }> } | undefined },
}));

vi.mock("@/features/settings/hooks/useSettingsLookups", () => ({
  useSpecialtiesLookup: () => hoisted.lookup,
}));

import { SpecialtiesSelect } from "./SpecialtiesSelect";

const specialties = [
  { code: "obgyn", name: "Obstetrics & Gynecology" },
  { code: "peds", name: "Pediatrics" },
];

describe("SpecialtiesSelect", () => {
  it("renders fetched specialties and lets one be selected", () => {
    hoisted.lookup = { data: { data: specialties } };
    const onChange = vi.fn();
    renderWithIntl(
      <SpecialtiesSelect value={[]} onChange={onChange} placeholder="Pick" />,
    );

    expect(screen.getByText("Pick")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByText("Pediatrics"));
    expect(onChange).toHaveBeenCalledWith(["peds"]);
  });

  it("renders selected specialties as labelled chips", () => {
    hoisted.lookup = { data: { data: specialties } };
    renderWithIntl(<SpecialtiesSelect value={["obgyn"]} onChange={() => {}} />);
    expect(screen.getByText("Obstetrics & Gynecology")).toBeInTheDocument();
  });

  it("shows a loading placeholder when the lookup has no data yet", () => {
    hoisted.lookup = { data: undefined };
    renderWithIntl(<SpecialtiesSelect value={[]} onChange={() => {}} />);
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(screen.getByText("…")).toBeInTheDocument();
  });

  it("deselects a checked specialty", () => {
    hoisted.lookup = { data: { data: specialties } };
    const onChange = vi.fn();
    renderWithIntl(
      <SpecialtiesSelect value={["obgyn", "peds"]} onChange={onChange} />,
    );
    fireEvent.click(screen.getAllByRole("button")[0]);
    fireEvent.click(screen.getByRole("button", { name: "Pediatrics" }));
    expect(onChange).toHaveBeenCalledWith(["obgyn"]);
  });
});
