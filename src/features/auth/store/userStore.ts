import { create } from "zustand";
import type { CurrentUser } from "@/types/user.types";

type UserState = {
  user: CurrentUser | null;
  setUser: (user: CurrentUser) => void;
  clearUser: () => void;
};

export const useUserStore = create<UserState>()((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
