# Frontend plan — OB/GYN examination: care-path-driven history capture

## Context

The backend (`cradlen-api`) rebuilt the `obgyn_examination` template (v2) so the visit examination now simulates a real encounter: **main complaint → care path → care-path-relevant patient history → exam findings → provisional diagnosis → treatment plan**. The history the doctor captures during the visit is written to the patient-level `PatientObgynHistory` tables (single source of truth) and feeds the now read-only "full history" tab.

This plan covers the `cradlen-web` work to consume that. It has been runtime-verified end-to-end on the API (care-paths expose the mapping; exam GET hydrates history; exam PATCH persists it + writes a revision). The frontend builder already renders templates, evaluates predicates, and assembles payloads — but there is **one real gap** (namespace-aware payload routing) plus care-path section filtering.

## The backend contract (already shipped & verified)

- `GET /v1/care-paths?specialtyCode=OBGYN` now returns, per care path, **`history_section_codes: string[]`** — the embedded history sections relevant to that path, e.g. `OBGYN_GENERAL → ["history_menstrual_history","history_contraceptives","history_screening_vaccinations","history_medical_chronic_illnesses","history_allergies","history_medications"]`.
- `obgyn_examination` v2 embeds the history sections as **`history_*`** sections (e.g. `history_menstrual_history`, `history_allergies`), each field bound to **`PATIENT_OBGYN_HISTORY.*`** (same binding paths as the history template). The `case_path` selector moved up to its own `care_path` section right after the complaint.
- `GET /visits/:id/examination` envelope now includes **`obgyn_history`** (the patient's current history envelope: singleton sections + child collections + `version`, or `null`) and **defaults `case_path`** to the journey's care path when unset.
- `PATCH /visits/:id/examination` accepts an **`obgyn_history`** object (same shape as the old history PATCH DTO) alongside the visit-scoped fields; the server routes it to the patient-level tables in one transaction.

## The gap: payload assembly is namespace-blind

`src/builder/templates/build-submission.ts` and `initial-values.ts` map **every** binding to the body/envelope **root**:
- singleton: `setByPath(body, field.binding.path, value)` → `body.gynecological_baseline.flow`
- repeatable: `body[section.code] = rows` → `body.history_allergies`

That works today because each surface's DTO is flat. The exam DTO is now **composite**: visit fields at root **plus** history under `obgyn_history`. History **cannot** be flattened to the exam root — `medications` collides (history `medications` vs the prescription `medications` array). So history must nest under `obgyn_history`, and the builder must become **namespace-aware**.

Symmetric fixes needed:
| | today (root) | needed (exam tab) |
|---|---|---|
| singleton write | `body.gynecological_baseline.flow` | `body.obgyn_history.gynecological_baseline.flow` |
| repeatable write | `body.history_allergies` | `body.obgyn_history.allergies` |
| singleton read | `envelope.gynecological_baseline.flow` | `envelope.obgyn_history.gynecological_baseline.flow` |
| repeatable read | `envelope.history_allergies` | `envelope.obgyn_history.allergies` |

Note the repeatable **array key** under the container is the binding-path **head** (`allergies` from `allergies.allergy_to`), not the `history_`-prefixed section code. The renderer state stays keyed by `section.code` (`history_allergies`).

## Changes

### 1. Types — `src/features/care-paths/types/care-paths.types.ts`
Add `history_section_codes: string[]` to `CarePathDto`.

### 2. Namespace container routing — `src/builder/templates/build-submission.ts` + `initial-values.ts`
Add an optional `namespaceContainers?: Partial<Record<BindingNamespace, string>>` parameter to `buildTemplateSubmission` and `toInitialFormState` (do **not** hardcode a global map — the read-only history tab reads the same namespace from a *root* envelope, so the container is surface-specific).

- **build-submission**: resolve `container = namespaceContainers[field.binding.namespace]`. For singletons, `setByPath(container ? (body[container] ??= {}) : body, path, value)`. For repeatables, if the section's fields resolve to a container, write `body[container][arrayKey] = apiRows` where `arrayKey =` binding-path head (fallback `section.code`); otherwise current `body[section.code]` behavior.
- **initial-values**: mirror — singleton `getByPath(container ? envelope[container] : envelope, path)`; repeatable rows from `(container ? envelope[container] : envelope)[arrayKey]`, still stored under `repeatableRows[section.code]`.

Existing surfaces pass no `namespaceContainers` → byte-for-byte unchanged.

### 3. Examination tab wiring — `src/features/visits/components/visit-workspace/tabs/ExaminationTab.tsx` (+ `VisitExaminationFormShell`)
- Pass `namespaceContainers={{ PATIENT_OBGYN_HISTORY: "obgyn_history" }}` into both `toInitialFormState(envelope, template, …)` and `buildTemplateSubmission(template, state, …)`.
- The envelope already carries `obgyn_history` + `case_path`; the existing `case_path` enrichment from `visit.carePathCode` can stay as a fallback.

### 4. Care-path-driven section visibility — `CasePathInput` data + `TemplateRenderer`
The relevant history sections are driven by the selected care path's `history_section_codes` (not predicates). 
- Lift the care-paths query result (already cached under `["care-paths", specialtyCode]`) so the shell can read, for the current `case_path` form value, its `history_section_codes` → a `Set<string>`.
- Thread `historySectionCodes: Set<string>` into `TemplateRenderer`: a section whose `code` starts with `history_` is rendered only if its code is in the set. Non-`history_` sections are unaffected.
- Apply the **same** set in `buildTemplateSubmission` (skip `history_*` sections not in the set) so switching care paths never submits pre-filled history from an unrelated path. Pre-fill may hydrate all history sections (cheap); render+submit are gated by the active set.
- On `case_path` change the set recomputes (it derives from form state), so newly-relevant, already-hydrated sections appear.

### 5. Read-only full-history tab (related, from the prior backend task)
The `obgyn_patient_history` template is now `is_display_only` and `/patients/:id/obgyn-history` is GET-only. Ensure `src/features/patient-history` renders read-only (no submit/PATCH) when `template.is_display_only` is true (render values as text; hide save). If not already done, this is the companion change so the "full history" tab reflects what the exam writes.

## Edge cases / decisions
- **`medications` collision** is the reason history must nest under `obgyn_history` (don't flatten).
- **Repeatable array key** = binding-path head, so the `history_` section-code prefix never leaks into the payload.
- **Care-path switch** mid-encounter: render+submit follow the active `history_section_codes`; hydration is global so no data is lost on switch.
- **Optimistic concurrency** unchanged: keep sending `If-Match: version:<examination_version>`; the server bumps the history `version` itself.

## Verification
1. Open an OB/GYN visit examination; confirm the `Care Path` pill selector renders right after the complaint and the history sections shown match the selected path (switch paths → section set changes).
2. Fill a history field (e.g. an allergy) + a visit field (chief complaint); Save. Network: PATCH body has `obgyn_history: { allergies: [...] }` (not `history_allergies` at root) and `chief_complaint` at root.
3. Reload the exam tab → the history fields pre-fill from `envelope.obgyn_history`.
4. Open the read-only full-history tab → the saved allergy appears.
5. Regression: the standalone patient-history tab (read-only) and any other template surfaces still load/submit unchanged (they pass no `namespaceContainers`).
