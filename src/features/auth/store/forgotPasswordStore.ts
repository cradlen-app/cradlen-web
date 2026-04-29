import { create } from "zustand";

type ForgotPasswordState = {
  resetToken: string | null;
  setResetToken: (resetToken: string) => void;
  clearResetToken: () => void;
};

export const useForgotPasswordStore = create<ForgotPasswordState>()((set) => ({
  resetToken: null,
  setResetToken: (resetToken) => set({ resetToken }),
  clearResetToken: () => set({ resetToken: null }),
}));
