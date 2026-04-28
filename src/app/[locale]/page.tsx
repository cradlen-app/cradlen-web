import Image from "next/image";
import {
  CalendarDays,
  ClipboardList,
  HeartPulse,
  UsersRound,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import Footer from "@/components/common/Footer";
import { Link } from "@/i18n/navigation";
import LogoIcon from "@/public/Logo-icon.png";
import Logo from "@/public/Logo.png";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <div className="min-h-screen bg-white text-brand-black">
      <header className="flex items-center justify-between px-6 py-5 sm:px-8 lg:px-10">
        <Link href="/" aria-label="Cradlen home" className="inline-flex">
          <Image
            src={Logo}
            alt="CRADLEN"
            height={34}
            priority
            className="h-8 w-auto sm:h-9"
          />
        </Link>

        <Button
          asChild
          className="h-10 rounded-full bg-brand-primary px-7 text-sm text-white hover:bg-brand-primary/90"
        >
          <Link href="/sign-in">{t("signIn")}</Link>
        </Button>
      </header>

      <main className="px-6 pb-5 sm:px-8 lg:px-10">
        <section className="relative flex min-h-[calc(100vh-168px)] flex-col overflow-hidden rounded-[28px] bg-brand-secondary px-7 py-9 sm:px-10 lg:px-14">
          <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-9 text-center">
            <div className="inline-flex items-center gap-3 text-base text-white sm:text-lg">
              <span>{t("eyebrowStart")}</span>
              <span className="grid size-11 place-items-center rounded-full bg-brand-primary">
                <Image
                  src={LogoIcon}
                  alt=""
                  width={34}
                  height={34}
                  className="size-8"
                />
              </span>
              <span>{t("eyebrowEnd")}</span>
            </div>

            <div className="space-y-5">
              <h1 className="mx-auto max-w-3xl text-3xl font-medium leading-tight text-brand-black sm:text-4xl lg:text-5xl">
                {t("title")}
              </h1>
              <p className="mx-auto max-w-2xl text-base leading-7 text-white sm:text-lg">
                {t("description")}
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <Button
                asChild
                className="h-11 min-w-48 rounded-full bg-brand-primary px-8 text-sm text-white hover:bg-brand-primary/90"
              >
                <Link href="/sign-up">{t("joinFree")}</Link>
              </Button>
            </div>
          </div>

          <div className="mt-10 grid gap-4 text-white lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="space-y-4 text-sm leading-6 sm:text-base">
              <p>{t("sameStory")}</p>
              <p>{t("workflow")}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-lg bg-white/18 px-4 py-3 backdrop-blur">
                <CalendarDays className="size-5 text-brand-primary" />
                <span className="text-sm font-medium">{t("timeline")}</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-white/18 px-4 py-3 backdrop-blur">
                <UsersRound className="size-5 text-brand-primary" />
                <span className="text-sm font-medium">{t("roles")}</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-white/18 px-4 py-3 backdrop-blur">
                <ClipboardList className="size-5 text-brand-primary" />
                <span className="text-sm font-medium">{t("records")}</span>
              </div>
            </div>
          </div>

          <HeartPulse className="pointer-events-none absolute -bottom-8 -inset-e-6 size-36 text-white/15 sm:size-44" />
        </section>
      </main>
      <Footer />
    </div>
  );
}
