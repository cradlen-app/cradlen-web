"use client";

import Image from "next/image";
import { Search, Upload, Mail, Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useSelectProfile } from "@/features/auth/hooks/useSelectProfile";
import {
  getActiveProfile,
  getDefaultBranch,
  getProfileOrganization,
  getProfileOrganizationId,
  getProfileId,
  getProfilePrimaryRole,
} from "@/features/auth/lib/current-user";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { queryClient } from "@/lib/queryClient";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/layout/SidebarContext";
import Logo from "@/public/Logo.png";
import LogoIcon from "@/public/Logo-icon.png";
import { NotificationDropdown } from "@/features/notifications/components/NotificationDropdown";
import { Link } from "@/i18n/navigation";

function UserAvatar({
  name,
  avatarUrl,
  className,
}: {
  name: string;
  avatarUrl?: string;
  className?: string;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        className={cn(
          "rounded-full object-cover shrink-0 ring-2 ring-white shadow-sm",
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full overflow-hidden shrink-0 ring-2 ring-white shadow-sm",
        className,
      )}
    >
      <Image src={LogoIcon} alt={name} className="w-full h-full object-cover" />
    </div>
  );
}

function IconButton({
  label,
  badge,
  children,
}: {
  label: string;
  badge?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="relative size-9 flex items-center justify-center rounded-full text-gray-400 hover:text-brand-primary hover:bg-brand-primary/8 transition-all duration-150"
    >
      {children}
      {badge && (
        <span className="absolute top-1.5 inset-e-1.5 size-2 rounded-full bg-brand-primary ring-2 ring-white" />
      )}
    </button>
  );
}

export function Navbar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const { openMobile } = useSidebar();
  const { data: user } = useCurrentUser();
  const selectProfile = useSelectProfile();
  const setContext = useAuthContextStore((state) => state.setContext);
  const branchId = useAuthContextStore((state) => state.branchId);

  const profile = getActiveProfile(user);
  const displayName = user ? `${user.first_name} ${user.last_name}` : "—";
  const activeBranch = getDefaultBranch(profile, branchId);
  const subLabel = profile?.job_title || getProfilePrimaryRole(profile) || "";

  async function handleProfileChange(profileId: string) {
    const nextProfile = user?.profiles.find(
      (item) => getProfileId(item) === profileId,
    );
    const organizationId = getProfileOrganizationId(nextProfile);
    const branch = getDefaultBranch(nextProfile);

    if (!nextProfile || !organizationId) return;

    try {
      const response = await selectProfile.mutateAsync({
        branch_id: branch?.id ?? null,
        profile_id: profileId,
      });
      const newOrgId = response.data.organization_id || organizationId;
      const newBranchId = response.data.branch_id ?? branch?.id ?? null;
      setContext({
        organizationId: newOrgId,
        branchId: newBranchId,
        profileId: response.data.profile_id || profileId,
      });
      queryClient.clear();
      // Keep the user on the same dashboard section in the new org/branch context.
      // pathname is locale-stripped: /oldOrgId/oldBranchId/dashboard/calendar
      const dashboardSegment = pathname.split("/").slice(3).join("/");
      router.replace(`/${newOrgId}/${newBranchId ?? ""}/${dashboardSegment}`);
    } catch {
      toast.error(t("profileSwitcher"));
    }
  }

  return (
    <header className="h-16 flex items-center justify-between gap-3 px-6 border-b border-gray-100 shrink-0 ">
      {/* Hamburger — mobile only */}
      <button
        type="button"
        onClick={openMobile}
        aria-label={t("openMenu")}
        className="size-9 flex items-center justify-center rounded-full text-gray-400 hover:text-brand-primary hover:bg-brand-primary/8 transition-all duration-150 lg:hidden shrink-0"
      >
        <Menu className="size-5" />
      </button>

      {/* Logo — icon on mobile, full logo on desktop */}
      <Link
        href="/"
        aria-label="Cradlen home"
        className="w-30 shrink-0 inline-flex"
      >
        {" "}
        <Image
          src={LogoIcon}
          alt="CRADLEN"
          height={30}
          className="w-auto lg:hidden"
        />
        <Image src={Logo} alt="CRADLEN" className="hidden w-auto lg:block" />
      </Link>

      {/* Search */}
      <div className="hidden sm:flex flex-1 min-w-sm max-w-md relative ms-2">
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          className="w-full h-9 text-center rounded-full bg-white border border-gray-200 ps-4 pe-10 text-sm text-brand-black placeholder:text-gray-400 outline-none focus:bg-white focus:border-brand-primary/60 focus:ring-2 focus:ring-brand-primary/12 transition-all duration-200"
        />
        <Search className="absolute inset-e-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1">
        {/* Upload — hidden on small screens */}
        <button
          type="button"
          className="hidden sm:flex items-center gap-1.5 h-9 px-3.5 rounded-full text-sm font-medium text-gray-500 hover:text-brand-primary hover:bg-brand-primary/8 transition-all duration-150"
        >
          <Upload className="size-4" />
          <span>{t("upload")}</span>
        </button>

        <div className="hidden sm:block w-px h-5 bg-gray-200 mx-1.5" />

        {/* Notification */}
        <NotificationDropdown />

        {/* Messages */}
        <IconButton label="Messages">
          <Mail className="size-5" />
        </IconButton>

        <div className="w-px h-5 bg-gray-200 mx-1.5" />

        <div className="flex items-center gap-2.5 h-10 ps-1 pe-3.5 rounded-full border border-transparent">
          <UserAvatar
            name={displayName}
            avatarUrl={undefined}
            className="size-8"
          />
          <div className="hidden sm:flex flex-col items-start leading-none gap-0.5">
            <span className="text-sm text-brand-black group-hover:text-brand-primary transition-colors duration-150 whitespace-nowrap">
              {displayName}
            </span>
            <span
              className={cn(
                "text-[11px] leading-none whitespace-nowrap",
                subLabel ? "text-brand-primary/70" : "text-gray-400",
              )}
            >
              {subLabel}
            </span>
          </div>
          {(user?.profiles.length ?? 0) > 1 && (
            <select
              aria-label={t("profileSwitcher")}
              value={profile ? getProfileId(profile) : ""}
              onChange={(event) => void handleProfileChange(event.target.value)}
              className="max-w-36 rounded-full border border-gray-100 bg-white px-2 py-1 text-xs text-gray-500 outline-none focus:border-brand-primary/60"
            >
              {user?.profiles.map((item) => {
                const organization = getProfileOrganization(item);
                const branch = getDefaultBranch(item);
                return (
                  <option key={getProfileId(item)} value={getProfileId(item)}>
                    {[organization?.name, branch?.city]
                      .filter(Boolean)
                      .join(" / ")}
                  </option>
                );
              })}
            </select>
          )}
        </div>
      </div>
    </header>
  );
}
