/**
 * Root key registered with the kernel's QueryKeyRegistry for the transitional
 * shell module. The shell owns no queries of its own yet; this exists only to
 * satisfy the manifest contract and reserve the `shell` namespace.
 */
export const SHELL_QUERY_KEY_ROOT = ["shell"] as const;
