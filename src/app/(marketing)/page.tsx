import type { Metadata } from 'next';
import { SiteHeader } from '@/components/marketing/site-header';
import { TickerTape } from './ticker-tape';
import { Hero } from '@/components/marketing/hero';
import { FeaturesSection } from '@/components/marketing/features';
import { SocialProofSection } from '@/components/marketing/social-proof';
import { PricingSection } from '@/components/marketing/pricing';
import { FaqSection } from '@/components/marketing/faq';
import { FinalCta } from '@/components/marketing/final-cta';
import { SiteFooter } from '@/components/marketing/site-footer';

export const metadata: Metadata = {
  title: 'True Market Signal — Deterministic trading signals with full trade plans',
  description:
    'A multi-method confluence engine scoring 18 instruments across stocks, crypto, forex, commodities, indices and ETFs. Every signal ships with entry, TP1–TP3, stop loss and position size.',
  openGraph: {
    title: 'True Market Signal — Signals you can actually execute',
    description:
      'Twelve methods, one deterministic score, and a trade plan written before the alert lands. Start free.',
    type: 'website',
  },
};

export default function MarketingPage() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-foreground"
      >
        Skip to content
      </a>
      <SiteHeader />
      <TickerTape />
      <main id="main">
        <Hero />
        <FeaturesSection />
        <SocialProofSection />
        <PricingSection />
        <FaqSection />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
