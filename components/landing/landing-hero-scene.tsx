import { DashboardPreviewMock, HeroPhoneMockup, HeroWhatsAppBanner } from "@/components/landing/mockups";
import { HeroSocialIcons } from "@/components/landing/social-3d-icons";

function LuminousOrbits() {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 z-[5] -translate-x-1/2 -translate-y-1/2 lg:left-[44%]"
      aria-hidden
    >
      <svg
        className="h-[min(75vw,520px)] w-[min(75vw,520px)] lg:h-[600px] lg:w-[600px]"
        viewBox="0 0 600 600"
        fill="none"
      >
        <defs>
          <filter id="heroOrbitGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <ellipse
          cx="300"
          cy="300"
          rx="240"
          ry="155"
          stroke="#7c3aed"
          strokeWidth="1.5"
          filter="url(#heroOrbitGlow)"
          opacity="0.38"
          transform="rotate(-14 300 300)"
        />
        <ellipse
          cx="300"
          cy="300"
          rx="210"
          ry="132"
          stroke="#7c3aed"
          strokeWidth="1.2"
          filter="url(#heroOrbitGlow)"
          opacity="0.3"
          transform="rotate(22 300 300)"
        />
        <ellipse
          cx="300"
          cy="300"
          rx="175"
          ry="108"
          stroke="#7c3aed"
          strokeWidth="1"
          filter="url(#heroOrbitGlow)"
          opacity="0.24"
          transform="rotate(-36 300 300)"
        />
      </svg>
    </div>
  );
}

function DashboardLayer() {
  return (
    <div
      className="pointer-events-none absolute hidden lg:block"
      style={{
        right: "-2%",
        top: "8%",
        zIndex: 10,
        width: "580px",
        transform: "perspective(1400px) rotateY(-5deg)",
        transformOrigin: "center right",
      }}
    >
      <DashboardPreviewMock variant="hero" />
    </div>
  );
}

export function LandingHeroScene() {
  return (
    <div className="relative mx-auto min-h-[440px] w-full max-w-full overflow-visible sm:min-h-[500px] lg:mx-0 lg:min-h-[680px] lg:h-[680px]">
      <DashboardLayer />
      <LuminousOrbits />

      <HeroWhatsAppBanner className="pointer-events-none absolute right-[-6%] top-[5%] z-40 hidden translate-x-16 rotate-[3deg] lg:block" />
      <HeroWhatsAppBanner className="pointer-events-none absolute right-1 top-0 z-40 rotate-[3deg] scale-90 lg:hidden" />

      <div className="absolute left-1/2 top-1/2 z-[40] -translate-x-1/2 -translate-y-1/2 lg:left-[42%]">
        <div className="relative">
          <HeroSocialIcons />
          <HeroPhoneMockup />
        </div>
      </div>
    </div>
  );
}
