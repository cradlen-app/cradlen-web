/**
 * Kernel lifecycle events.
 *
 * Phase A: thin synchronous event bus used by the kernel itself
 * (e.g. to notify diagnostics when boot completes). Plugins will gain
 * domain-event subscription via this bus in a later phase.
 */

export type KernelEvent =
  | { type: "module-registered"; moduleId: string }
  | { type: "registry-frozen"; runtime: "server" | "client" };

export type KernelEventListener = (event: KernelEvent) => void;

export class KernelEventBus {
  private readonly listeners = new Set<KernelEventListener>();

  on(listener: KernelEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(event: KernelEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

export const kernelEvents = new KernelEventBus();
