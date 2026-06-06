"use client";

import { WelcomeHeader } from "./home/WelcomeHeader";
import { NextVisitCard } from "./home/NextVisitCard";
import { StatCards } from "./home/StatCards";
import { MedicationsPreview } from "./home/MedicationsPreview";

/**
 * Patient Home — a full-width, single-column stack ordered by what a patient
 * cares about: a brand greeting hero, the next upcoming visit, summary stat
 * cards, and active medications.
 */
export function HomeScreen() {
  return (
    <div className="w-full space-y-5 pb-24 lg:pb-0">
      <WelcomeHeader />
      <NextVisitCard />
      <StatCards />
      <MedicationsPreview />
    </div>
  );
}
