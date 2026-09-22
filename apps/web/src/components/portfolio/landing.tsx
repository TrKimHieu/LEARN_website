'use client';

import { LanguageProvider } from '@/lib/portfolio-language';
import { PortfolioNav } from '@/components/portfolio/nav';
import { Hero } from '@/components/portfolio/hero';
import { Problem } from '@/components/portfolio/problem';
import { TargetUsers } from '@/components/portfolio/target-users';
import { ProductValue } from '@/components/portfolio/product-value';
import { CoreFeatures } from '@/components/portfolio/core-features';
import { Screenshots } from '@/components/portfolio/screenshots';
import { HowItWorks } from '@/components/portfolio/how-it-works';
import { MvpScope } from '@/components/portfolio/mvp-scope';
import { TechnicalArchitecture } from '@/components/portfolio/technical-architecture';
import { AiPipeline } from '@/components/portfolio/ai-pipeline';
import { DatabaseApi } from '@/components/portfolio/database-api';
import { EngineeringDecisions } from '@/components/portfolio/engineering-decisions';
import { DemoCta } from '@/components/portfolio/demo-cta';
import { GithubInfo } from '@/components/portfolio/github-info';
import { PortfolioFooter } from '@/components/portfolio/footer';

export function Landing() {
  return (
    <LanguageProvider>
      <PortfolioNav />
      <main>
        <Hero />
        <Problem />
        <TargetUsers />
        <ProductValue />
        <CoreFeatures />
        <Screenshots />
        <HowItWorks />
        <MvpScope />
        <TechnicalArchitecture />
        <AiPipeline />
        <DatabaseApi />
        <EngineeringDecisions />
        <DemoCta />
        <GithubInfo />
      </main>
      <PortfolioFooter />
    </LanguageProvider>
  );
}
