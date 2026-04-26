import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CurrentUser } from "@/types/user.types";

type UserState = {
  user: CurrentUser | null;
  setUser: (user: CurrentUser) => void;
  clearUser: () => void;
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    { name: "cradlen-user" }
  )
);
