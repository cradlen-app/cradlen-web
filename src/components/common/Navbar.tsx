"use client";

import Image from "next/image";
import { Search, Upload, Bell, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { cn } from "@/lib/utils";
import Logo from "@/public/Logo.png";
import LogoIcon from "@/public/Logo-icon.png";

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
  const { data: user } = useCurrentUser();

  const profile = user?.profiles?.[0];
  const displayName = user ? `${user.first_name} ${user.last_name}` : "—";
  const subLabel = profile?.job_title || profile?.role.name || "";

  return (
    <header className="h-16 flex items-center justify-between gap-3 px-6 border-b border-gray-100 shrink-0 ">
      {/* Logo */}
      <div className="w-30 shrink-0">
        <Image src={Logo} alt="CRADLEN" height={30} className="w-auto" />
      </div>

      {/* Search */}
      <div className="flex-1 min-w-sm max-w-md relative ms-2">
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          className="w-full h-9 text-center rounded-full bg-white border border-gray-200 ps-4 pe-10 text-sm text-brand-black placeholder:text-gray-400 outline-none focus:bg-white focus:border-brand-primary/60 focus:ring-2 focus:ring-brand-primary/12 transition-all duration-200"
        />
        <Search className="absolute inset-e-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1">
        {/* Upload */}
        <button
          type="button"
          className="flex items-center gap-1.5 h-9 px-3.5 rounded-full text-sm font-medium text-gray-500 hover:text-brand-primary hover:bg-brand-primary/8 transition-all duration-150"
        >
          <Upload className="size-4" />
          <span>{t("upload")}</span>
        </button>

        <div className="w-px h-5 bg-gray-200 mx-1.5" />

        {/* Notification */}
        <IconButton label="Notifications" badge>
          <Bell className="size-5" />
        </IconButton>

        {/* Messages */}
        <IconButton label="Messages">
          <Mail className="size-5" />
        </IconButton>

        <div className="w-px h-5 bg-gray-200 mx-1.5" />

        {/* User chip */}
        <button
          type="button"
          className="flex items-center gap-2.5 h-10 ps-1 pe-3.5 rounded-full hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all duration-150 group"
        >
          <UserAvatar
            name={displayName}
            avatarUrl={undefined}
            className="size-8"
          />
          <div className="flex flex-col items-start leading-none gap-0.5">
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
        </button>
      </div>
    </header>
  );
}
