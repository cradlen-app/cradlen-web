import type { Locale, MessagesLoader } from "@/common/kernel-contracts";

export class DuplicateI18nNamespaceError extends Error {
  constructor(namespace: string) {
    super(`i18n namespace "${namespace}" is already registered.`);
    this.name = "DuplicateI18nNamespaceError";
  }
}

export class I18nRegistry {
  private readonly loaders = new Map<string, MessagesLoader>();

  register(namespace: string, loader: MessagesLoader): void {
    if (this.loaders.has(namespace)) {
      throw new DuplicateI18nNamespaceError(namespace);
    }
    this.loaders.set(namespace, loader);
  }

  namespaces(): readonly string[] {
    return Array.from(this.loaders.keys());
  }

  /**
   * Loads every registered namespace for `locale` and returns a single object
   * keyed by namespace. Authors write **unwrapped** keys in their slice files;
   * this method wraps them under the namespace at load time.
   *
   * Example: a module with namespace `"staff"` whose `en.json` is
   * `{ "title": "Staff" }` ends up at `result.staff.title === "Staff"`.
   */
  async loadAll(locale: Locale): Promise<Record<string, Record<string, unknown>>> {
    const result: Record<string, Record<string, unknown>> = {};
    const entries = Array.from(this.loaders.entries());
    const slices = await Promise.all(entries.map(([ns, loader]) => loader(locale).then((m) => [ns, m] as const)));
    for (const [ns, messages] of slices) {
      result[ns] = messages;
    }
    return result;
  }
}
