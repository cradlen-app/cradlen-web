import { create } from "zustand";
import type { CurrentUser } from "@/types/user.types";

type UserState = {
  user: CurrentUser | null;
  clearUser: () => void;
};

export const useUserStore = create<UserState>()((set) => ({
  user: null,
  clearUser: () => set({ user: null }),
}));
