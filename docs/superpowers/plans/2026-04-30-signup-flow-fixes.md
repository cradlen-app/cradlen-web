# Signup Flow Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all backend/frontend conflicts in the 3-step signup flow so step 3 stops returning 400, error messages are granular, and all UX gaps are closed.

**Architecture:** Fix in dependency order — types and schemas first (pure logic, testable in isolation), then translation keys (needed by forms), then the three form components that consume them. No new files; every change is an in-place update. Schemas are converted to factory functions so `useTranslations` can provide i18n messages.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Zod v4, React Hook Form, next-intl v4, Vitest + Testing Library.

---

## File Map

| File | Change |
|---|---|
| `src/features/auth/types/sign-up.types.ts` | Add `branchName` to `Step3Data`; add `branch_address/city/governorate/country?` to `RegisterOrganizationRequest` |
| `src/features/auth/lib/sign-up.schemas.ts` | Convert all schemas to `makeStepNSchema(t?)` factories; add `branchName` + required location fields; remove dead `organizationName` |
| `src/features/auth/lib/register-organization.ts` | Map `branchName → branch_name`, `address → branch_address`, `city → branch_city`, `governorate → branch_governorate`, `country → branch_country` |
| `src/features/auth/lib/register-organization.test.ts` | Update `baseStep3Data`; flip location-required test; add location-field assertions to builder tests |
| `src/messages/en.json` | Add `branchNameLabel/Placeholder`; add new `errors.*` keys for Zod i18n and granular API errors |
| `src/messages/ar.json` | Mirror every new key from `en.json` in Arabic |
| `src/features/auth/components/SignUpCompleteForm.tsx` | Add `branchName` input; add `useMemo` schema; fix `clearPendingSignupSession` on onboarding redirect |
| `src/features/auth/components/SignUpVerifyForm.tsx` | Add `mode:"onChange"` + validity gate on submit; granular 400/429 error codes |
| `src/features/auth/components/SignUpForm.tsx` | Read `details.fields` from 409 body to distinguish email vs phone conflict |

---

## Task 1: Fix TypeScript Types

**Files:**
- Modify: `src/features/auth/types/sign-up.types.ts`

- [ ] **Step 1: Update `Step3Data` — add `branchName`, make location fields non-optional**

Open `src/features/auth/types/sign-up.types.ts`. Replace the `Step3Data` type:

```typescript
export type Step3Data = {
  accountName: string;
  specialties: string;
  branchName: string;
  city: string;
  address: string;
  governorate: string;
  country?: string;
  role: "owner" | "owner_doctor";
  specialty?: string;
  jobTitle?: string;
};
```

- [ ] **Step 2: Update `RegisterOrganizationRequest` — add branch location fields**

In the same file, replace `RegisterOrganizationRequest`:

```typescript
export type RegisterOrganizationRequest = {
  account_name: string;
  specialties: string[];
  branch_name: string;
  branch_address: string;
  branch_city: string;
  branch_governorate: string;
  branch_country?: string;
  roles: ("OWNER" | "DOCTOR")[];
  specialty?: string;
  job_title?: string;
};
```

- [ ] **Step 3: Verify TypeScript is happy**

```bash
npx tsc --noEmit --pretty false 2>&1 | head -40
```

Expected: errors only about callers that pass `Step3Data` or build `RegisterOrganizationRequest` without the new fields — those will be fixed in later tasks. No errors inside `sign-up.types.ts` itself.

- [ ] **Step 4: Commit**

```bash
git add src/features/auth/types/sign-up.types.ts
git commit -m "fix(types): add branch location fields and branchName to Step3Data"
```

---

## Task 2: Fix Schemas — i18n Factory Functions + Required Location Fields

**Files:**
- Modify: `src/features/auth/lib/sign-up.schemas.ts`
- Modify: `src/features/auth/lib/register-organization.test.ts`

- [ ] **Step 1: Write failing tests for the schema changes**

Open `src/features/auth/lib/register-organization.test.ts`. Update the file to reflect the three schema changes: `organizationName` is gone, location fields are required, `branchName` is required.

Replace the `baseStep3Data` constant and the `step3Schema` describe block:

```typescript
const baseStep3Data: Step3Data = {
  accountName: "Test Clinic",
  specialties: "Cardiology, Pediatrics",
  branchName: "Main Branch",
  city: "Cairo",
  address: "123 Main St",
  governorate: "Cairo",
  country: "Egypt",
  role: "owner",
};
```

