import { useRef } from 'react';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { ScrollStorySection } from '@/components/landing/ScrollStorySection';
import { FeaturedPGSection } from '@/components/landing/FeaturedPGSection';
import {
  AmenitiesSection,
  HowItWorksSection,
  LandingCTA,
  LandingFooter,
  SecuritySection,
  WhyStayOpsSection,
} from '@/components/landing/LandingSections';
import { useLandingMotion } from '@/hooks/useLandingMotion';
import '@/styles/landing.css';

export default function LandingPage() {
  const root = useRef<HTMLDivElement>(null);
  useLandingMotion(root);
  return (
    <div className="so-landing" ref={root}>
      <a className="so-skip" href="#landing-main">
        Skip to content
      </a>
      <LandingNavbar />
      <main id="landing-main" tabIndex={-1}>
        <HeroSection />
        <ScrollStorySection />
        <WhyStayOpsSection />
        <HowItWorksSection />
        <FeaturedPGSection />
        <AmenitiesSection />
        <SecuritySection />
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
