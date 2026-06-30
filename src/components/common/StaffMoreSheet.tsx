"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  Globe,
  LifeBuoy,
  Loader2,
  LogOut,
  MapPin,
  Plus,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/common/utils/utils";
import { BUILD_INFO, shortCommit } from "@/infrastructure/config/build-info";
import type { Locale } from "@/i18n/routing";
import { Link, usePathname } from "@/i18n/navigation";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import {
  getActiveProfile,
  getProfileOrganization,
  getProfilePrimaryRole,
  getBranchId,
} from "@/features/auth/lib/current-user";
import { useDashboardPath } from "@/hooks/useDashboardPath";
import LogoIcon from "@/public/Logo-icon.png";
import { canUseSettings } from "./sidebar-access";
import { useStaffNavItems, STAFF_PRIMARY_TAB_PATHS } from "./staff-nav";
import { useSidebarBranchSwitch } from "./hooks/useSidebarBranchSwitch";
import { useLogout } from "./hooks/useLogout";
import LanguageSelect from "./LanguageSelect";

export function StaffMoreSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("nav");
  const tRoles = useTranslations("settings.roles");
  const tFooter = useTranslations("auth.signUp");
  const tu = useTranslations("appUpdate");
  const tRoot = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const dashboardPath = useDashboardPath();

  const { data: user } = useCurrentUser();
  const profile = getActiveProfile(user);

  const displayName = user ? `${user.first_name} ${user.last_name}` : "—";
  const jobFunctionName = profile?.job_function?.name;
  const primaryRole = getProfilePrimaryRole(profile);
  const roleLabel =
    primaryRole && primaryRole !== "unknown" ? tRoles(primaryRole) : "";
  const subLabel = profile?.job_title || jobFunctionName || roleLabel;

  const {
    switchingToBranchId,
    isSwitching,
    branch,
    branchId,
    activeProfileId,
    groups,
    hasMultipleProfiles,
    handleSelect,
  } = useSidebarBranchSwitch(profile);

  const { handleLogout } = useLogout();

  const navItems = useStaffNavItems();
  const overflowItems = navItems.filter(
    (item) =>
      !(STAFF_PRIMARY_TAB_PATHS as readonly string[]).includes(item.path),
  );

  const organization = getProfileOrganization(profile);
  const clinicName = organization?.name ?? "—";
  const clinicBranch = branch?.city
    ? t("branchLabel", { city: branch.city })
    : "—";

  const [orgOpen, setOrgOpen] = useState(false);

  // Tear the overlay down once navigation has actually changed the route.
  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-white duration-200 animate-in fade-in-0 slide-in-from-bottom-4 motion-reduce:animate-none lg:hidden">
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-100 px-5">
        <span className="text-base font-semibold text-brand-black">
          {t("account")}
        </span>
        <button
          type="button"
          aria-label={t("closeMenu")}
          onClick={onClose}
          className="flex size-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-brand-primary"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Account */}
        <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
          <div className="size-11 shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-sm">
            {profile?.profile_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.profile_image_url}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <Image
                src={LogoIcon}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-brand-black">
              {displayName}
            </span>
            {subLabel && (
              <span className="block truncate text-xs text-brand-primary/70">
                {subLabel}
              </span>
            )}
          </span>
        </div>

        {/* Organization — collapsible branch / workspace switcher */}
        <div className="border-b border-gray-100 px-3 py-3">
          <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">
            {t("organization")}
          </p>

          <button
            type="button"
            onClick={() => setOrgOpen((o) => !o)}
            disabled={isSwitching}
            aria-haspopup="menu"
            aria-expanded={orgOpen}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition-colors hover:bg-gray-50"
          >
              <div className="size-9 shrink-0 overflow-hidden rounded-full">
                {organization?.logo_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={organization.logo_image_url}
                    alt={clinicName}
                    width={36}
                    height={36}
                    className="size-9 object-cover"
                  />
                ) : (
                  <Image
                    src={LogoIcon}
                    alt={clinicName}
                    width={36}
                    height={36}
                    className="object-cover"
                  />
                )}
              </div>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-brand-black">
                  {clinicName}
                </span>
                <span className="block truncate text-xs text-gray-400">
                  {clinicBranch}
                </span>
              </span>
              {isSwitching ? (
                <Loader2 className="size-4 shrink-0 animate-spin text-gray-400" />
              ) : (
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-gray-400 transition-transform duration-150",
                    orgOpen && "rotate-180",
                  )}
                />
              )}
            </button>

          {orgOpen && (
            <div className="mt-1 space-y-1 duration-150 animate-in fade-in-0 slide-in-from-top-1 motion-reduce:animate-none">
              {groups.map((group, groupIndex) => (
                <div key={group.profileId}>
                  {hasMultipleProfiles && (
                    <div
                      className={cn(
                        "px-3 pt-1.5 pb-1",
                        groupIndex > 0 && "border-t border-gray-100 mt-1",
                      )}
                    >
                      <span className="block truncate text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        {group.organizationName}
                      </span>
                    </div>
                  )}
                  <div className="space-y-0.5 px-1">
                    {group.branches.map((b) => {
                      const bId = getBranchId(b) ?? b.id;
                      const activeBranchId = branchId ?? getBranchId(branch);
                      const isActive =
                        group.profileId === activeProfileId &&
                        bId === activeBranchId;
                      const isLoading =
                        isSwitching && switchingToBranchId === bId;
                      const hasName = Boolean(b.name);
                      const hasCity = Boolean(b.city);
                      const label = hasName ? b.name! : b.city || "—";
                      const sublabel =
                        hasName && hasCity && b.name !== b.city
                          ? `(${b.city})`
                          : null;
                      return (
                        <button
                          key={`${group.profileId}-${bId}`}
                          type="button"
                          disabled={isSwitching}
                          onClick={() => void handleSelect(group.profileId, bId)}
                          className={cn(
                            "flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-start transition-colors",
                            isActive
                              ? "bg-brand-primary/10 text-brand-primary"
                              : "text-gray-600 hover:bg-gray-50",
                            isSwitching &&
                              !isLoading &&
                              "cursor-not-allowed opacity-40",
                          )}
                        >
                          <MapPin
                            className={cn(
                              "mt-0.5 size-3.5 shrink-0",
                              isActive ? "text-brand-primary" : "text-gray-400",
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-[13px] font-medium leading-tight">
                                {label}
                              </span>
                              {b.is_main && (
                                <span className="shrink-0 rounded-full bg-brand-secondary/20 px-1.5 py-0.5 text-[10px] font-medium leading-none text-brand-secondary">
                                  main
                                </span>
                              )}
                            </div>
                            {sublabel && (
                              <span className="mt-0.5 block truncate text-[11px] leading-tight text-gray-400">
                                {sublabel}
                              </span>
                            )}
                          </div>
                          {isLoading ? (
                            <Loader2 className="mt-0.5 size-3.5 shrink-0 animate-spin text-brand-primary" />
                          ) : isActive ? (
                            <Check className="mt-0.5 size-3.5 shrink-0 text-brand-primary" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {/* Create organization */}
              <div className="mt-1 border-t border-gray-100 pt-1">
                <Link
                  href="/create-organization"
                  onClick={onClose}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-start text-[13px] font-medium text-brand-primary transition-colors hover:bg-brand-primary/10"
                >
                  <Plus className="size-3.5 shrink-0" />
                  <span className="truncate">{t("createOrganization")}</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Secondary nav (items not in the bottom bar) */}
        {overflowItems.length > 0 && (
          <nav className="px-3 py-3">
            {overflowItems.map((item) => {
              const href = dashboardPath(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={href as Parameters<typeof Link>[0]["href"]}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                >
                  <Icon className="size-5 shrink-0 text-gray-400" />
                  <span className="flex-1 truncate">
                    {tRoot(item.key as Parameters<typeof tRoot>[0])}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-gray-300 rtl:scale-x-[-1]" />
                </Link>
              );
            })}
          </nav>
        )}

        {/* Settings */}
        {canUseSettings(profile) && (
          <div className="border-t border-gray-100 px-3 py-3">
            <Link
              href={
                dashboardPath("/settings") as Parameters<typeof Link>[0]["href"]
              }
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              <Settings className="size-5 shrink-0 text-gray-400" />
              <span className="flex-1 truncate">{t("settings")}</span>
              <ChevronRight className="size-4 shrink-0 text-gray-300 rtl:scale-x-[-1]" />
            </Link>
          </div>
        )}

        {/* Legal / Help / Language */}
        <div className="border-t border-gray-100 px-3 py-3">
          <Link
            href="/terms-of-service"
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            <FileText className="size-5 shrink-0 text-gray-400" />
            <span className="flex-1 truncate">{tFooter("termsOfService")}</span>
            <ChevronRight className="size-4 shrink-0 text-gray-300 rtl:scale-x-[-1]" />
          </Link>
          <Link
            href="/privacy-policy"
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            <ShieldCheck className="size-5 shrink-0 text-gray-400" />
            <span className="flex-1 truncate">{tFooter("privacyPolicy")}</span>
            <ChevronRight className="size-4 shrink-0 text-gray-300 rtl:scale-x-[-1]" />
          </Link>
          <Link
            href="/help-center"
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            <LifeBuoy className="size-5 shrink-0 text-gray-400" />
            <span className="flex-1 truncate">{tFooter("helpCenter")}</span>
            <ChevronRight className="size-4 shrink-0 text-gray-300 rtl:scale-x-[-1]" />
          </Link>
          <div className="flex items-center gap-3 px-3 py-3">
            <Globe className="size-5 shrink-0 text-gray-400" />
            <span className="flex-1 truncate text-sm font-medium text-gray-600">
              {t("language")}
            </span>
            <LanguageSelect currentLocale={locale as Locale} />
          </div>
        </div>

        {/* Logout */}
        <div className="border-t border-gray-100 px-3 py-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              void handleLogout();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-start text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut className="size-5 shrink-0" />
            {t("logout")}
          </button>
        </div>

        {/* Copyright + build version */}
        <div className="border-t border-gray-100 px-5 py-4 text-center text-xs text-gray-400">
          <p>© {tFooter("copyright")}</p>
          <p
            className="mt-1"
            title={
              shortCommit
                ? `${tu("versionLabel")} v${BUILD_INFO.version} · ${shortCommit}`
                : `${tu("versionLabel")} v${BUILD_INFO.version}`
            }
          >
            {tu("versionLabel")} v{BUILD_INFO.version}
          </p>
        </div>
      </div>
    </div>
  );
}
