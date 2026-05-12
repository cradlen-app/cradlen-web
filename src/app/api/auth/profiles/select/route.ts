import { selectProfileSession } from "@/infrastructure/auth-transport/multi-tenant-auth";

export function POST(request: Request) {
  return selectProfileSession(request);
}
