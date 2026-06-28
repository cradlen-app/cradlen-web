import type { UserProfile } from "@/common/types/user.types";
import type { OnboardingRequiredResponse } from "@/lib/auth/redirect";

// Token transport DTOs live in `common/` so the infrastructure auth-transport
// layer can read them without importing this feature. Re-exported for the auth
// feature's own consumers.
export type { AuthTokens, AuthTokensResponse } from "@/common/types/auth-tokens.types";

export type SignInRequest = { email: string; password: string };

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
  organization_id?: string | null;
};

export type SelectProfileResponse = {
  data: {
    organization_id: string | null;
    authenticated: true;
    branch_id?: string | null;
    profile_id: string | null;
  };
  meta: Record<string, unknown>;
};
