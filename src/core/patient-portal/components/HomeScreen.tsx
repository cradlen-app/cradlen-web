"use client";

import { WelcomeHeader } from "./home/WelcomeHeader";
import { StatCards } from "./home/StatCards";
import { MedicationsPreview } from "./home/MedicationsPreview";
import { PatientProfileCard } from "./home/PatientProfileCard";

/**
 * Patient Home — a two-column dashboard: welcome + stat cards + medications on
 * the left; a profile/vitals card with quick links in the right rail (stacks
 * below on mobile).
 */
export function HomeScreen() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <WelcomeHeader />
      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
          <StatCards />
          <MedicationsPreview />
        </div>
        <aside className="space-y-5">
          <PatientProfileCard />
        </aside>
      </div>
    </div>
  );
}
