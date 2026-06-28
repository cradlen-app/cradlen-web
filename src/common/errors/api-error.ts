/**
 * Transport-agnostic error thrown for any non-2xx API response.
 *
 * Lives in `common/` (the foundational layer that imports nothing else in
 * `src/`) so that pure error helpers — `getApiErrorMessage`,
 * `getSubscriptionLimit`, … — can narrow on it without `common/` reaching up
 * into `infrastructure/`. The HTTP client in `infrastructure/http/api.ts`
 * imports and throws it, and re-exports it for the many existing
 * `@/infrastructure/http/api` importers.
 */
export class ApiError extends Error {
  messages: string[];

  constructor(
    public status: number,
    message: string | string[],
    public body?: unknown,
  ) {
    const messages = Array.isArray(message) ? message : [message];

    super(messages.join("\n"));
    this.messages = messages;
  }
}
