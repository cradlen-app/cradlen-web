import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Holds the active patient profile (self or a dependent) the portal is
 * currently viewing. Separate from the staff `authContextStore` — a patient is
 * not bound to an org/branch. All portal hooks read `activeProfileId` to scope
 * their queries.
 *
 * Defaults to the account holder ("pat-self") in this mock phase.
 */
type PatientProfileState = {
  activeProfileId: string;
  setActiveProfile: (id: string) => void;
};

export const DEFAULT_PROFILE_ID = "pat-self";

export const usePatientProfileStore = create<PatientProfileState>()(
  persist(
    (set) => ({
      activeProfileId: DEFAULT_PROFILE_ID,
      setActiveProfile: (id) => set({ activeProfileId: id }),
    }),
    { name: "cradlen-patient-profile" },
  ),
);
