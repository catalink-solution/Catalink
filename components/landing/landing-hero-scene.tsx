import { DashboardPreviewMock, HeroPhoneMockup, HeroWhatsAppBanner } from "@/components/landing/mockups";
import { HeroSocialIcons, HeroSocialIconsMobile } from "@/components/landing/social-3d-icons";

function LuminousOrbits() {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 z-[5] -translate-x-1/2 -translate-y-1/2 max-lg:scale-95 max-lg:opacity-80 lg:left-[44%] lg:scale-100 lg:opacity-100"
      aria-hidden
    >
      <svg
        className="h-[min(68vw,380px)] w-[min(68vw,380px)] sm:h-[min(72vw,440px)] sm:w-[min(72vw,440px)] lg:h-[600px] lg:w-[600px]"
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
    <>
      <div
        className="pointer-events-none absolute z-[6] block opacity-[0.55] shadow-[0_0_32px_rgba(99,102,241,0.16)] lg:hidden"
        style={{
          left: "50%",
          top: "0%",
          width: "min(285px, 74vw)",
          transform: "perspective(1200px) rotateY(-9deg) scale(0.63)",
          transformOrigin: "top left",
        }}
      >
        <DashboardPreviewMock variant="hero" />
      </div>
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
    </>
  );
}

export function LandingHeroScene() {
  return (
    <div className="relative mx-auto flex min-h-[288px] w-full max-w-full items-center justify-center overflow-x-hidden py-0 sm:min-h-[310px] lg:block lg:min-h-[680px] lg:h-[680px] lg:overflow-visible lg:py-0">
      <DashboardLayer />
      <LuminousOrbits />

      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-[8] h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/15 blur-3xl max-lg:block lg:hidden"
        aria-hidden
      />

      <HeroWhatsAppBanner className="pointer-events-none absolute right-[-6%] top-[5%] z-40 hidden translate-x-16 rotate-[3deg] lg:block" />
      <HeroWhatsAppBanner className="pointer-events-none absolute right-0 top-[20%] z-[42] !w-[140px] rotate-[2deg] sm:right-[0.5%] sm:top-[18%] sm:!w-[155px] lg:hidden [&_img]:opacity-100 [&_img]:drop-shadow-[0_8px_28px_rgba(34,197,94,0.55)]" />

      <div className="relative z-[40] max-lg:mx-auto max-lg:translate-x-[-4px] lg:absolute lg:left-[42%] lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2">
        <div className="relative flex max-w-[min(100%,360px)] items-center justify-center gap-0.5 sm:max-w-none sm:gap-1 lg:block">
          <HeroSocialIconsMobile />
          <div className="relative z-[30] origin-center scale-[0.95] max-lg:[&_.z-20]:!translate-x-0 sm:scale-[0.97] lg:scale-100">
            <HeroSocialIcons />
            <HeroPhoneMockup />
          </div>
        </div>
      </div>
    </div>
  );
}
