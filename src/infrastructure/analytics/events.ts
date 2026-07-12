/**
 * The complete set of custom analytics events. Property shapes are PHI-free by
 * construction: only opaque IDs and codes are allowed — never names,
 * national_id, diagnoses, or free text. `capture()` is typed against this map,
 * so an off-taxonomy or PHI-carrying event fails to compile.
 */
// booking_confirmed.visitId is optional: patient bookings don't surface the
// created id through useSubmitVisit (only medical-rep does). Per-field booking
// events (specialty/doctor) are deferred — that form is DSL/template-driven,
// so instrumenting field changes needs builder-runtime hooks (future work).
export type EventProps = {
  signup_started: void;
  signup_verify_submitted: void;
  signup_completed: void;
  booking_started: void;
  booking_confirmed: { visitId?: string };
  visit_started: { visitId: string; kind?: string };
};

export type AnalyticsEventName = keyof EventProps;

export const ANALYTICS_EVENT_NAMES: readonly AnalyticsEventName[] = [
  "signup_started",
  "signup_verify_submitted",
  "signup_completed",
  "booking_started",
  "booking_confirmed",
  "visit_started",
];

export function isAnalyticsEventName(value: string): value is AnalyticsEventName {
  return (ANALYTICS_EVENT_NAMES as readonly string[]).includes(value);
}
