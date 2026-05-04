import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthContextState = {
  organizationId: string | null;
  branchId: string | null;
  profileId: string | null;
  setContext: (context: {
    organizationId: string;
    branchId?: string | null;
    profileId: string;
  }) => void;
  setBranchId: (branchId: string | null) => void;
  clearContext: () => void;
};

export const useAuthContextStore = create<AuthContextState>()(
  persist(
    (set) => ({
      organizationId: null,
      branchId: null,
      profileId: null,
      setContext: ({ organizationId, branchId = null, profileId }) =>
        set({ organizationId, branchId, profileId }),
      setBranchId: (branchId) => set({ branchId }),
      clearContext: () =>
        set({ organizationId: null, branchId: null, profileId: null }),
    }),
    { name: "cradlen-org-context" },
  ),
);
