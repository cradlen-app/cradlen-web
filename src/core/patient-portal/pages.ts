/**
 * Top-level patient portal components rendered by app routes. Kept separate
 * from `api.ts` so non-UI consumers don't transitively load client components.
 */

export { PatientPortalShell } from "./components/PatientPortalShell";
export { HomeScreen } from "./components/HomeScreen";
export { RecordScreen } from "./components/RecordScreen";
export { MedicationsScreen } from "./components/MedicationsScreen";
export { TestsScreen } from "./components/TestsScreen";
export { AppointmentsScreen } from "./components/AppointmentsScreen";
export { DocumentsScreen } from "./components/DocumentsScreen";
export { ProfileScreen } from "./components/ProfileScreen";