Replace the `describe("step3Schema", ...)` block:

```typescript
describe("step3Schema", () => {
  it("accepts a fully populated step 3 payload", () => {
    expect(step3Schema.safeParse(baseStep3Data).success).toBe(true);
  });

  it("requires a role", () => {
    const result = step3Schema.safeParse({
      ...baseStep3Data,
      role: "" as Step3Data["role"],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ["role"] }),
        ]),
      );
    }
  });

  it("requires branchName", () => {
    const result = step3Schema.safeParse({ ...baseStep3Data, branchName: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ["branchName"] }),
        ]),
      );
    }
  });

  it("requires city, address, and governorate", () => {
    for (const field of ["city", "address", "governorate"] as const) {
      const result = step3Schema.safeParse({ ...baseStep3Data, [field]: "" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: [field] }),
          ]),
        );
      }
    }
  });

  it("allows country to be omitted", () => {
    const { country: _, ...withoutCountry } = baseStep3Data;
    expect(step3Schema.safeParse(withoutCountry).success).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx vitest run src/features/auth/lib/register-organization.test.ts 2>&1 | tail -20
```

Expected: failures on `branchName`, location-required, and `allows country to be omitted` tests because the schema still has the old shape.

- [ ] **Step 3: Rewrite `sign-up.schemas.ts`**

Replace the entire file:

```typescript
import { z } from "zod";

const PHONE_NUMBER_REGEXES = [
  /^(?:\+20|0020|0)?1[0125]\d{8}$/,
  /^\+[1-9]\d{7,14}$/,
];

function isValidOptionalPhone(value: string | undefined) {
  const normalized = value?.replace(/[\s().-]/g, "") ?? "";
  if (!normalized) return true;
  return PHONE_NUMBER_REGEXES.some((regex) => regex.test(normalized));
}

export function makeStep1Schema(t: (key: string) => string = (k) => k) {
  return z
    .object({
      firstName: z.string().min(1, { message: t("errors.firstNameRequired") }),
      lastName: z.string().min(1, { message: t("errors.lastNameRequired") }),
      phoneNumber: z
        .string()
        .optional()
        .refine(isValidOptionalPhone, { message: t("errors.invalidPhone") }),
      email: z
        .string()
        .min(1, { message: t("errors.emailRequired") })
        .email({ message: t("errors.emailInvalid") }),
      password: z
        .string()
        .min(8, { message: t("errors.passwordMinLength") })
        .regex(/[a-z]/, { message: t("errors.passwordLowercase") })
        .regex(/[A-Z]/, { message: t("errors.passwordUppercase") })
        .regex(/[0-9]/, { message: t("errors.passwordNumber") })
        .regex(/[^a-zA-Z0-9]/, { message: t("errors.passwordSymbol") }),
      confirmPassword: z
        .string()
        .min(1, { message: t("errors.confirmPasswordRequired") }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("errors.passwordMismatch"),
      path: ["confirmPassword"],
    });
}

export function makeStep2Schema(t: (key: string) => string = (k) => k) {
  return z.object({
    verificationCode: z
      .string()
      .length(6, { message: t("errors.codeLength") })
      .regex(/^\d{6}$/, { message: t("errors.codeDigits") }),
  });
}

export function makeStep3Schema(t: (key: string) => string = (k) => k) {
  return z.object({
    accountName: z.string().min(1, { message: t("errors.accountNameRequired") }),
    specialties: z.string().min(1, { message: t("errors.specialtiesRequired") }),
    branchName: z.string().min(1, { message: t("errors.branchNameRequired") }),
    city: z.string().min(1, { message: t("errors.cityRequired") }),
    address: z.string().min(1, { message: t("errors.addressRequired") }),
    governorate: z.string().min(1, { message: t("errors.governorateRequired") }),
    country: z.string().optional(),
    role: z.enum(["owner", "owner_doctor"], {
      message: t("errors.roleRequired"),
    }),
    specialty: z.string().optional(),
    jobTitle: z.string().optional(),
  });
}

// Convenience exports — use makeStepNSchema(t) in components for translated messages.
export const step1Schema = makeStep1Schema();
export const step2Schema = makeStep2Schema();
export const step3Schema = makeStep3Schema();
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run src/features/auth/lib/register-organization.test.ts 2>&1 | tail -20
```

