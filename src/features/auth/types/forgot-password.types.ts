import type { AuthenticatedSessionResponse } from "./sign-in.types";

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  data: {
    reset_token: string;
    expires_in: number;
  };
  meta: Record<string, unknown>;
}

export interface VerifyResetCodeRequest {
  reset_token: string;
  code: string;
}

export interface ResetPasswordRequest {
  reset_token: string;
  password: string;
  confirm_password: string;
}

export type ResetPasswordResponse = AuthenticatedSessionResponse;
