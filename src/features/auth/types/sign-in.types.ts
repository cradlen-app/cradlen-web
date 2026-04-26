export type SignInRequest = { email: string; password: string };

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
};

export type AuthTokensResponse = { data: AuthTokens; meta: Record<string, unknown> };
