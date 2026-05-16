// TEMP: Mock data used while API integration is disabled during kernel refactor.
// Delete when hooks are re-integrated with the backend.

import type {
  Patient,
  ScheduleEvent,
  Visit,
  VisitStats,
  WaitingListPage,
} from "../types/visits.types";
import type { DoctorGroup } from "../hooks/useBranchInProgress";

const today = () => {
  const d = new Date();
  d.setSeconds(0, 0);
  return d;
};

const at = (hour: number, minute = 0) => {
  const d = today();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

const minutesAgo = (m: number) => {
  const d = today();
  d.setMinutes(d.getMinutes() - m);
  return d.toISOString();
};

export const mockStats: VisitStats = {
  totalVisits: 24,
  visits: 14,
  followUps: 7,
  medicalReps: 3,
};

export const mockSchedule: ScheduleEvent[] = [
  {
    id: "sch-1",
    branchId: "br-1",
    title: "Pregnancy follow-up — Sara Mahmoud",
    kind: "visit",
    patientName: "Sara Mahmoud",
    doctorIds: ["doc-1"],
    doctorNames: ["Dr. Hala Younis"],
    startTime: at(9, 0),
    endTime: at(9, 30),
  },
  {
    id: "sch-2",
    branchId: "br-1",
    title: "Routine antenatal — Mona Adel",
    kind: "visit",
    patientName: "Mona Adel",
    doctorIds: ["doc-1"],
    doctorNames: ["Dr. Hala Younis"],
    startTime: at(10, 0),
    endTime: at(10, 30),
  },
  {
    id: "sch-3",
    branchId: "br-1",
    title: "Team huddle",
    kind: "meeting",
    doctorNames: ["Dr. Hala Younis", "Dr. Omar Naguib"],
    startTime: at(11, 30),
    endTime: at(12, 0),
  },
  {
    id: "sch-4",
    branchId: "br-1",
    title: "Lunch",
    kind: "break",
    startTime: at(13, 0),
    endTime: at(14, 0),
  },
  {
    id: "sch-5",
    branchId: "br-1",
    title: "Post-op review — Heba Sami",
    kind: "appointment",
    patientName: "Heba Sami",
    doctorIds: ["doc-2"],
    doctorNames: ["Dr. Omar Naguib"],
    startTime: at(15, 0),
    endTime: at(15, 30),
  },
];

const buildVisit = (overrides: Partial<Visit> & Pick<Visit, "id" | "patient">): Visit => ({
  branchId: "br-1",
  queueNumber: 1,
  type: "VISIT",
  status: "CHECKED_IN",
  priority: "NORMAL",
  createdAt: minutesAgo(30),
  ...overrides,
});

export const mockWaitingList: WaitingListPage = {
  rows: [
    buildVisit({
      id: "v-101",
      queueNumber: 1,
      patient: {
        id: "p-1",
        firstName: "Sara",
        lastName: "Mahmoud",
        fullName: "Sara Mahmoud",
        phone: "+20 100 1234567",
      },
      type: "VISIT",
      status: "CHECKED_IN",
      assignedDoctorId: "doc-1",
      assignedDoctorName: "Dr. Hala Younis",
      chiefComplaint: "Nausea, light cramps",
      createdAt: minutesAgo(45),
    }),
    buildVisit({
      id: "v-102",
      queueNumber: 2,
      patient: {
        id: "p-2",
        firstName: "Mona",
        lastName: "Adel",
        fullName: "Mona Adel",
        phone: "+20 101 7654321",
      },
      type: "FOLLOW_UP",
      status: "CHECKED_IN",
      assignedDoctorId: "doc-1",
      assignedDoctorName: "Dr. Hala Younis",
      createdAt: minutesAgo(30),
    }),
    buildVisit({
      id: "v-103",
      queueNumber: 3,
      patient: {
        id: "p-3",
        firstName: "Heba",
        lastName: "Sami",
        fullName: "Heba Sami",
        phone: "+20 102 5556677",
      },
      type: "VISIT",
      status: "CHECKED_IN",
      priority: "EMERGENCY",
      assignedDoctorId: "doc-2",
      assignedDoctorName: "Dr. Omar Naguib",
      chiefComplaint: "Severe abdominal pain",
      createdAt: minutesAgo(20),
    }),
    buildVisit({
      id: "v-104",
      queueNumber: 4,
      patient: {
        id: "p-4",
        firstName: "Reem",
        lastName: "Khaled",
        fullName: "Reem Khaled",
      },
      type: "MEDICAL_REP",
      status: "SCHEDULED",
      createdAt: minutesAgo(10),
    }),
    buildVisit({
      id: "v-105",
      queueNumber: 5,
      patient: {
        id: "p-5",
        firstName: "Yara",
        lastName: "Tarek",
        fullName: "Yara Tarek",
      },
      type: "VISIT",
      status: "CHECKED_IN",
      assignedDoctorId: "doc-2",
      assignedDoctorName: "Dr. Omar Naguib",
      createdAt: minutesAgo(5),
    }),
  ],
  page: 1,
  totalPages: 1,
  total: 5,
};

export const mockMyCurrentVisit: Visit = buildVisit({
  id: "v-current",
  queueNumber: 1,
  patient: {
    id: "p-1",
    firstName: "Sara",
    lastName: "Mahmoud",
    fullName: "Sara Mahmoud",
    phone: "+20 100 1234567",
    dateOfBirth: "1994-03-12",
  },
  type: "VISIT",
  status: "IN_PROGRESS",
  assignedDoctorId: "doc-1",
  assignedDoctorName: "Dr. Hala Younis",
  startedAt: minutesAgo(8),
  chiefComplaint: "Routine antenatal check-up",
  vitals: {
    systolic_bp: 118,
    diastolic_bp: 76,
    pulse: 82,
    temperature_c: 36.8,
  },
});

export const mockInProgressByDoctor: DoctorGroup[] = [
  {
    doctorId: "doc-1",
    doctorName: "Dr. Hala Younis",
    specialty: "Obstetrics",
    visits: [
      buildVisit({
        id: "v-201",
        patient: {
          id: "p-1",
          firstName: "Sara",
          lastName: "Mahmoud",
          fullName: "Sara Mahmoud",
        },
        status: "IN_PROGRESS",
        assignedDoctorId: "doc-1",
        assignedDoctorName: "Dr. Hala Younis",
        startedAt: minutesAgo(8),
      }),
    ],
  },
  {
    doctorId: "doc-2",
    doctorName: "Dr. Omar Naguib",
    specialty: "Gynecology",
    visits: [
      buildVisit({
        id: "v-202",
        patient: {
          id: "p-3",
          firstName: "Heba",
          lastName: "Sami",
          fullName: "Heba Sami",
        },
        status: "IN_PROGRESS",
        priority: "EMERGENCY",
        assignedDoctorId: "doc-2",
        assignedDoctorName: "Dr. Omar Naguib",
        startedAt: minutesAgo(14),
      }),
    ],
  },
];

export const mockPatients: Patient[] = [
  {
    id: "p-1",
    fullName: "Sara Mahmoud",
    nationalId: "29403121234567",
    dateOfBirth: "1994-03-12",
    phoneNumber: "+20 100 1234567",
    maritalStatus: "MARRIED",
  },
  {
    id: "p-2",
    fullName: "Mona Adel",
    nationalId: "28912091234568",
    dateOfBirth: "1989-12-09",
    phoneNumber: "+20 101 7654321",
    maritalStatus: "MARRIED",
  },
  {
    id: "p-3",
    fullName: "Heba Sami",
    nationalId: "29611031234569",
    dateOfBirth: "1996-11-03",
    phoneNumber: "+20 102 5556677",
    maritalStatus: "SINGLE",
  },
  {
    id: "p-4",
    fullName: "Reem Khaled",
    nationalId: "29202221234570",
    dateOfBirth: "1992-02-22",
    phoneNumber: "+20 103 4445566",
    maritalStatus: "MARRIED",
  },
  {
    id: "p-5",
    fullName: "Yara Tarek",
    nationalId: "29508181234571",
    dateOfBirth: "1995-08-18",
    phoneNumber: "+20 104 3334455",
    maritalStatus: "SINGLE",
  },
];

export function getMockVisitById(id: string): Visit {
  const found =
    mockWaitingList.rows.find((v) => v.id === id) ??
    mockInProgressByDoctor.flatMap((g) => g.visits).find((v) => v.id === id);
  if (found) return found;
  return { ...mockMyCurrentVisit, id };
}
