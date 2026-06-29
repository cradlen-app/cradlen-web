import { render, screen } from "@testing-library/react";

const FEATURES = [
  { title: "One identity", description: "A single national ID record" },
  { title: "Prescriptions", description: "See every active medication" },
  { title: "Lab results", description: "Results as soon as they're ready" },
];

vi.mock("next-intl/server", () => ({
  getTranslations: async () => {
    const t = ((key: string) => key) as unknown as {
      (key: string): string;
      raw: (key: string) => unknown;
    };
    t.raw = (key: string) => (key === "features" ? FEATURES : key);
    return t;
  },
}));

import PatientPortal from "./PatientPortal";

describe("PatientPortal", () => {
  it("renders the copy column heading and the raw feature list", async () => {
    render(await PatientPortal());

    expect(screen.getByText("eyebrow")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "heading" }),
    ).toBeInTheDocument();
    expect(screen.getByText("description")).toBeInTheDocument();

    for (const feature of FEATURES) {
      expect(screen.getByText(feature.title)).toBeInTheDocument();
      expect(screen.getByText(feature.description)).toBeInTheDocument();
    }
  });

  it("renders the phone mockup tab bar labels", async () => {
    render(await PatientPortal());

    for (const tab of [
      "phone.tabHome",
      "phone.tabVisits",
      "phone.tabMeds",
      "phone.tabTests",
      "phone.tabProfile",
    ]) {
      expect(screen.getByText(tab)).toBeInTheDocument();
    }

    // Welcome header + care card.
    expect(screen.getByText("phone.welcomeBack")).toBeInTheDocument();
    expect(screen.getByText("phone.careTitle")).toBeInTheDocument();
  });
});
