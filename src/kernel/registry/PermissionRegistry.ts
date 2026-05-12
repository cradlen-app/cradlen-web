import type {
  AuthContext,
  PermissionId,
  PermissionPredicate,
} from "@/common/kernel-contracts";

export class DuplicatePermissionError extends Error {
  constructor(id: PermissionId) {
    super(`Permission "${id}" is already registered.`);
    this.name = "DuplicatePermissionError";
  }
}

export class PermissionRegistry {
  private readonly predicates = new Map<PermissionId, PermissionPredicate>();

  register(id: PermissionId, predicate: PermissionPredicate): void {
    if (this.predicates.has(id)) {
      throw new DuplicatePermissionError(id);
    }
    this.predicates.set(id, predicate);
  }

  /**
   * Returns `false` for unknown permission ids. Callers that need a strict
   * "must exist" check should use `has(id)` first.
   */
  check(id: PermissionId, ctx: AuthContext): boolean {
    const predicate = this.predicates.get(id);
    return predicate ? predicate(ctx) : false;
  }

  has(id: PermissionId): boolean {
    return this.predicates.has(id);
  }

  list(): readonly PermissionId[] {
    return Array.from(this.predicates.keys());
  }
}
