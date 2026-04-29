import { selectProfileSession } from "@/lib/server/multi-tenant-auth";

export function POST(request: Request) {
  return selectProfileSession(request);
}
