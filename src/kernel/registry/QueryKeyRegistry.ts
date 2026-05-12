import type { QueryKeyRoot } from "@/common/kernel-contracts";

export class DuplicateQueryKeyRootError extends Error {
  constructor(root: string, existingOwner: string, attemptedOwner: string) {
    super(
      `Query key root "${root}" is already owned by module "${existingOwner}" ` +
        `and cannot be claimed by "${attemptedOwner}".`,
    );
    this.name = "DuplicateQueryKeyRootError";
  }
}

/**
 * Tracks which module owns each top-level TanStack Query namespace.
 * Modules are expected to keep all of their cache keys under their
 * declared root (e.g. `['staff', ...]`).
 */
export class QueryKeyRegistry {
  private readonly owners = new Map<string, string>();

  register(root: QueryKeyRoot, moduleId: string): void {
    const key = root[0];
    const existingOwner = this.owners.get(key);
    if (existingOwner && existingOwner !== moduleId) {
      throw new DuplicateQueryKeyRootError(key, existingOwner, moduleId);
    }
    this.owners.set(key, moduleId);
  }

  ownerOf(rootKey: string): string | undefined {
    return this.owners.get(rootKey);
  }

  list(): ReadonlyMap<string, string> {
    return this.owners;
  }
}
