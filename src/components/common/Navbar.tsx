"use client";

import Image from "next/image";
import { Mail, Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import {
  getActiveProfile,
  getProfilePrimaryRole,
} from "@/features/auth/lib/current-user";
import { cn } from "@/common/utils/utils";
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
  const tRoles = useTranslations("common.roles");
  const { openMobile } = useSidebar();
  const { data: user } = useCurrentUser();

  const profile = getActiveProfile(user);
  const displayName = user ? `${user.first_name} ${user.last_name}` : "—";
  const jobFunctionName = profile?.job_functions?.[0]?.name;
  const primaryRole = getProfilePrimaryRole(profile);
  const roleLabel =
    primaryRole && primaryRole !== "unknown" ? tRoles(primaryRole) : "";
  const subLabel = profile?.job_title || jobFunctionName || roleLabel;

  return (
    <header className="relative h-16 flex items-center justify-between gap-3 px-6 border-b border-gray-100 shrink-0 ">
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
        className="absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0 w-30 shrink-0 inline-flex"
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

      {/* Right section */}
      <div className="flex items-center gap-1">
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
        </div>
      </div>
    </header>
  );
}
