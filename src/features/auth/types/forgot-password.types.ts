export interface ForgotPasswordStartRequest {
  email: string;
}

export interface ForgotPasswordResendRequest {
  reset_token: string;
}

export interface ForgotPasswordVerifyRequest {
  reset_token: string;
  code: string;
}

export interface ForgotPasswordResetRequest {
  reset_token: string;
  password: string;
  confirm_password: string;
}

export interface ResetTokenResponse {
  data: { reset_token: string; expires_in: number };
  meta: Record<string, unknown>;
}
