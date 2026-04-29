import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthContextState = {
  accountId: string | null;
  branchId: string | null;
  profileId: string | null;
  setContext: (context: {
    accountId: string;
    branchId?: string | null;
    profileId: string;
  }) => void;
  setBranchId: (branchId: string | null) => void;
  clearContext: () => void;
};

export const useAuthContextStore = create<AuthContextState>()(
  persist(
    (set) => ({
      accountId: null,
      branchId: null,
      profileId: null,
      setContext: ({ accountId, branchId = null, profileId }) =>
        set({ accountId, branchId, profileId }),
      setBranchId: (branchId) => set({ branchId }),
      clearContext: () =>
        set({ accountId: null, branchId: null, profileId: null }),
    }),
    { name: "cradlen-auth-context" },
  ),
);
