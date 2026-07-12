import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { getCurrentUser } from "@/features/auth/lib/getCurrentUser.server";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string; orgId: string; branchId: string }>;
};

// Belt-and-braces over the robots.txt disallow: every tenant dashboard route is
// private, so emit `noindex, nofollow` even if a URL leaks into a crawl.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardGroupLayout({
  children,
  params,
}: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const initialUser = await getCurrentUser();

  return <DashboardLayout initialUser={initialUser}>{children}</DashboardLayout>;
}
