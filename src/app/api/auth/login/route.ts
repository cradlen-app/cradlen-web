import { profileSelectionResponse } from "@/infrastructure/auth-transport/multi-tenant-auth";

export function POST(request: Request) {
  return profileSelectionResponse("/auth/login", request);
}
