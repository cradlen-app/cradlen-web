import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { renderWithIntl } from "@/test/render";
import { ApiError } from "@/infrastructure/http/api";
import type { CurrentUser, UserProfile } from "@/common/types/user.types";
import { BranchForm, OrganizationForm, ProfileForm } from "./settings-forms";
import type { DrawerKey } from "./settings.types";
import type { OrganizationBranch } from "../lib/settings.api";
import {
  createBranch,
  updateBranch,
  updateOrganization,
  updateProfile,
} from "../lib/settings.api";
import { useSpecialtiesLookup } from "../hooks/useSettingsLookups";

vi.mock("../lib/settings.api", () => ({
  createBranch: vi.fn(),
  updateBranch: vi.fn(),
  updateOrganization: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock("../hooks/useSettingsLookups", () => ({
  useSpecialtiesLookup: vi.fn(),
}));

vi.mock("@/infrastructure/query/queryClient", () => ({
  queryClient: { invalidateQueries: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

// DrawerActions wraps its submit button in a radix Dialog.Close, which needs a
// Dialog context we do not mount here. Swap it for a plain passthrough.
vi.mock("./settings-ui", () => ({
  DrawerActions: ({
    cancelLabel,
    children,
  }: {
    cancelLabel: string;
    children: React.ReactNode;
  }) => (
    <div>
      <button type="button">{cancelLabel}</button>
      {children}
    </div>
  ),
}));

function makeUser(): CurrentUser {
  return {
    id: "user-1",
    first_name: "Mona",
    last_name: "Amin",
    email: "mona@example.com",
    phone_number: "+201000000000",
  } as CurrentUser;
}

function makeProfile(): UserProfile {
  return {
    staff_id: "staff-1",
    role: "owner",
    organization: { id: "org-1", name: "Cradlen Clinic", specialties: [] },
    branches: [],
    job_function: null,
  } as unknown as UserProfile;
}

function ProfileFormHarness(props: { onDone?: () => void }) {
  const t = useTranslations("settings");
  return (
    <ProfileForm
      activeDrawer={"profile" as DrawerKey}
      cancelLabel="Cancel"
      onDone={props.onDone ?? (() => {})}
      profile={makeProfile()}
      t={t}
      user={makeUser()}
    />
  );
}

function OrganizationFormHarness(props: { onDone?: () => void }) {
  const t = useTranslations("settings");
  return (
    <OrganizationForm
      activeDrawer={"organizationEdit" as DrawerKey}
      cancelLabel="Cancel"
      onDone={props.onDone ?? (() => {})}
      profile={makeProfile()}
      t={t}
      user={makeUser()}
    />
  );
}

function BranchFormHarness(props: {
  activeDrawer: DrawerKey;
  branches?: OrganizationBranch[];
  branchId?: string;
  onDone?: () => void;
}) {
  const t = useTranslations("settings");
  return (
    <BranchForm
      activeDrawer={props.activeDrawer}
      branches={props.branches}
      branchId={props.branchId}
      cancelLabel="Cancel"
      onDone={props.onDone ?? (() => {})}
      profile={makeProfile()}
      t={t}
      user={makeUser()}
    />
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useSpecialtiesLookup).mockReturnValue({
    data: { data: [{ code: "OBGYN", name: "OB-GYN" }] },
    isLoading: false,
  } as unknown as ReturnType<typeof useSpecialtiesLookup>);
});

describe("ProfileForm", () => {
  it("submits only the changed fields and toasts success", async () => {
    vi.mocked(updateProfile).mockResolvedValue(undefined as never);

    renderWithIntl(<ProfileFormHarness />);

    fireEvent.change(screen.getByLabelText(/First name/i), {
      target: { value: "Mariam" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save profile/i }));

    await waitFor(() =>
      expect(updateProfile).toHaveBeenCalledWith(
        "staff-1",
        expect.objectContaining({ first_name: "Mariam" }),
      ),
    );
    expect(toast.success).toHaveBeenCalledWith("Profile updated.");
  });

  it("skips the API call and just closes when nothing changed", async () => {
    const onDone = vi.fn();
    renderWithIntl(<ProfileFormHarness onDone={onDone} />);

    fireEvent.click(screen.getByRole("button", { name: /Save profile/i }));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it("shows the validation toast on a 400 from the backend", async () => {
    vi.mocked(updateProfile).mockRejectedValue(new ApiError(400, "bad"));

    renderWithIntl(<ProfileFormHarness />);

    fireEvent.change(screen.getByLabelText(/Last name/i), {
      target: { value: "Hassan" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save profile/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Some values were rejected by the server. Please review and try again.",
      ),
    );
  });
});

describe("OrganizationForm", () => {
  it("submits the renamed organization and toasts success", async () => {
    vi.mocked(updateOrganization).mockResolvedValue(undefined as never);

    renderWithIntl(<OrganizationFormHarness />);

    fireEvent.change(screen.getByLabelText(/Organization name/i), {
      target: { value: "New Clinic" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save organization/i }));

    await waitFor(() =>
      expect(updateOrganization).toHaveBeenCalledWith(
        "org-1",
        expect.objectContaining({ name: "New Clinic" }),
      ),
    );
    expect(toast.success).toHaveBeenCalledWith("Organization updated.");
  });

  it("shows the error toast when the update fails", async () => {
    vi.mocked(updateOrganization).mockRejectedValue(new Error("boom"));

    renderWithIntl(<OrganizationFormHarness />);

    fireEvent.change(screen.getByLabelText(/Organization name/i), {
      target: { value: "Another Name" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save organization/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to update organization. Please try again.",
      ),
    );
  });
});

describe("BranchForm", () => {
  it("creates a new branch from the required fields", async () => {
    vi.mocked(createBranch).mockResolvedValue(undefined as never);

    renderWithIntl(<BranchFormHarness activeDrawer={"branchCreate" as DrawerKey} />);

    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: "Maadi" },
    });
    fireEvent.change(screen.getByLabelText(/^City/i), {
      target: { value: "Cairo" },
    });
    fireEvent.change(screen.getByLabelText(/Governorate/i), {
      target: { value: "Cairo" },
    });
    fireEvent.change(screen.getByLabelText(/Address/i), {
      target: { value: "10 Road 9" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Add branch/i }));

    await waitFor(() =>
      expect(createBranch).toHaveBeenCalledWith(
        "org-1",
        expect.objectContaining({
          name: "Maadi",
          city: "Cairo",
          governorate: "Cairo",
          address: "10 Road 9",
        }),
      ),
    );
    expect(toast.success).toHaveBeenCalledWith("Branch created.");
  });

  it("renders the only-main hint when editing the sole main branch", () => {
    const branches: OrganizationBranch[] = [
      {
        id: "b1",
        name: "Main",
        address: "1 St",
        city: "Cairo",
        governorate: "Cairo",
        country: "Egypt",
        is_main: true,
      } as OrganizationBranch,
    ];

    renderWithIntl(
      <BranchFormHarness
        activeDrawer={"branchEdit" as DrawerKey}
        branches={branches}
        branchId="b1"
      />,
    );

    expect(
      screen.getByText(
        /This is your only main branch. Promote another branch first/i,
      ),
    ).toBeInTheDocument();
  });

  it("updates the changed branch fields when editing", async () => {
    vi.mocked(updateBranch).mockResolvedValue(undefined as never);
    const branches: OrganizationBranch[] = [
      {
        id: "b1",
        name: "Main",
        address: "1 St",
        city: "Cairo",
        governorate: "Cairo",
        country: "Egypt",
        is_main: true,
      } as OrganizationBranch,
      {
        id: "b2",
        name: "Maadi",
        address: "2 St",
        city: "Cairo",
        governorate: "Cairo",
        country: "Egypt",
        is_main: false,
      } as OrganizationBranch,
    ];

    renderWithIntl(
      <BranchFormHarness
        activeDrawer={"branchEdit" as DrawerKey}
        branches={branches}
        branchId="b2"
      />,
    );

    fireEvent.change(screen.getByLabelText(/Address/i), {
      target: { value: "99 New St" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Save branch/i }));

    await waitFor(() =>
      expect(updateBranch).toHaveBeenCalledWith(
        "org-1",
        "b2",
        expect.objectContaining({ address: "99 New St" }),
      ),
    );
    expect(toast.success).toHaveBeenCalledWith("Branch updated.");
  });
});