Expected: all tests pass. The `buildRegisterOrganizationRequest` tests will fail because the builder still has the old mapping — those are fixed in Task 3.

- [ ] **Step 5: Commit**

```bash
git add src/features/auth/lib/sign-up.schemas.ts src/features/auth/lib/register-organization.test.ts
git commit -m "fix(schemas): factory functions for i18n, required location fields, remove dead organizationName"
```

---

## Task 3: Fix `buildRegisterOrganizationRequest` — Map Location Fields and `branch_name`

**Files:**
- Modify: `src/features/auth/lib/register-organization.ts`
- Modify: `src/features/auth/lib/register-organization.test.ts`

- [ ] **Step 1: Update builder tests to assert location fields**

In `src/features/auth/lib/register-organization.test.ts`, update the `buildRegisterOrganizationRequest` describe block. Replace all three `it(...)` tests:

```typescript
describe("buildRegisterOrganizationRequest", () => {
  it("maps owner doctor to the signup complete payload", () => {
    expect(
      buildRegisterOrganizationRequest({
        ...baseStep3Data,
        role: "owner_doctor",
        specialty: "Pediatrics",
        jobTitle: "Senior Physician",
      }),
    ).toEqual({
      account_name: "Test Clinic",
      specialties: ["Cardiology", "Pediatrics"],
      branch_name: "Main Branch",
      branch_address: "123 Main St",
      branch_city: "Cairo",
      branch_governorate: "Cairo",
      branch_country: "Egypt",
      roles: ["OWNER", "DOCTOR"],
      specialty: "Pediatrics",
      job_title: "Senior Physician",
    });
  });

  it("maps owner to a non-clinical signup complete payload", () => {
    expect(buildRegisterOrganizationRequest(baseStep3Data)).toEqual({
      account_name: "Test Clinic",
      specialties: ["Cardiology", "Pediatrics"],
      branch_name: "Main Branch",
      branch_address: "123 Main St",
      branch_city: "Cairo",
      branch_governorate: "Cairo",
      branch_country: "Egypt",
      roles: ["OWNER"],
    });
  });

  it("omits empty doctor optional fields", () => {
    expect(
      buildRegisterOrganizationRequest({
        ...baseStep3Data,
        role: "owner_doctor",
        specialty: " ",
        jobTitle: "",
      }),
    ).toEqual({
      account_name: "Test Clinic",
      specialties: ["Cardiology", "Pediatrics"],
      branch_name: "Main Branch",
      branch_address: "123 Main St",
      branch_city: "Cairo",
      branch_governorate: "Cairo",
      branch_country: "Egypt",
      roles: ["OWNER", "DOCTOR"],
    });
  });

  it("omits branch_country when not provided", () => {
    const { country: _, ...withoutCountry } = baseStep3Data;
    const result = buildRegisterOrganizationRequest(withoutCountry);
    expect(result).not.toHaveProperty("branch_country");
  });
});
```

- [ ] **Step 2: Run tests — verify builder tests fail**

```bash
npx vitest run src/features/auth/lib/register-organization.test.ts 2>&1 | tail -20
```

Expected: builder tests fail because location fields are missing from the output.

- [ ] **Step 3: Rewrite `buildRegisterOrganizationRequest`**

Replace `src/features/auth/lib/register-organization.ts`:

```typescript
import type {
  RegisterOrganizationRequest,
  Step3Data,
} from "../types/sign-up.types";

export function buildRegisterOrganizationRequest(
  data: Step3Data,
): RegisterOrganizationRequest {
  const accountSpecialities = data.specialties
    .split(",")
    .map((specialty) => specialty.trim())
    .filter(Boolean);
  const isClinical = data.role === "owner_doctor";
  const specialty = data.specialty?.trim();
  const jobTitle = data.jobTitle?.trim();

  const payload: RegisterOrganizationRequest = {
    account_name: data.accountName,
    specialties: accountSpecialities,
    branch_name: data.branchName,
    branch_address: data.address,
    branch_city: data.city,
    branch_governorate: data.governorate,
    roles: isClinical ? ["OWNER", "DOCTOR"] : ["OWNER"],
  };

  if (data.country) payload.branch_country = data.country;
  if (isClinical && specialty) payload.specialty = specialty;
  if (isClinical && jobTitle) payload.job_title = jobTitle;

  return payload;
}
```

