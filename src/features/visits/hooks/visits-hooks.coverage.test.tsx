import type { ReactNode } from "react";
import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/infrastructure/http/api";

vi.mock("../lib/visits.api", () => ({
  fetchVisitStats: vi.fn(),
  fetchBranchVisitStats: vi.fn(),
  fetchOrgVisitStats: vi.fn(),
  fetchBranchWaitingList: vi.fn(),
  fetchBranchInProgress: vi.fn(),
  fetchMyWaitingList: vi.fn(),
  fetchMyCurrentVisit: vi.fn(),
  fetchVisit: vi.fn(),
  fetchTodaysSchedule: vi.fn(),
  searchPatients: vi.fn(),
  fetchPatientIdentity: vi.fn(),
  fetchPatientVisitHistory: vi.fn(),
  fetchPatientJourneyTimeline: vi.fn(),
  fetchPatientVitalsTrend: vi.fn(),
  bookVisit: vi.fn(),
  bookMedicalRepVisit: vi.fn(),
  startVisit: vi.fn(),
  cancelVisit: vi.fn(),
  updateVisitStatus: vi.fn(),
  updateVisit: vi.fn(),
}));

vi.mock("../lib/medical-rep.api", () => ({
  fetchMedRepBranchWaitingList: vi.fn(),
  fetchMedRepBranchInProgress: vi.fn(),
  fetchMedRepMyWaitingList: vi.fn(),
  fetchMedRepMyCurrent: vi.fn(),
  fetchMedRepVisit: vi.fn(),
  updateMedRepVisit: vi.fn(),
  updateMedRepVisitStatus: vi.fn(),
}));

vi.mock("../lib/prescriptions.api", () => ({
  fetchPrescriptionPrint: vi.fn(),
}));

// Identity mappers — feed Visit-shaped fixtures from the api mocks directly.
vi.mock("../lib/visits.utils", () => ({
  mapApiVisitToVisit: (v: unknown) => v,
  mapApiMedRepVisitToVisit: (v: unknown) => v,
  mapApiStatsToStats: (v: unknown) => v,
  mapApiScheduleEvent: (v: unknown) => v,
  mapApiPatientSearchResultToPatient: (v: unknown) => v,
}));

import * as visitsApi from "../lib/visits.api";
import * as medRepApi from "../lib/medical-rep.api";
import * as prescriptionsApi from "../lib/prescriptions.api";

import { useVisit } from "./useVisit";
import { useMyCurrentVisit } from "./useCurrentVisit";
import { useVisitStats } from "./useVisitStats";
import { useVisitMonthlyStats } from "./useVisitMonthlyStats";
import { useTodaysSchedule } from "./useTodaysSchedule";
import { useWaitingList } from "./useWaitingList";
import { useBranchInProgress } from "./useBranchInProgress";
import { useCancelVisit } from "./useCancelVisit";
import { useStartVisit } from "./useStartVisit";
import { useBookVisit } from "./useBookVisit";
import { useBookMedicalRepVisit } from "./useBookMedicalRepVisit";
import { useUpdateVisit } from "./useUpdateVisit";
import { useUpdateVisitStatus } from "./useUpdateVisitStatus";
import { usePatientSearch } from "./usePatientSearch";
import { usePatientVisitHistory } from "./usePatientVisitHistory";
import { usePatientJourneyTimeline } from "./usePatientJourneyTimeline";
import { usePatientVitalsTrend } from "./usePatientVitalsTrend";
import { useMedRepWaitingList } from "./useMedRepWaitingList";
import { useMedRepMyCurrentVisit } from "./useMedRepCurrentVisit";
import { useMedRepBranchInProgress } from "./useMedRepBranchInProgress";
import { useMedRepVisit } from "./useMedRepVisit";
import { useUpdateMedRepVisit } from "./useUpdateMedRepVisit";
import { useUpdateMedRepVisitStatus } from "./useUpdateMedRepVisitStatus";
import { useUnifiedWaitingList } from "./useUnifiedWaitingList";
import { useUnifiedMyCurrentVisit } from "./useUnifiedCurrentVisit";
import { useUnifiedBranchInProgress } from "./useUnifiedBranchInProgress";
import { usePrescriptionPrint } from "./usePrescriptionPrint";

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, retryDelay: 0 },
      mutations: { retry: false },
    },
  });
}

