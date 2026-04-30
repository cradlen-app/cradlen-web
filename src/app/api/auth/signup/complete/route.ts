import { signupCompleteResponse } from "@/lib/server/multi-tenant-auth";

export function POST(request: Request) {
  return signupCompleteResponse(request);
}
