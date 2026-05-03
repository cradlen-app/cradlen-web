export interface ForgotPasswordStartRequest {
  email: string;
}

// Resend sends an empty body — reset_token is read from the HttpOnly cookie server-side.
export type ForgotPasswordResendRequest = Record<string, never>;

export interface ForgotPasswordVerifyRequest {
  code: string;
}

export interface ForgotPasswordResetRequest {
  password: string;
  confirm_password: string;
}

export interface ForgotPasswordSuccessResponse {
  data: { success: true };
  meta: Record<string, unknown>;
}
