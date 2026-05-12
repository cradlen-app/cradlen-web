# builder/

Frontend mirror of `cradlen-api/src/builder/`. The backend authors the DSL (fields, sections, templates, workflows, rules); this layer **renders and executes** it client-side.

Phase A: contracts and folder skeleton only — no renderers, no engines.

Subfolders:

- `fields/` — primitive field renderers and the field-type registry (text, number, select, date, ...).
- `sections/` — section renderers; group fields with layout rules.
- `templates/` — `<Template definition value onChange />` consumes a backend template DTO.
- `workflows/` — `WorkflowStepper` and `useWorkflow` for client-side state.
- `rules/` — rule definition types.
- `runtime/` — `execution-context.ts`, `workflow-engine.ts`, `rule-engine.ts`, `actions/`.
- `renderer/` — `FormRenderer` composing fields + sections + templates.
- `validator/` — zod schema built from `FieldDefinition`s.

Definitions ("what"): `fields`, `sections`, `templates`, `workflows`, `rules`.
Execution ("how"): `runtime`, `renderer`, `validator`.

Dependency rule: `builder/ → common, infrastructure`. May not import from `core/` or `plugins/`.
