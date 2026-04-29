import { profileSelectionResponse } from "@/lib/server/multi-tenant-auth";

export function POST(request: Request) {
  return profileSelectionResponse("/auth/signup/complete", request);
}
