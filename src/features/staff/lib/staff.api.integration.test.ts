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
  previewStaffInvite,
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

  it("sends authenticated staff list requests through the same-origin proxy", async () => {
    await fetchStaff("org-1", {
      branchId: "branch-1",
      page: 2,
      limit: 25,
      q: "cardio",
      roleId: "role-1",
    });

    expect(apiAuthFetch).toHaveBeenCalledWith(
      "/staff?organization_id=org-1&branch_id=branch-1&page=2&limit=25&q=cardio&role_id=role-1",
    );
  });

  it("omits all-status invitation filters", async () => {
    await fetchStaffInvitations({
      organizationId: "org-1",
      branchId: "branch-1",
      status: "all",
    });

    expect(apiAuthFetch).toHaveBeenCalledWith(
      "/staff/invitations?organization_id=org-1&branch_id=branch-1&page=1&limit=100",
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
        phone: "+201000000000",
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
      "/staff/staff-1?organization_id=org-1&branch_id=branch-1",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(apiAuthFetch).toHaveBeenNthCalledWith(
      3,
      "/staff/staff-1?organization_id=org-1&branch_id=branch-1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("calls branch-scoped invitation action endpoints", async () => {
    const scope = { organizationId: "org-1", branchId: "branch-1" };

    await fetchStaffInvitation("invite-1", scope);
    await deleteStaffInvitation("invite-1", scope);
    await resendStaffInvitation("invite-1", scope);

    expect(apiAuthFetch).toHaveBeenNthCalledWith(
      1,
      "/staff/invitations/invite-1?organization_id=org-1&branch_id=branch-1",
    );
    expect(apiAuthFetch).toHaveBeenNthCalledWith(
      2,
      "/staff/invitations/invite-1?organization_id=org-1&branch_id=branch-1",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(apiAuthFetch).toHaveBeenNthCalledWith(
      3,
      "/staff/invitations/invite-1/resend?organization_id=org-1&branch_id=branch-1",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("keeps public invite flows on token-issuing local endpoints", async () => {
    await previewStaffInvite("token-1", "invite-1");
    await acceptStaffInvite({
      invitation_id: "invite-1",
      token: "token-1",
      password: "password123",
    });

    expect(apiFetch).toHaveBeenNthCalledWith(
      1,
      "/staff/invite/preview?token=token-1&invite=invite-1",
    );
    expect(apiFetch).toHaveBeenNthCalledWith(
      2,
      "/staff/invite/accept",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
