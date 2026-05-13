// UI shapes (camelCase) — what components consume after mapping.

import type {
  ApiScheduleEventKind,
  ApiVisitPriority,
  ApiVisitStatus,
  ApiVisitType,
  ApiVitals,
  ChiefComplaintMeta,
} from "./visits.api.types";

export type VisitStatus = ApiVisitStatus;
export type VisitType = ApiVisitType;
export type VisitPriority = ApiVisitPriority;
export type ScheduleEventKind = ApiScheduleEventKind;

export type WaitingListFilter =
  | "all"
  | "VISIT"
  | "FOLLOW_UP"
  | "MEDICAL_REP"
  | "EMERGENCY";

export type VisitPatient = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  nationalId?: string;
  dateOfBirth?: string;
  phone?: string;
  address?: string;
  isMarried?: boolean;
  husbandName?: string;
  maritalStatus?: string;
  activeEpisodes?: { id: string; name: string; order: number }[];
  code?: string;
  /** Medical-rep visits only. */
  companyName?: string;
  /** Medical-rep visits only. */
  email?: string;
};

export type Patient = {
  id: string;
  fullName: string;
  nationalId?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  address?: string;
  isMarried?: boolean;
  husbandName?: string;
  activeEpisodes?: { id: string; name: string; order: number }[];
  lastVisitDate?: string;
  nextVisitDate?: string;
  activeJourneyName?: string;
  journeyId?: string;
  journeyType?: string;
  journeyStatus?: string;
};

export type VisitKind = "patient" | "medical_rep";

export type Visit = {
  id: string;
  /** Discriminates patient visits from medical-rep visits in unified lists. Defaults to "patient" when omitted. */
  kind?: VisitKind;
  branchId: string;
  queueNumber?: number;
  patient: VisitPatient;
  type: VisitType;
  status: VisitStatus;
  priority: VisitPriority;
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  notes?: string;
  chiefComplaint?: string | null;
  chiefComplaintMeta?: ChiefComplaintMeta | null;
  vitals?: ApiVitals | null;
  createdAt: string;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
};

export type VisitStats = {
  totalVisits: number;
  visits: number;
  followUps: number;
  medicalReps: number;
};

export type ScheduleEvent = {
  id: string;
  branchId: string;
  title: string;
  kind: ScheduleEventKind;
  patientName?: string;
  doctorIds?: string[];
  doctorNames?: string[];
  startTime: string;
  endTime: string;
  notes?: string;
};

export type WaitingListPage = {
  rows: Visit[];
  page: number;
  totalPages: number;
  total: number;
};
