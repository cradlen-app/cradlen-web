import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiAuthFetch, apiFetch } from "@/infrastructure/http/api";
import {
  acceptStaffInvite,
  deactivateStaff,
  deleteStaffInvitation,
  fetchStaff,
  fetchStaffInvitation,
  fetchStaffInvitations,
  resendStaffInvitation,
  unassignStaffFromBranch,
  updateStaff,
} from "./staff.api";

vi.mock("@/infrastructure/http/api", () => ({
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
      scope: "mine",
    });

    expect(apiAuthFetch).toHaveBeenCalledWith(
      "/organizations/org-1/staff?page=2&limit=25&q=cardio&role_id=role-1&scope=mine",
    );
  });

  it("does not send a status query param to invitations list", async () => {
    await fetchStaffInvitations({ organizationId: "org-1" });

    expect(apiAuthFetch).toHaveBeenCalledWith(
      "/organizations/org-1/invitations?page=1&limit=100",
    );
  });

  it("calls staff management endpoints with the new payload shape", async () => {
    await updateStaff("org-1", "staff-1", {
      first_name: "Mona",
      last_name: "Amin",
      phone_number: "+201000000000",
      job_function_codes: ["NURSE"],
      specialty_codes: ["OBGYN"],
      executive_title: "COO",
      engagement_type: "FULL_TIME",
      branch_ids: ["branch-1"],
    });
    await deactivateStaff("org-1", "staff-1");
    await unassignStaffFromBranch("org-1", "staff-1", "branch-2");

    expect(apiAuthFetch).toHaveBeenNthCalledWith(
      1,
      "/organizations/org-1/staff/staff-1",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(apiAuthFetch).toHaveBeenNthCalledWith(
      2,
      "/organizations/org-1/staff/staff-1",
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(apiAuthFetch).toHaveBeenNthCalledWith(
      3,
      "/organizations/org-1/staff/staff-1/branches/branch-2",
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
