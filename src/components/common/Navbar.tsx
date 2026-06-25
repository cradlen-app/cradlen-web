"use client";

import Image from "next/image";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import {
  getActiveProfile,
  getProfilePrimaryRole,
} from "@/features/auth/lib/current-user";
import { cn } from "@/common/utils/utils";
import { useDashboardPath } from "@/hooks/useDashboardPath";
import Logo from "@/public/Logo.png";
import LogoIcon from "@/public/Logo-icon.png";
import { NotificationDropdown } from "@/features/notifications/components/NotificationDropdown";
import { InvestigationReviewDrawer } from "@/features/investigations/components/InvestigationReviewDrawer";
import { Link } from "@/i18n/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { canUseSettings } from "./sidebar-access";
import { useLogout } from "./hooks/useLogout";

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

// Only used by the (currently hidden) Messages icon. Restore alongside it.
// function IconButton({
//   label,
//   badge,
//   children,
// }: {
//   label: string;
//   badge?: boolean;
//   children: React.ReactNode;
// }) {
//   return (
//     <button
//       type="button"
//       aria-label={label}
//       className="relative size-9 flex items-center justify-center rounded-full text-gray-400 hover:text-brand-primary hover:bg-brand-primary/8 transition-all duration-150"
//     >
//       {children}
//       {badge && (
//         <span className="absolute top-1.5 inset-e-1.5 size-2 rounded-full bg-brand-primary ring-2 ring-white" />
//       )}
//     </button>
//   );
// }

export function Navbar() {
  const tRoles = useTranslations("settings.roles");
  const tNav = useTranslations("nav");
  const { data: user } = useCurrentUser();
  const { handleLogout } = useLogout();
  const dashboardPath = useDashboardPath();

  const profile = getActiveProfile(user);
  const displayName = user ? `${user.first_name} ${user.last_name}` : "—";
  const jobFunctionName = profile?.job_function?.name;
  const primaryRole = getProfilePrimaryRole(profile);
  const roleLabel =
    primaryRole && primaryRole !== "unknown" ? tRoles(primaryRole) : "";
  const subLabel = profile?.job_title || jobFunctionName || roleLabel;

  return (
    <header className="relative h-16 flex items-center justify-between gap-3 px-6 border-b border-gray-100 shrink-0 ">
      {/* Logo — start-aligned at every size (left in LTR, right in RTL) */}
      <Link
        href="/"
        aria-label="Cradlen home"
        className="static w-30 shrink-0 inline-flex"
      >
        <Image src={Logo} alt="CRADLEN" className="w-auto" />
      </Link>

      {/* Global doctor-side investigation review drawer (opened from notifications) */}
      <InvestigationReviewDrawer />

      {/* Right section — notification bell + messages on the end; avatar/name
          show on desktop only. */}
      <div className="flex items-center gap-1">
        {/* Notification */}
        <NotificationDropdown />

        {/* Messages — hidden until the messaging feature is built:
        <IconButton label="Messages">
          <Mail className="size-5" />
        </IconButton> */}

        <div className="hidden lg:block w-px h-5 bg-gray-200 mx-1.5" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={tNav("account")}
              className="group hidden lg:flex items-center gap-2.5 h-10 ps-1 pe-3 rounded-full border border-transparent hover:bg-brand-primary/8 transition-colors duration-150"
            >
              <UserAvatar
                name={displayName}
                avatarUrl={profile?.profile_image_url ?? undefined}
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
              <ChevronDown className="size-4 shrink-0 text-gray-400 transition-transform duration-150 group-data-[state=open]:rotate-180" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={10}
            className="w-72 p-0 overflow-hidden rounded-2xl shadow-xl shadow-black/5"
          >
            {/* Account header */}
            <div className="flex items-center gap-3 px-4 py-4 bg-gradient-to-br from-brand-primary/10 via-brand-secondary/5 to-transparent border-b border-gray-100">
              <UserAvatar
                name={displayName}
                avatarUrl={profile?.profile_image_url ?? undefined}
                className="size-12"
              />
              <div className="flex flex-col min-w-0 leading-tight">
                <span className="text-[15px] font-semibold text-brand-black truncate">
                  {displayName}
                </span>
                {user?.email && (
                  <span className="text-xs text-gray-400 truncate mt-0.5">
                    {user.email}
                  </span>
                )}
                {subLabel && (
                  <span className="mt-1.5 inline-flex w-fit items-center rounded-full bg-brand-primary/10 px-2 py-0.5 text-[10px] font-medium text-brand-primary">
                    {subLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="p-2">
              {canUseSettings(profile) && (
                <>
                  <DropdownMenuItem
                    asChild
                    className="gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium text-gray-600 focus:text-brand-primary"
                  >
                    <Link
                      href={
                        dashboardPath(
                          "/settings",
                        ) as Parameters<typeof Link>[0]["href"]
                      }
                    >
                      <Settings className="size-4.5 text-gray-400" />
                      {tNav("settings")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1.5" />
                </>
              )}
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => void handleLogout()}
                className="gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer text-sm font-medium"
              >
                <LogOut className="size-4.5" />
                {tNav("logout")}
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
