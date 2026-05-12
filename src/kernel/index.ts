// Public surface of the kernel. External layers (core/, plugins/, app/) consume
// only what is re-exported here. Internal registry implementations are
// intentionally not exposed; they will be locked down by ESLint zones.

export {
  KernelProvider,
  __resetRegistriesForTests,
  bootModules,
  useKernel,
  usePermission,
  usePluginNav,
} from "./host";
export { kernelEvents } from "./events";
export type { KernelEvent, KernelEventListener } from "./events";
export { ModuleRegistry } from "./registry/ModuleRegistry";
