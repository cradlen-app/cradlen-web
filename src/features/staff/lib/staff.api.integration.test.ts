import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiAuthFetch, apiFetch } from "@/lib/api";
import {
  acceptStaffInvite,
  deactivateStaff,
  deleteStaffInvitation,
  fetchStaff,
  fetchStaffInvitation,
  fetchStaffMember,
  fetchStaffInvitations,
  resendStaffInvitation,
  updateStaff,
} from "./staff.api";

vi.mock("@/lib/api", () => ({
  apiAuthFetch: vi.fn(),
  apiFetch: vi.fn(),
}));

describe("staff api helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiAuthFetch).mockResolvedValue({ data: [], meta: {} });
    vi.mocked(apiFetch).mockResolvedValue({ data: {} });
  });

  it("sends authenticated staff list requests through organization-scoped paths", async () => {
    await fetchStaff("org-1", {
      page: 2,
      limit: 25,
      q: "cardio",
      roleId: "role-1",
    });

    expect(apiAuthFetch).toHaveBeenCalledWith(
      "/organizations/org-1/staff?page=2&limit=25&q=cardio&role_id=role-1",
    );
  });

  it("omits all-status invitation filters and uses organization-scoped path", async () => {
    await fetchStaffInvitations({
      organizationId: "org-1",
      status: "all",
    });

    expect(apiAuthFetch).toHaveBeenCalledWith(
      "/organizations/org-1/invitations?page=1&limit=100",
    );
  });

  it("calls staff detail and management endpoints", async () => {
    const scope = { organizationId: "org-1", branchId: "branch-1" };

    await fetchStaffMember("staff-1", scope);
    await updateStaff(
      "staff-1",
      {
        first_name: "Mona",
        last_name: "Amin",
        phone_number: "+201000000000",
      },
      scope,
    );
    await deactivateStaff("staff-1", scope);

    expect(apiAuthFetch).toHaveBeenNthCalledWith(
      1,
      "/staff/staff-1?organization_id=org-1&branch_id=branch-1",
    );
    expect(apiAuthFetch).toHaveBeenNthCalledWith(
      2,
      "/organizations/org-1/staff/staff-1",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(apiAuthFetch).toHaveBeenNthCalledWith(
      3,
      "/organizations/org-1/staff/staff-1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("calls organization-scoped invitation detail, delete, and resend endpoints", async () => {
    await fetchStaffInvitation("org-1", "invite-1");
    await deleteStaffInvitation("org-1", "invite-1");
    await resendStaffInvitation("org-1", "invite-1");

    expect(apiAuthFetch).toHaveBeenNthCalledWith(
      1,
      "/organizations/org-1/invitations/invite-1",
    );
    expect(apiAuthFetch).toHaveBeenNthCalledWith(
      2,
      "/organizations/org-1/invitations/invite-1",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(apiAuthFetch).toHaveBeenNthCalledWith(
      3,
      "/organizations/org-1/invitations/invite-1/resend",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("routes accept invitation through the local cookie-setting handler", async () => {
    await acceptStaffInvite({
      invitation_id: "invite-1",
      token: "token-1",
      password: "password123",
    });

    expect(apiFetch).toHaveBeenCalledWith(
      "/staff/invite/accept",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