- [ ] **Step 4: Run tests — all should pass**

```bash
npx vitest run src/features/auth/lib/register-organization.test.ts 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/auth/lib/register-organization.ts src/features/auth/lib/register-organization.test.ts
git commit -m "fix(builder): map branch_name and location fields to RegisterOrganizationRequest"
```

---

## Task 4: Add Translation Keys

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

- [ ] **Step 1: Add keys to `en.json`**

In `src/messages/en.json`, inside `auth.signUp`, add `"branchNameLabel"` and `"branchNamePlaceholder"` after the existing `"mainBranchHeading"` key:

```json
"branchNameLabel": "Branch name",
"branchNamePlaceholder": "e.g. Main Branch",
```

Then inside `auth.signUp.errors`, add all new keys after the existing ones:

```json
"phoneTaken": "A phone number matching this account already exists.",
"otpExpired": "This code has expired. Request a new one below.",
"otpLocked": "Too many incorrect attempts. Please request a new code.",
"resendLocked": "You've requested too many codes. Try again in an hour.",
"firstNameRequired": "First name is required",
"lastNameRequired": "Last name is required",
"invalidPhone": "Enter a valid phone number",
"emailRequired": "Email is required",
"emailInvalid": "Enter a valid email address",
"passwordMinLength": "Password must be at least 8 characters",
"passwordLowercase": "Password must contain at least one lowercase letter",
"passwordUppercase": "Password must contain at least one uppercase letter",
"passwordNumber": "Password must contain at least one number",
"passwordSymbol": "Password must contain at least one symbol",
"confirmPasswordRequired": "Please confirm your password",
"passwordMismatch": "Passwords do not match",
"codeLength": "Code must be exactly 6 digits",
"codeDigits": "Code must contain only digits",
"accountNameRequired": "Account name is required",
"specialtiesRequired": "Please enter at least one specialty",
"branchNameRequired": "Branch name is required",
"cityRequired": "City is required",
"addressRequired": "Address is required",
"governorateRequired": "Governorate is required",
"roleRequired": "Please select a role"
```

- [ ] **Step 2: Add keys to `ar.json`**

In `src/messages/ar.json`, add `"branchNameLabel"` and `"branchNamePlaceholder"` after `"mainBranchHeading"`:

```json
"branchNameLabel": "اسم الفرع",
"branchNamePlaceholder": "مثال: الفرع الرئيسي",
```

Then inside `auth.signUp.errors`, add all new keys:

```json
"phoneTaken": "رقم الهاتف هذا مرتبط بحساب آخر.",
"otpExpired": "انتهت صلاحية هذا الرمز. اطلب رمزًا جديدًا أدناه.",
"otpLocked": "تجاوزت الحد الأقصى للمحاولات. يرجى طلب رمز جديد.",
"resendLocked": "لقد طلبت رموزًا كثيرة. حاول مجددًا بعد ساعة.",
"firstNameRequired": "الاسم الأول مطلوب",
"lastNameRequired": "اسم العائلة مطلوب",
"invalidPhone": "أدخل رقم هاتف صحيحًا",
"emailRequired": "البريد الإلكتروني مطلوب",
"emailInvalid": "أدخل بريدًا إلكترونيًا صحيحًا",
"passwordMinLength": "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
"passwordLowercase": "يجب أن تحتوي كلمة المرور على حرف صغير واحد على الأقل",
"passwordUppercase": "يجب أن تحتوي كلمة المرور على حرف كبير واحد على الأقل",
"passwordNumber": "يجب أن تحتوي كلمة المرور على رقم واحد على الأقل",
"passwordSymbol": "يجب أن تحتوي كلمة المرور على رمز خاص واحد على الأقل",
"confirmPasswordRequired": "يرجى تأكيد كلمة المرور",
"passwordMismatch": "كلمتا المرور غير متطابقتين",
"codeLength": "يجب أن يكون الرمز 6 أرقام بالضبط",
"codeDigits": "يجب أن يحتوي الرمز على أرقام فقط",
"accountNameRequired": "اسم الحساب مطلوب",
"specialtiesRequired": "يرجى إدخال تخصص واحد على الأقل",
"branchNameRequired": "اسم الفرع مطلوب",
"cityRequired": "المدينة مطلوبة",
"addressRequired": "العنوان مطلوب",
"governorateRequired": "المحافظة مطلوبة",
"roleRequired": "يرجى اختيار دور"
```

