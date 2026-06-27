/**
 * The patient portal is a separate app on its own domain (extracted from this
 * clinic web app). Links from the clinic site into the live portal point here.
 * Override per environment with NEXT_PUBLIC_PATIENT_APP_URL.
 */
export const PATIENT_APP_URL =
  process.env.NEXT_PUBLIC_PATIENT_APP_URL ?? "https://my.cradlen.com";
