export interface ForgotPasswordStartRequest {
  email: string;
}

export interface ForgotPasswordSuccessResponse {
  success: true;
}

export interface ForgotPasswordVerifyRequest {
  email: string;
  code: string;
}

export interface ForgotPasswordVerifyResponse {
  reset_token: string;
}

export interface ForgotPasswordResetRequest {
  reset_token: string;
  password: string;
  confirm_password: string;
}

export interface ForgotPasswordResendRequest {
  email: string;
}
