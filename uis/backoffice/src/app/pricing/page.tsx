import { BackofficeHero } from "@/src/components/backoffice-hero";
import { PricingCalculator } from "@/src/components/pricing-calculator";

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <BackofficeHero />
      <div className="mt-8">
        <PricingCalculator />
      </div>
    </div>
  );
}