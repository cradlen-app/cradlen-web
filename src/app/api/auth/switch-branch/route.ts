import { switchBranchSession } from "@/lib/server/multi-tenant-auth";

export function POST(request: Request) {
  return switchBranchSession(request);
}
