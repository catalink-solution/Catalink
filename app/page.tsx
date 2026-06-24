import { FAQ } from "@/components/FAQ";
import { LandingCtaFinal } from "@/components/landing/landing-cta-final";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingAdsTracking } from "@/components/landing/landing-ads-tracking";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingHowItWorks } from "@/components/landing/landing-how-it-works";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingPostHero } from "@/components/landing/landing-post-hero";
import { LandingPricing } from "@/components/landing/landing-pricing";
import { LandingProblem } from "@/components/landing/landing-problem";
import { LandingProductDemo } from "@/components/landing/landing-product-demo";
import { LandingSolution } from "@/components/landing/landing-solution";
import { LandingStickyCta } from "@/components/landing/landing-sticky-cta";

export default function Home() {
  return (
    <>
      <LandingNavbar />
      <main className="overflow-x-clip pb-20 sm:pb-0">
        <LandingHero />
        <LandingPostHero />
        <LandingProductDemo />
        <LandingAdsTracking />
        <LandingProblem />
        <LandingSolution />
        <LandingHowItWorks />
        <LandingFeatures />
        <LandingPricing />
        <FAQ />
        <LandingCtaFinal />
      </main>
      <LandingFooter />
      <LandingStickyCta />
    </>
  );
}
