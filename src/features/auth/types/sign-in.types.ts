import type { UserProfile } from "@/types/user.types";
import type { OnboardingRequiredResponse } from "@/lib/auth/redirect";

export type SignInRequest = { email: string; password: string };

export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
};

export type AuthTokensResponse = { data: AuthTokens; meta: Record<string, unknown> };

export type AuthenticatedSessionResponse = {
  data: { authenticated: true };
  meta: Record<string, unknown>;
};

export type LoginProfilesResponse = {
  data: { profiles: UserProfile[] } | OnboardingRequiredResponse;
  meta: Record<string, unknown>;
};

export type SelectProfileRequest = {
  branch_id?: string | null;
  profile_id: string;
};

export type SelectProfileResponse = {
  data: {
    account_id: string;
    authenticated: true;
    branch_id?: string | null;
    profile_id: string;
  };
  meta: Record<string, unknown>;
};