- [ ] **Step 3: Verify key parity**

```bash
node -e "
const en = JSON.parse(require('fs').readFileSync('src/messages/en.json', 'utf8'));
const ar = JSON.parse(require('fs').readFileSync('src/messages/ar.json', 'utf8'));
const enKeys = Object.keys(en.auth.signUp.errors).sort();
const arKeys = Object.keys(ar.auth.signUp.errors).sort();
const missing = enKeys.filter(k => !arKeys.includes(k));
const extra = arKeys.filter(k => !enKeys.includes(k));
if (missing.length) console.error('Missing in ar:', missing);
if (extra.length) console.error('Extra in ar:', extra);
if (!missing.length && !extra.length) console.log('Keys match');
"
```

Expected output: `Keys match`

- [ ] **Step 4: Commit**

```bash
git add src/messages/en.json src/messages/ar.json
git commit -m "feat(i18n): add signup error keys for granular validation and API error messages"
```

---

## Task 5: Fix `SignUpCompleteForm`

**Files:**
- Modify: `src/features/auth/components/SignUpCompleteForm.tsx`

Three changes: add `branchName` field, use `makeStep3Schema(t)`, fix `clearPendingSignupSession` on onboarding redirect.

- [ ] **Step 1: Update imports**

At the top of `src/features/auth/components/SignUpCompleteForm.tsx`, add `useMemo` to the React import and update the schema import:

```typescript
import { useState, useMemo } from "react";
// ...existing imports...
import { makeStep3Schema } from "../lib/sign-up.schemas";
```

Remove the old `step3Schema` import.

- [ ] **Step 2: Add `useMemo` schema inside the component**

After `const t = useTranslations("auth.signUp");`, add:

```typescript
const schema = useMemo(() => makeStep3Schema(t), [t]);
```

- [ ] **Step 3: Update `useForm` call**

Replace `resolver: zodResolver(step3Schema)` with `resolver: zodResolver(schema)`.

- [ ] **Step 4: Add `branchName` to `defaultValues`**

In the `defaultValues` object, add:

```typescript
branchName: "",
```

- [ ] **Step 5: Add `branchName` input field to the JSX**

In the JSX, the "Main Branch" heading section currently starts at the `<div className="flex flex-col gap-4">` with the `<h3>` heading. Add the `branchName` input as the **first field inside that section**, immediately after the `<h3>`:

```tsx
<div className="flex flex-col gap-1.5">
  <label htmlFor="branchName" className="text-sm text-brand-black">
    {t("branchNameLabel")}
  </label>
  <input
    id="branchName"
    type="text"
    placeholder={t("branchNamePlaceholder")}
    {...form.register("branchName")}
    className={cn(
      inputClass,
      errorInputClass(!!form.formState.errors.branchName),
    )}
  />
  {fieldError(form.formState.errors.branchName?.message)}
</div>
```

- [ ] **Step 6: Fix `clearPendingSignupSession` on onboarding redirect**

In `handleSubmit`, find the `isOnboardingRedirectPath` branch. Change from:

```typescript
if (isOnboardingRedirectPath(nextPath)) {
  router.replace(nextPath);
  return;
}
```

To:

```typescript
if (isOnboardingRedirectPath(nextPath)) {
  clearPendingSignupSession();
  router.replace(nextPath);
  return;
}
```

- [ ] **Step 7: TypeScript check**

```bash
npx tsc --noEmit --pretty false 2>&1 | grep "SignUpCompleteForm"
```

Expected: no errors from this file.

- [ ] **Step 8: Commit**

```bash
git add src/features/auth/components/SignUpCompleteForm.tsx
git commit -m "fix(signup): add branchName field, i18n schema, clear session on onboarding redirect"
```

---

## Task 6: Fix `SignUpVerifyForm` — Gate Submit + Granular Error Codes

**Files:**
- Modify: `src/features/auth/components/SignUpVerifyForm.tsx`
- Modify: `src/features/auth/components/SignUpVerifyForm.test.tsx`

- [ ] **Step 1: Write failing tests for the new behaviours**

Add two new tests to `SignUpVerifyForm.test.tsx` inside `describe("SignUpVerifyForm", ...)`:

