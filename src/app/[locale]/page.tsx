import { setRequestLocale } from "next-intl/server";
import { RedirectIfAuthenticated } from "@/features/auth/components/RedirectIfAuthenticated";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import Hero from "@/components/marketing/Hero";
import WhyJourneys from "@/components/marketing/WhyJourneys";
import WhatsInside from "@/components/marketing/WhatsInside";
// import Testimonial from "@/components/marketing/Testimonial";
import PatientPortal from "@/components/marketing/PatientPortal";
import HowItWorks from "@/components/marketing/HowItWorks";
import Pricing from "@/components/marketing/Pricing";
import FinalCta from "@/components/marketing/FinalCta";
import MarketingFooter from "@/components/marketing/MarketingFooter";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-[#F4F3EC] text-brand-black">
      <RedirectIfAuthenticated />
      <MarketingHeader />
      <main>
        <Hero />
        <WhyJourneys />
        <WhatsInside />
        {/* <Testimonial /> — temporarily hidden */}
        <PatientPortal />
        <HowItWorks />
        <Pricing />
        <FinalCta />
      </main>
      <MarketingFooter />
    </div>
  );
}
