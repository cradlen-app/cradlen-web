import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiAuthFetch, apiFetch } from "@/infrastructure/http/api";
import {
  acceptStaffInvite,
  createStaffDirect,
  deactivateStaff,
  declineStaffInvite,
  deleteStaffInvitation,
  fetchAllStaff,
  fetchBranchStaffStats,
  fetchJobFunctions,
  fetchRoles,
  fetchSpecialties,
  fetchStaff,
  fetchStaffInvitation,
  fetchStaffInvitations,
  getInvitationPreview,
  inviteStaff,
  removeStaffFromBranch,
  resendStaffInvitation,
  updateStaff,
} from "./staff.api";

vi.mock("@/infrastructure/http/api", () => ({
  apiAuthFetch: vi.fn(),
  apiFetch: vi.fn(),
}));

const mockAuth = vi.mocked(apiAuthFetch);
const mockFetch = vi.mocked(apiFetch);

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ data: [], meta: {} } as never);
  mockFetch.mockResolvedValue({ data: {} } as never);
});

describe("lookups", () => {
  it("fetchRoles unwraps an envelope or returns a raw array", async () => {
    mockAuth.mockResolvedValueOnce({ data: [{ id: "r1" }] } as never);
    expect(await fetchRoles()).toEqual([{ id: "r1" }]);
    expect(mockAuth).toHaveBeenCalledWith("/roles/lookup");

    mockAuth.mockResolvedValueOnce([{ id: "r2" }] as never);
    expect(await fetchRoles()).toEqual([{ id: "r2" }]);
  });

  it("fetchJobFunctions / fetchSpecialties hit their lookup endpoints", async () => {
    mockAuth.mockResolvedValue({ data: [] } as never);
    await fetchJobFunctions();
    expect(mockAuth).toHaveBeenCalledWith("/job-functions/lookup");
    await fetchSpecialties();
    expect(mockAuth).toHaveBeenCalledWith("/specialties");
  });
});

describe("fetchStaff query building", () => {
  it("always includes page/limit and trims search", async () => {
    await fetchStaff("org-1", "b-1", { page: 2, limit: 50, search: "  ali  " });
    expect(mockAuth).toHaveBeenCalledWith(
      "/organizations/org-1/branches/b-1/staff?page=2&limit=50&search=ali",
    );
  });

  it("uses defaults and drops an empty search", async () => {
    await fetchStaff("org-1", "b-1", { search: "   " });
    expect(mockAuth).toHaveBeenCalledWith(
      "/organizations/org-1/branches/b-1/staff?page=1&limit=100",
    );
  });

  it("appends role and status filters", async () => {
    await fetchStaff("org-1", "b-1", { role: "OWNER", status: "inactive" });
    expect(mockAuth).toHaveBeenCalledWith(
      "/organizations/org-1/branches/b-1/staff?page=1&limit=100&role=OWNER&status=inactive",
    );
  });
});

describe("fetchAllStaff pagination", () => {
  it("walks every page and concatenates the results", async () => {
    mockAuth
      .mockResolvedValueOnce({
        data: [{ staff_id: "s-1" }],
        meta: { totalPages: 3 },
      } as never)
      .mockResolvedValueOnce({ data: [{ staff_id: "s-2" }], meta: { totalPages: 3 } } as never)
      .mockResolvedValueOnce({ data: [{ staff_id: "s-3" }], meta: { totalPages: 3 } } as never);

    const all = await fetchAllStaff("org-1", "b-1");
    expect(all.map((s) => s.staff_id)).toEqual(["s-1", "s-2", "s-3"]);
    expect(mockAuth).toHaveBeenCalledTimes(3);
  });

  it("stops after a single page when totalPages is 1", async () => {
    mockAuth.mockResolvedValueOnce({
      data: [{ staff_id: "s-1" }],
      meta: { totalPages: 1 },
    } as never);
    const all = await fetchAllStaff("org-1", "b-1");
    expect(all).toHaveLength(1);
    expect(mockAuth).toHaveBeenCalledTimes(1);
  });
});

