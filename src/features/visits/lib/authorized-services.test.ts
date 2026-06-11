import { describe, expect, it } from "vitest";
import type {
  ProviderServiceAuthorization,
  Service,
} from "@/core/financial/api";
import { filterAuthorizedServices } from "./authorized-services";

const BRANCH = "branch-1";

function auth(
  over: Partial<ProviderServiceAuthorization>,
): ProviderServiceAuthorization {
  return {
    id: `auth-${Math.random()}`,
    profile_id: "doc-1",
    service_id: "svc-1",
    organization_id: "org-1",
    branch_id: BRANCH,
    duration_minutes: null,
    is_active: true,
    service: { id: "svc-1", name: "Consultation", code: "C", service_type: "CONSULTATION" },
    created_at: "",
    updated_at: "",
    ...over,
  };
}

function service(over: Partial<Service> & { id: string; name: string }): Service {
  return {
    organization_id: "org-1",
    code: "C",
    description: null,
    service_type: "CONSULTATION",
    is_active: true,
    specialty_ids: [],
    created_at: "",
    updated_at: "",
    ...over,
  } as Service;
}

describe("filterAuthorizedServices", () => {
  it("includes active authorizations scoped to the branch", () => {
    const result = filterAuthorizedServices(
      [auth({ service_id: "svc-1" })],
      [],
      BRANCH,
    );
    expect(result).toEqual([{ id: "svc-1", name: "Consultation" }]);
  });

  it("includes active org-wide authorizations (branch_id null)", () => {
    const result = filterAuthorizedServices(
      [auth({ service_id: "svc-2", branch_id: null })],
      [],
      BRANCH,
    );
    expect(result).toEqual([{ id: "svc-2", name: "Consultation" }]);
  });

  it("excludes inactive authorizations", () => {
    const result = filterAuthorizedServices(
      [auth({ is_active: false })],
      [],
      BRANCH,
    );
    expect(result).toEqual([]);
  });

  it("excludes authorizations scoped to a different branch", () => {
    const result = filterAuthorizedServices(
      [auth({ branch_id: "other-branch" })],
      [],
      BRANCH,
    );
    expect(result).toEqual([]);
  });

  it("dedupes a service authorized both branch-scoped and org-wide", () => {
    const result = filterAuthorizedServices(
      [
        auth({ service_id: "svc-1", branch_id: BRANCH }),
        auth({ service_id: "svc-1", branch_id: null }),
      ],
      [],
      BRANCH,
    );
    expect(result).toEqual([{ id: "svc-1", name: "Consultation" }]);
  });

  it("falls back to the catalog name, then the id, when the embedded service is absent", () => {
    const result = filterAuthorizedServices(
      [
        auth({ service_id: "svc-2", service: null }),
        auth({ service_id: "svc-3", service: null }),
      ],
      [service({ id: "svc-2", name: "X-Ray" })],
      BRANCH,
    );
    expect(result).toEqual([
      { id: "svc-2", name: "X-Ray" },
      { id: "svc-3", name: "svc-3" },
    ]);
  });
});
