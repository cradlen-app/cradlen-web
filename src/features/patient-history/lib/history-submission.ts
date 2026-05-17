/**
 * Re-export shim. The actual implementation moved to
 * `@/builder/templates/build-submission` so other template-driven features
 * (Examination tab, future specialty tabs) can call it directly. Existing
 * patient-history call sites keep importing from this path; over time they
 * can migrate to the new home.
 */
export {
  buildTemplateSubmission as buildPatientHistorySubmission,
  type BuildOptions,
} from "@/builder/templates/build-submission";