```typescript
it("disables the submit button when the code field is empty", async () => {
  window.localStorage.setItem("cradlen-signup-email", "person@example.com");
  mockUseRegistrationStatus.mockReturnValue({
    data: { step: "VERIFY_OTP" },
    error: null,
    isLoading: false,
  });

  renderWithIntl(<SignUpVerifyForm />);

  const submitButton = await screen.findByRole("button", { name: /next/i });
  expect(submitButton).toBeDisabled();
});

it("shows a distinct message when the backend returns OTP_EXPIRED", async () => {
  window.localStorage.setItem("cradlen-signup-email", "person@example.com");
  mockUseRegistrationStatus.mockReturnValue({
    data: { step: "VERIFY_OTP" },
    error: null,
    isLoading: false,
  });
  mockVerifyEmail.mockRejectedValue(
    new ApiError(400, "Bad Request", {
      error: { code: "OTP_EXPIRED", statusCode: 400 },
    }),
  );

  renderWithIntl(<SignUpVerifyForm />);

  const input = await screen.findByLabelText("Verification code");
  fireEvent.change(input, { target: { value: "123456" } });
  fireEvent.submit(input.closest("form") as HTMLFormElement);

  await waitFor(() => {
    expect(
      screen.getByText("This code has expired. Request a new one below."),
    ).toBeInTheDocument();
  });
});
```

Add `ApiError` to the imports at the top of the test file:
```typescript
import { ApiError } from "@/lib/api";
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx vitest run src/features/auth/components/SignUpVerifyForm.test.tsx 2>&1 | tail -20
```

Expected: both new tests fail.

- [ ] **Step 3: Update the form — `mode: "onChange"` + validity gate**

In `SignUpVerifyFormContent`, change:

```typescript
const form = useForm<Step2Data>({ resolver: zodResolver(step2Schema) });
```

To (also adding `useMemo` import and `makeStep2Schema`):

```typescript
const t = useTranslations("auth.signUp"); // already declared above
// ...
const schema = useMemo(() => makeStep2Schema(t), [t]);
const form = useForm<Step2Data>({
  resolver: zodResolver(schema),
  mode: "onChange",
});
```

Update the import at the top of `SignUpVerifyForm.tsx`:
```typescript
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { makeStep2Schema } from "../lib/sign-up.schemas";
```

Remove the old `step2Schema` import.

- [ ] **Step 4: Gate the submit button on form validity**

Change:

```tsx
<button
  type="submit"
  disabled={verifyEmail.isPending}
```

To:

```tsx
<button
  type="submit"
  disabled={!form.formState.isValid || verifyEmail.isPending}
```

- [ ] **Step 5: Add error code helper and update catch block**

Add this helper function before `SignUpVerifyFormContent` (not inside):

```typescript
function getErrorCode(err: unknown): string | null {
  if (!(err instanceof ApiError)) return null;
  const error = (err.body as Record<string, unknown>)?.error;
  if (!error || typeof error !== "object") return null;
  const code = (error as Record<string, unknown>).code;
  return typeof code === "string" ? code : null;
}
```

In `handleSubmit`, replace the catch block:

```typescript
} catch (err) {
  if (err instanceof ApiError && err.status === 401) {
    setIsSessionExpired(true);
  } else if (err instanceof ApiError && err.status === 400) {
    const code = getErrorCode(err);
    if (code === "OTP_EXPIRED") {
      setStepError(t("errors.otpExpired"));
    } else if (code === "MAX_ATTEMPTS_EXCEEDED") {
      setStepError(t("errors.otpLocked"));
    } else {
      setStepError(t("errors.invalidCode"));
    }
  } else {
    setStepError(t("errors.serverError"));
  }
}
```

- [ ] **Step 6: Update resend error handler to distinguish 429 codes**

In `handleResend`, replace the `onError` callback:

```typescript
onError: (err) => {
  if (err instanceof ApiError && err.status === 429) {
    const code = getErrorCode(err);
    if (code === "RESEND_LIMIT_EXCEEDED") {
      setStepError(t("errors.resendLocked"));
    } else {
      setStepError(t("errors.tryAgainLater"));
    }
  } else {
    setStepError(t("errors.serverError"));
  }
},
```

- [ ] **Step 7: Run tests — all should pass**