describe("stats & writes", () => {
  it("fetchBranchStaffStats hits the stats endpoint", async () => {
    await fetchBranchStaffStats("org-1", "b-1");
    expect(mockAuth).toHaveBeenCalledWith(
      "/organizations/org-1/branches/b-1/staff/stats",
    );
  });

  it("inviteStaff POSTs to the invitations collection", async () => {
    const data = { email: "a@b.com" } as never;
    await inviteStaff("org-1", "b-1", data);
    expect(mockAuth).toHaveBeenCalledWith(
      "/organizations/org-1/branches/b-1/invitations",
      { method: "POST", body: JSON.stringify(data) },
    );
  });

  it("createStaffDirect POSTs to the staff collection", async () => {
    const data = { name: "X" } as never;
    await createStaffDirect("org-1", "b-1", data);
    expect(mockAuth).toHaveBeenCalledWith(
      "/organizations/org-1/branches/b-1/staff",
      { method: "POST", body: JSON.stringify(data) },
    );
  });

  it("updateStaff PATCHes and unwraps the response envelope", async () => {
    mockAuth.mockResolvedValueOnce({ data: { staff_id: "s-1" } } as never);
    const result = await updateStaff("org-1", "b-1", "s-1", { phone: "1" } as never);
    expect(mockAuth).toHaveBeenCalledWith(
      "/organizations/org-1/branches/b-1/staff/s-1",
      { method: "PATCH", body: JSON.stringify({ phone: "1" }) },
    );
    expect(result).toEqual({ staff_id: "s-1" });
  });

  it("updateStaff returns a raw (already-unwrapped) member", async () => {
    mockAuth.mockResolvedValueOnce({ staff_id: "s-2" } as never);
    const result = await updateStaff("org-1", "b-1", "s-2", {} as never);
    expect(result).toEqual({ staff_id: "s-2" });
  });

  it("removeStaffFromBranch DELETEs the staff member", async () => {
    await removeStaffFromBranch("org-1", "b-1", "s-1");
    expect(mockAuth).toHaveBeenCalledWith(
      "/organizations/org-1/branches/b-1/staff/s-1",
      { method: "DELETE" },
    );
  });

  it("deactivateStaff POSTs to the deactivate sub-path", async () => {
    await deactivateStaff("org-1", "b-1", "s-1");
    expect(mockAuth).toHaveBeenCalledWith(
      "/organizations/org-1/branches/b-1/staff/s-1/deactivate",
      { method: "POST" },
    );
  });
});

describe("invitations", () => {
  it("fetchStaffInvitations builds the paged list URL with defaults", async () => {
    await fetchStaffInvitations({ organizationId: "org-1", branchId: "b-1" });
    expect(mockAuth).toHaveBeenCalledWith(
      "/organizations/org-1/branches/b-1/invitations?page=1&limit=100",
    );
  });

  it("fetchStaffInvitation GETs a single invitation", async () => {
    await fetchStaffInvitation("org-1", "b-1", "inv-1");
    expect(mockAuth).toHaveBeenCalledWith(
      "/organizations/org-1/branches/b-1/invitations/inv-1",
    );
  });

  it("deleteStaffInvitation DELETEs the invitation", async () => {
    await deleteStaffInvitation("org-1", "b-1", "inv-1");
    expect(mockAuth).toHaveBeenCalledWith(
      "/organizations/org-1/branches/b-1/invitations/inv-1",
      { method: "DELETE" },
    );
  });

  it("resendStaffInvitation POSTs to the resend sub-path", async () => {
    await resendStaffInvitation("org-1", "b-1", "inv-1");
    expect(mockAuth).toHaveBeenCalledWith(
      "/organizations/org-1/branches/b-1/invitations/inv-1/resend",
      { method: "POST" },
    );
  });
});

describe("public invite endpoints (apiFetch)", () => {
  it("getInvitationPreview encodes the query params", async () => {
    await getInvitationPreview("inv 1", "tok/en");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/staff/invite/preview?invitation_id=inv%201&token=tok%2Fen",
    );
  });

  it("declineStaffInvite POSTs the id+token", async () => {
    await declineStaffInvite("inv-1", "tok");
    expect(mockFetch).toHaveBeenCalledWith("/staff/invite/decline", {
      method: "POST",
      body: JSON.stringify({ invitation_id: "inv-1", token: "tok" }),
    });
  });

  it("acceptStaffInvite POSTs the accept payload", async () => {
    const data = { invitation_id: "inv-1", token: "tok", password: "pw" } as never;
    await acceptStaffInvite(data);
    expect(mockFetch).toHaveBeenCalledWith("/staff/invite/accept", {
      method: "POST",
      body: JSON.stringify(data),
    });
  });
});
