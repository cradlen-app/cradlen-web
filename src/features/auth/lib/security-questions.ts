/**
 * Canonical patient security-question keys. Must stay in sync with the backend
 * `src/core/patient-portal/auth/dto/security-questions.constant.ts`. Only the
 * key is persisted/validated; the localized question text lives in the
 * `auth.securityQuestions.<KEY>` i18n namespace (en.json / ar.json).
 */
export const SECURITY_QUESTION_KEYS = [
  "MOTHERS_MAIDEN_NAME",
  "BIRTH_CITY",
  "FIRST_SCHOOL",
  "CHILDHOOD_NICKNAME",
  "FAVORITE_TEACHER",
] as const;

export type SecurityQuestionKey = (typeof SECURITY_QUESTION_KEYS)[number];