function wrapperFor(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <Suspense fallback={null}>{children}</Suspense>
      </QueryClientProvider>
    );
  };
}

function listPage(rows: unknown[], total = rows.length) {
  return { data: rows, meta: { total, page: 1, totalPages: 1 } } as never;
}

async function runSuccess(
  hook: () => { mutateAsync: (v: never) => Promise<unknown> },
  variables: unknown,
) {
  const { result } = renderHook(hook, { wrapper: wrapperFor(makeClient()) });
  await act(async () => {
    await result.current.mutateAsync(variables as never);
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("visit query hooks", () => {
  it("useVisit fetches and maps a visit, disabled without id", async () => {
    vi.mocked(visitsApi.fetchVisit).mockResolvedValue({ data: { id: "v-1" } } as never);
    const { result } = renderHook(() => useVisit("v-1"), {
      wrapper: wrapperFor(makeClient()),
    });
    await waitFor(() => expect(result.current.data).toEqual({ id: "v-1" }));
    expect(visitsApi.fetchVisit).toHaveBeenCalledWith({ visitId: "v-1" });

    const disabled = renderHook(() => useVisit(null), {
      wrapper: wrapperFor(makeClient()),
    });
    expect(disabled.result.current.data).toBeUndefined();
    expect(visitsApi.fetchVisit).toHaveBeenCalledTimes(1);
  });

  it("useMyCurrentVisit returns mapped list", async () => {
    vi.mocked(visitsApi.fetchMyCurrentVisit).mockResolvedValue({
      data: [{ id: "v-1" }],
    } as never);
    const { result } = renderHook(() => useMyCurrentVisit("b-1"), {
      wrapper: wrapperFor(makeClient()),
    });
    await waitFor(() => expect(result.current.data).toEqual([{ id: "v-1" }]));
  });

  it("useMyCurrentVisit stays disabled when enabled=false", () => {
    const { result } = renderHook(() => useMyCurrentVisit("b-1", false), {
      wrapper: wrapperFor(makeClient()),
    });
    expect(result.current.data).toBeUndefined();
    expect(visitsApi.fetchMyCurrentVisit).not.toHaveBeenCalled();
  });

  it("useVisitStats (suspense) resolves stats", async () => {
    vi.mocked(visitsApi.fetchVisitStats).mockResolvedValue({
      data: { total: 5 },
    } as never);
    const { result } = renderHook(
      () => useVisitStats({ branchId: "b-1", date: "2026-06-01" }),
      { wrapper: wrapperFor(makeClient()) },
    );
    await waitFor(() => expect(result.current.data).toEqual({ total: 5 }));
  });

  it("useTodaysSchedule (suspense) resolves mapped events", async () => {
    vi.mocked(visitsApi.fetchTodaysSchedule).mockResolvedValue({
      data: [{ id: "ev-1" }],
    } as never);
    const { result } = renderHook(
      () => useTodaysSchedule({ branchId: "b-1", date: "2026-06-01" }),
      { wrapper: wrapperFor(makeClient()) },
    );
    await waitFor(() => expect(result.current.data).toEqual([{ id: "ev-1" }]));
  });

  it("useVisitMonthlyStats branch + org-wide variants", async () => {
    vi.mocked(visitsApi.fetchBranchVisitStats).mockResolvedValue({
      data: { total: 1 },
    } as never);
    const branch = renderHook(
      () => useVisitMonthlyStats("b-1", { mine: true }),
      { wrapper: wrapperFor(makeClient()) },
    );
    await waitFor(() => expect(branch.result.current.data).toEqual({ total: 1 }));
    expect(visitsApi.fetchBranchVisitStats).toHaveBeenCalledWith("b-1", true);

    vi.mocked(visitsApi.fetchOrgVisitStats).mockResolvedValue({
      data: { total: 2 },
    } as never);
    const org = renderHook(
      () => useVisitMonthlyStats(undefined, { orgWide: true, orgId: "org-1" }),
      { wrapper: wrapperFor(makeClient()) },
    );
    await waitFor(() => expect(org.result.current.data).toEqual({ total: 2 }));
    expect(visitsApi.fetchOrgVisitStats).toHaveBeenCalledWith("org-1");
  });

  it("useWaitingList branch + assignedToMe and derives totalPages", async () => {
    vi.mocked(visitsApi.fetchBranchWaitingList).mockResolvedValue({
      data: [{ id: "v-1" }],
      meta: { total: 25, page: 1 },
    } as never);
    const branch = renderHook(
      () => useWaitingList({ branchId: "b-1", page: 1, limit: 10 }),
      { wrapper: wrapperFor(makeClient()) },
    );
    await waitFor(() => expect(branch.result.current.data?.total).toBe(25));
    expect(branch.result.current.data?.totalPages).toBe(3);

    vi.mocked(visitsApi.fetchMyWaitingList).mockResolvedValue(
      listPage([{ id: "v-2" }], 1),
    );
    const mine = renderHook(
      () =>
        useWaitingList({ branchId: "b-1", assignedToMe: true, page: 1 }),
      { wrapper: wrapperFor(makeClient()) },
    );
    await waitFor(() =>
      expect(mine.result.current.data?.rows).toEqual([{ id: "v-2" }]),
    );

    const disabled = renderHook(
      () => useWaitingList({ branchId: null, page: 1 }),
      { wrapper: wrapperFor(makeClient()) },
    );
    expect(disabled.result.current.data).toBeUndefined();
  });

  it("useBranchInProgress groups visits by doctor", async () => {
    vi.mocked(visitsApi.fetchBranchInProgress).mockResolvedValue({
      data: [
        { id: "v-1", assignedDoctorId: "d-1", assignedDoctorName: "Dr A" },
        { id: "v-2", assignedDoctorId: "d-1", assignedDoctorName: "Dr A" },
        { id: "v-3" },
      ],
    } as never);
    const { result } = renderHook(() => useBranchInProgress("b-1"), {
      wrapper: wrapperFor(makeClient()),
    });
    await waitFor(() => expect(result.current.groups.length).toBe(2));
    const drA = result.current.groups.find((g) => g.doctorId === "d-1");
    expect(drA?.visits).toHaveLength(2);
    expect(
      result.current.groups.find((g) => g.doctorId === "unassigned")?.doctorName,
    ).toBe("Unassigned");
  });

  it("usePatientVisitHistory paginates with getNextPageParam", async () => {
    vi.mocked(visitsApi.fetchPatientVisitHistory).mockResolvedValue({
      data: [{ id: "h-1" }, { id: "h-2" }],
      meta: { total: 5 },
    } as never);
    const { result } = renderHook(
      () =>
        usePatientVisitHistory({ patientId: "p-1", excludeVisitId: "v-1" }),
      { wrapper: wrapperFor(makeClient()) },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.entries).toHaveLength(2);
    expect(result.current.hasMore).toBe(true);
  });

  it("usePatientJourneyTimeline returns journeys", async () => {
    vi.mocked(visitsApi.fetchPatientJourneyTimeline).mockResolvedValue({
      data: [{ id: "j-1" }],
      meta: { total: 1 },
    } as never);
    const { result } = renderHook(
      () =>
        usePatientJourneyTimeline({ patientId: "p-1", excludeVisitId: "v-1" }),
      { wrapper: wrapperFor(makeClient()) },
    );
    await waitFor(() => expect(result.current.journeys).toEqual([{ id: "j-1" }]));
    expect(result.current.hasMore).toBe(false);
  });

  it("usePatientVitalsTrend returns points", async () => {
    vi.mocked(visitsApi.fetchPatientVitalsTrend).mockResolvedValue({
      data: [{ date: "2026-06-01", systolic: 120 }],
    } as never);
    const { result } = renderHook(
      () =>
        usePatientVitalsTrend({ patientId: "p-1", excludeVisitId: "v-1" }),
      { wrapper: wrapperFor(makeClient()) },
    );
    await waitFor(() => expect(result.current.points).toHaveLength(1));
  });

  it("usePatientSearch debounces and queries once the term is long enough", async () => {
    vi.mocked(visitsApi.searchPatients).mockResolvedValue({
      data: [{ id: "p-1" }],
    } as never);
    const { result } = renderHook(() => usePatientSearch("ahmed"), {
      wrapper: wrapperFor(makeClient()),
    });
    // Real 300ms debounce then the query resolves (waitFor default 1s window).
    await waitFor(() => expect(result.current.data).toEqual([{ id: "p-1" }]), {
      timeout: 2000,
    });
    expect(visitsApi.searchPatients).toHaveBeenCalledWith("ahmed");
  });

  it("usePatientSearch stays disabled for short terms", () => {
    const { result } = renderHook(() => usePatientSearch("a"), {
      wrapper: wrapperFor(makeClient()),
    });
    expect(result.current.data).toBeUndefined();
    expect(visitsApi.searchPatients).not.toHaveBeenCalled();
  });
});

describe("medical-rep query hooks", () => {
  it("useMedRepWaitingList branch + assignedToMe", async () => {
    vi.mocked(medRepApi.fetchMedRepBranchWaitingList).mockResolvedValue(
      listPage([{ id: "mv-1" }], 1),
    );
    const branch = renderHook(
      () => useMedRepWaitingList({ branchId: "b-1", page: 1 }),
      { wrapper: wrapperFor(makeClient()) },
    );
    await waitFor(() =>
      expect(branch.result.current.data?.rows).toEqual([{ id: "mv-1" }]),
    );

    vi.mocked(medRepApi.fetchMedRepMyWaitingList).mockResolvedValue({
      data: [{ id: "mv-2" }],
      meta: { total: 30, page: 1 },
    } as never);
    const mine = renderHook(
      () =>
        useMedRepWaitingList({
          branchId: "b-1",
          assignedToMe: true,
          page: 1,
          limit: 10,
        }),
      { wrapper: wrapperFor(makeClient()) },
    );
    await waitFor(() => expect(mine.result.current.data?.totalPages).toBe(3));
  });

  it("useMedRepMyCurrentVisit / useMedRepBranchInProgress / useMedRepVisit", async () => {
    vi.mocked(medRepApi.fetchMedRepMyCurrent).mockResolvedValue({
      data: [{ id: "mv-1" }],
    } as never);
    const cur = renderHook(() => useMedRepMyCurrentVisit("b-1"), {
      wrapper: wrapperFor(makeClient()),
    });
    await waitFor(() => expect(cur.result.current.data).toEqual([{ id: "mv-1" }]));

    vi.mocked(medRepApi.fetchMedRepBranchInProgress).mockResolvedValue({
      data: [{ id: "mv-2" }],
    } as never);
    const ip = renderHook(() => useMedRepBranchInProgress("b-1"), {
      wrapper: wrapperFor(makeClient()),
    });
    await waitFor(() => expect(ip.result.current.data).toEqual([{ id: "mv-2" }]));

    vi.mocked(medRepApi.fetchMedRepVisit).mockResolvedValue({
      data: { id: "mv-3" },
    } as never);
    const one = renderHook(() => useMedRepVisit("mv-3"), {
      wrapper: wrapperFor(makeClient()),
    });
    await waitFor(() => expect(one.result.current.data).toEqual({ id: "mv-3" }));
  });
});

describe("unified hooks", () => {
  it("useUnifiedWaitingList merges + sorts patient and med-rep rows", async () => {
    vi.mocked(visitsApi.fetchBranchWaitingList).mockResolvedValue({
      data: [{ id: "v-1", status: "SCHEDULED", queueNumber: 2 }],
      meta: { total: 1, page: 1, totalPages: 1 },
    } as never);
    vi.mocked(medRepApi.fetchMedRepBranchWaitingList).mockResolvedValue({
      data: [{ id: "mv-1", status: "CHECKED_IN", queueNumber: 1 }],
      meta: { total: 1, page: 1, totalPages: 1 },
    } as never);

    const { result } = renderHook(
      () => useUnifiedWaitingList({ branchId: "b-1", page: 1 }),
      { wrapper: wrapperFor(makeClient()) },
    );
    await waitFor(() => expect(result.current.data?.rows).toHaveLength(2));
    // CHECKED_IN sorts before SCHEDULED.
    expect(result.current.data?.rows[0]).toMatchObject({ id: "mv-1" });
    expect(result.current.data?.total).toBe(2);
  });

  it("useUnifiedMyCurrentVisit concatenates both sources", async () => {
    vi.mocked(visitsApi.fetchMyCurrentVisit).mockResolvedValue({
      data: [{ id: "v-1" }],
    } as never);
    vi.mocked(medRepApi.fetchMedRepMyCurrent).mockResolvedValue({
      data: [{ id: "mv-1" }],
    } as never);
    const { result } = renderHook(() => useUnifiedMyCurrentVisit("b-1"), {
      wrapper: wrapperFor(makeClient()),
    });
    await waitFor(() => expect(result.current.data).toHaveLength(2));
  });

  it("useUnifiedBranchInProgress groups across both sources", async () => {
    vi.mocked(visitsApi.fetchBranchInProgress).mockResolvedValue({
      data: [{ id: "v-1", assignedDoctorId: "d-1", assignedDoctorName: "Dr A" }],
    } as never);
    vi.mocked(medRepApi.fetchMedRepBranchInProgress).mockResolvedValue({
      data: [{ id: "mv-1", assignedDoctorId: "d-1", assignedDoctorName: "Dr A" }],
    } as never);
    const { result } = renderHook(() => useUnifiedBranchInProgress("b-1"), {
      wrapper: wrapperFor(makeClient()),
    });
    await waitFor(() => expect(result.current.groups).toHaveLength(1));
    expect(result.current.groups[0].visits).toHaveLength(2);
  });
});

describe("mutation hooks", () => {
  it("useCancelVisit / useStartVisit", async () => {
    vi.mocked(visitsApi.cancelVisit).mockResolvedValue({} as never);
    await runSuccess(() => useCancelVisit(), { branchId: "b-1", visitId: "v-1" });
    expect(visitsApi.cancelVisit).toHaveBeenCalledWith({ branchId: "b-1", visitId: "v-1" });

    vi.mocked(visitsApi.startVisit).mockResolvedValue({} as never);
    await runSuccess(() => useStartVisit(), { branchId: "b-1", visitId: "v-1" });
    expect(visitsApi.startVisit).toHaveBeenCalled();
  });

  it("useBookVisit / useBookMedicalRepVisit", async () => {
    vi.mocked(visitsApi.bookVisit).mockResolvedValue({ id: "v-1" } as never);
    await runSuccess(() => useBookVisit(), { patientId: "p-1" });
    expect(visitsApi.bookVisit).toHaveBeenCalled();

    vi.mocked(visitsApi.bookMedicalRepVisit).mockResolvedValue({ id: "mv-1" } as never);
    await runSuccess(() => useBookMedicalRepVisit(), { repName: "Rep" });
    expect(visitsApi.bookMedicalRepVisit).toHaveBeenCalled();
  });

  it("useUpdateVisit / useUpdateVisitStatus", async () => {
    vi.mocked(visitsApi.updateVisit).mockResolvedValue({} as never);
    await runSuccess(() => useUpdateVisit(), {
      visitId: "v-1",
      body: { reason: "x" },
    });
    expect(visitsApi.updateVisit).toHaveBeenCalledWith({
      visitId: "v-1",
      body: { reason: "x" },
    });

    vi.mocked(visitsApi.updateVisitStatus).mockResolvedValue({} as never);
    await runSuccess(() => useUpdateVisitStatus(), {
      visitId: "v-1",
      status: "COMPLETED" as never,
    });
    expect(visitsApi.updateVisitStatus).toHaveBeenCalledWith({
      visitId: "v-1",
      body: { status: "COMPLETED" },
    });
  });

  it("useUpdateMedRepVisit / useUpdateMedRepVisitStatus (with + without reason)", async () => {
    vi.mocked(medRepApi.updateMedRepVisit).mockResolvedValue({} as never);
    await runSuccess(() => useUpdateMedRepVisit(), {
      visitId: "mv-1",
      body: { notes: "n" },
    });
    expect(medRepApi.updateMedRepVisit).toHaveBeenCalled();

    vi.mocked(medRepApi.updateMedRepVisitStatus).mockResolvedValue({} as never);
    await runSuccess(() => useUpdateMedRepVisitStatus(), {
      visitId: "mv-1",
      status: "CANCELLED" as never,
      reason: "no-show",
    });
    expect(medRepApi.updateMedRepVisitStatus).toHaveBeenCalledWith({
      visitId: "mv-1",
      body: { status: "CANCELLED", reason: "no-show" },
    });

    await runSuccess(() => useUpdateMedRepVisitStatus(), {
      visitId: "mv-1",
      status: "IN_PROGRESS" as never,
    });
    expect(medRepApi.updateMedRepVisitStatus).toHaveBeenLastCalledWith({
      visitId: "mv-1",
      body: { status: "IN_PROGRESS" },
    });
  });
});

describe("usePrescriptionPrint", () => {
  it("returns the print payload on success", async () => {
    vi.mocked(prescriptionsApi.fetchPrescriptionPrint).mockResolvedValue({
      data: { visitId: "v-1", medications: [] },
    } as never);
    const { result } = renderHook(() => usePrescriptionPrint("v-1"), {
      wrapper: wrapperFor(makeClient()),
    });
    await waitFor(() =>
      expect(result.current.print).toEqual({ visitId: "v-1", medications: [] }),
    );
    expect(result.current.isNotFound).toBe(false);
  });

  it("flags a 404 as not-found and suppresses the error", async () => {
    vi.mocked(prescriptionsApi.fetchPrescriptionPrint).mockRejectedValue(
      new ApiError(404, "no meds"),
    );
    const { result } = renderHook(() => usePrescriptionPrint("v-1"), {
      wrapper: wrapperFor(makeClient()),
    });
    await waitFor(() => expect(result.current.isNotFound).toBe(true));
    expect(result.current.error).toBeNull();
    expect(result.current.print).toBeNull();
  });

  it("surfaces a non-404 error", async () => {
    vi.mocked(prescriptionsApi.fetchPrescriptionPrint).mockRejectedValue(
      new ApiError(500, "boom"),
    );
    const { result } = renderHook(() => usePrescriptionPrint("v-1"), {
      wrapper: wrapperFor(makeClient()),
    });
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.isNotFound).toBe(false);
  });

  it("is disabled without a visit id", () => {
    const { result } = renderHook(() => usePrescriptionPrint(undefined), {
      wrapper: wrapperFor(makeClient()),
    });
    expect(result.current.print).toBeNull();
    expect(prescriptionsApi.fetchPrescriptionPrint).not.toHaveBeenCalled();
  });
});