```bash
npx vitest run src/features/auth/components/SignUpVerifyForm.test.tsx 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/features/auth/components/SignUpVerifyForm.tsx src/features/auth/components/SignUpVerifyForm.test.tsx
git commit -m "fix(verify): gate submit on validity, granular OTP error codes, granular resend 429"
```

---

## Task 7: Fix `SignUpForm` — 409 Phone vs Email Conflict

**Files:**
- Modify: `src/features/auth/components/SignUpForm.tsx`

- [ ] **Step 1: Update imports**

In `SignUpForm.tsx`, update the schema import:

```typescript
import { useMemo } from "react";
import { makeStep1Schema } from "../lib/sign-up.schemas";
```

Remove the old `step1Schema` import.

- [ ] **Step 2: Add `useMemo` schema inside the component**

After `const t = useTranslations("auth.signUp");`, add:

```typescript
const schema = useMemo(() => makeStep1Schema(t), [t]);
```

- [ ] **Step 3: Update `useForm` resolver**

Change `resolver: zodResolver(step1Schema)` to `resolver: zodResolver(schema)`.

- [ ] **Step 4: Add conflict field helper and update 409 handler**

Add this helper before the `SignUpForm` function:

```typescript
function getConflictFields(err: unknown): string[] {
  if (!(err instanceof ApiError)) return [];
  const error = (err.body as Record<string, unknown>)?.error;
  if (!error || typeof error !== "object") return [];
  const details = (error as Record<string, unknown>).details;
  if (!details || typeof details !== "object") return [];
  const fields = (details as Record<string, unknown>).fields;
  return Array.isArray(fields)
    ? fields.filter((f): f is string => typeof f === "string")
    : [];
}
```

In `handleSubmit`, replace the 409 catch clause:

```typescript
if (err instanceof ApiError && err.status === 409) {
  const fields = getConflictFields(err);
  if (fields.includes("phone_number")) {
    setStepError(t("errors.phoneTaken"));
  } else {
    setStepError(t("errors.emailAlreadyRegistered"));
  }
}
```

- [ ] **Step 5: TypeScript check**

```bash
npx tsc --noEmit --pretty false 2>&1 | grep "SignUpForm"
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/features/auth/components/SignUpForm.tsx
git commit -m "fix(signup): distinguish email vs phone 409 conflict, i18n schema"
```

---

## Task 8: Final Verification

- [ ] **Step 1: Run the full test suite**

```bash
npx vitest run src/features/auth 2>&1 | tail -30
```

Expected: all tests pass.

- [ ] **Step 2: Build check**

```bash
npm run build 2>&1 | tail -30
```

Expected: build completes without errors. TypeScript errors from earlier tasks (callers of removed fields) should all be resolved by now.

- [ ] **Step 3: Lint check**

```bash
npm run lint 2>&1 | tail -20
```

Expected: no new lint errors.

- [ ] **Step 4: Smoke-test the signup flow manually**

Start the dev server (`npm run dev`) and walk through all three steps:
1. Fill in personal info → submit → confirm redirect to `/sign-up/verify`
2. Enter a 6-digit code → confirm submit button is disabled when field is empty; becomes enabled after 6 digits are typed
3. Complete org form → confirm branch name, city, address, governorate are all required (form submit stays disabled until all filled) → submit

- [ ] **Step 5: Final commit if any lint/build fixes were needed**

```bash
git add -p
git commit -m "fix(signup): lint and build cleanups after signup flow fixes"
```

---

## Summary of All Fixes

| Priority | Issue | Task |
|---|---|---|
| Critical | `branch_address/city/governorate` not sent | Tasks 1, 3 |
| Critical | Location fields optional in schema vs required in backend | Task 2 |
| Critical | `branch_name` hardcoded to `account_name` | Tasks 1, 2, 3, 5 |
| Critical | `RegisterOrganizationRequest` type missing location fields | Task 1 |
| Medium | 409 always says "email" even for phone conflicts | Task 7 |
| Medium | 400 on verify indistinguishable (wrong/expired/locked) | Task 6 |
| Medium | Resend 429 not distinguished (cooldown vs hourly limit) | Task 6 |
| Low | `clearPendingSignupSession()` missing on onboarding redirect | Task 5 |
| Low | OTP submit not gated on form validity | Task 6 |
| Low | `organizationName` dead field in step3Schema | Task 2 |
| Low | Zod messages hardcoded English | Tasks 2, 4, 5, 6, 7 |
