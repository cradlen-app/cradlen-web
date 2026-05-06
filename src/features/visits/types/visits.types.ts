// UI shapes (camelCase) — what components consume after mapping.

import type {
  ApiScheduleEventKind,
  ApiVisitPriority,
  ApiVisitStatus,
  ApiVisitType,
} from "./visits.api.types";

export type VisitStatus = ApiVisitStatus;
export type VisitType = ApiVisitType;
export type VisitPriority = ApiVisitPriority;
export type ScheduleEventKind = ApiScheduleEventKind;

export type WaitingListFilter =
  | "all"
  | "visit"
  | "follow_up"
  | "medical_rep"
  | "emergency";

export type VisitPatient = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  code?: string;
  phone?: string;
  address?: string;
};

export type Visit = {
  id: string;
  branchId: string;
  queueNumber?: number;
  patient: VisitPatient;
  type: VisitType;
  status: VisitStatus;
  priority: VisitPriority;
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  complaint?: string;
  notes?: string;
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
