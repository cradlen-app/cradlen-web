// TEMP: Mock data used while API integration is disabled during kernel refactor.
// Delete when hooks are re-integrated with the backend.

import type { CalendarEvent } from "../types/calendar.types";

const dayOffset = (days: number, hour: number, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

const baseEvent = (
  overrides: Partial<CalendarEvent> & Pick<CalendarEvent, "id" | "title" | "startsAt" | "endsAt" | "type">,
): CalendarEvent => ({
  organizationId: "org-1",
  branchId: "br-1",
  createdById: "user-1",
  patientId: null,
  patientName: null,
  description: null,
  allDay: false,
  status: "SCHEDULED",
  details: {},
  participants: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const mockCalendarEvents: CalendarEvent[] = [
  baseEvent({
    id: "ev-1",
    type: "SURGERY",
    title: "C-section — Sara Mahmoud",
    patientId: "p-1",
    patientName: "Sara Mahmoud",
    startsAt: dayOffset(0, 9, 0),
    endsAt: dayOffset(0, 11, 0),
    participants: [
      { id: "pa-1", profileId: "doc-1", role: "PRIMARY_DOCTOR", name: "Dr. Hala Younis" },
      { id: "pa-2", profileId: "doc-2", role: "ASSISTANT", name: "Dr. Omar Naguib" },
    ],
  }),
  baseEvent({
    id: "ev-2",
    type: "MEETING",
    title: "Staff weekly sync",
    startsAt: dayOffset(0, 14, 0),
    endsAt: dayOffset(0, 15, 0),
    participants: [
      { id: "pa-3", profileId: "doc-1", role: "ATTENDEE", name: "Dr. Hala Younis" },
      { id: "pa-4", profileId: "doc-2", role: "ATTENDEE", name: "Dr. Omar Naguib" },
    ],
  }),
  baseEvent({
    id: "ev-3",
    type: "PERSONAL",
    title: "Conference prep",
    startsAt: dayOffset(1, 10, 0),
    endsAt: dayOffset(1, 11, 30),
    participants: [
      { id: "pa-5", profileId: "doc-1", role: "ATTENDEE", name: "Dr. Hala Younis" },
    ],
  }),
  baseEvent({
    id: "ev-4",
    type: "SURGERY",
    title: "Hysteroscopy — Mona Adel",
    patientId: "p-2",
    patientName: "Mona Adel",
    startsAt: dayOffset(1, 13, 0),
    endsAt: dayOffset(1, 14, 30),
    participants: [
      { id: "pa-6", profileId: "doc-2", role: "PRIMARY_DOCTOR", name: "Dr. Omar Naguib" },
    ],
  }),
  baseEvent({
    id: "ev-5",
    type: "LEAVE",
    title: "Dr. Hala — Annual leave",
    startsAt: dayOffset(2, 0, 0),
    endsAt: dayOffset(2, 23, 59),
    allDay: true,
    participants: [
      { id: "pa-7", profileId: "doc-1", role: "ATTENDEE", name: "Dr. Hala Younis" },
    ],
  }),
  baseEvent({
    id: "ev-6",
    type: "MEETING",
    title: "Patient case review",
    startsAt: dayOffset(3, 11, 0),
    endsAt: dayOffset(3, 12, 0),
    participants: [
      { id: "pa-8", profileId: "doc-1", role: "ATTENDEE", name: "Dr. Hala Younis" },
      { id: "pa-9", profileId: "doc-2", role: "ATTENDEE", name: "Dr. Omar Naguib" },
    ],
  }),
  baseEvent({
    id: "ev-7",
    type: "SURGERY",
    title: "Laparoscopy — Heba Sami",
    patientId: "p-3",
    patientName: "Heba Sami",
    startsAt: dayOffset(4, 9, 30),
    endsAt: dayOffset(4, 11, 30),
    participants: [
      { id: "pa-10", profileId: "doc-2", role: "PRIMARY_DOCTOR", name: "Dr. Omar Naguib" },
    ],
  }),
  baseEvent({
    id: "ev-8",
    type: "PERSONAL",
    title: "Admin block",
    startsAt: dayOffset(4, 15, 0),
    endsAt: dayOffset(4, 16, 0),
    participants: [
      { id: "pa-11", profileId: "doc-1", role: "ATTENDEE", name: "Dr. Hala Younis" },
    ],
  }),
];
