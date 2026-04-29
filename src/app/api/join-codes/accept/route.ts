import { profileSelectionResponse } from "@/lib/server/multi-tenant-auth";

export function POST(request: Request) {
  return profileSelectionResponse("/join-codes/accept", request);
}
