'use client';

import { LanguageProvider } from '@/features/portfolio/portfolio-language';
import { PortfolioNav } from '@/features/portfolio/nav';
import { Hero } from '@/features/portfolio/hero';
import { Problem } from '@/features/portfolio/problem';
import { TargetUsers } from '@/features/portfolio/target-users';
import { ProductValue } from '@/features/portfolio/product-value';
import { CoreFeatures } from '@/features/portfolio/core-features';
import { Screenshots } from '@/features/portfolio/screenshots';
import { HowItWorks } from '@/features/portfolio/how-it-works';
import { MvpScope } from '@/features/portfolio/mvp-scope';
import { TechnicalArchitecture } from '@/features/portfolio/technical-architecture';
import { AiPipeline } from '@/features/portfolio/ai-pipeline';
import { DatabaseApi } from '@/features/portfolio/database-api';
import { EngineeringDecisions } from '@/features/portfolio/engineering-decisions';
import { DemoCta } from '@/features/portfolio/demo-cta';
import { GithubInfo } from '@/features/portfolio/github-info';
import { PortfolioFooter } from '@/features/portfolio/footer';

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
