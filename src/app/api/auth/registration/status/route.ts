import { backendFetch, readBackendJson } from "@/lib/server/backend";
import { NextResponse, type NextRequest } from "next/server";

const VALID_STEPS = new Set([
  "NONE",
  "VERIFY_OTP",
  "COMPLETE_ONBOARDING",
  "DONE",
]);

function extractStep(body: unknown) {
  if (!body || typeof body !== "object") return "NONE";

  const root = body as { step?: unknown; data?: unknown };
  const data = root.data && typeof root.data === "object" ? root.data as { step?: unknown } : null;
  const step = root.step ?? data?.step;

  return typeof step === "string" && VALID_STEPS.has(step) ? step : "NONE";
}

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email") ?? "";
  const response = await backendFetch(
    `/auth/registration/status?email=${encodeURIComponent(email)}`,
    { method: "GET" },
  );
  const body = await readBackendJson(response);

  if (!response.ok) {
    return NextResponse.json(body ?? { message: response.statusText }, {
      status: response.status,
    });
  }

  return NextResponse.json({ step: extractStep(body) }, { status: response.status });
}
