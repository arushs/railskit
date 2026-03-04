import { useState } from "react";
import { Check } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Pricing — Where visitors become customers.
 *
 * Copywriting tips:
 * - 3 tiers is the sweet spot. Free / Pro / Team.
 * - Highlight the middle tier (most popular) — that's your cash cow.
 * - Annual toggle should show savings prominently ("Save 20%").
 * - Feature lists: lead with what the user GETS, not technical specs.
 * - CTA on each card. Free = "Start free", Paid = "Get started".
 * - "Most popular" badge creates social proof + anchoring.
 */

interface Tier {
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  cta: string;
  highlighted: boolean;
}

const TIERS: Tier[] = [
  {
    name: "Starter",
    description: "For solo devs and side projects",
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      "Full monorepo scaffold",
      "Rails 8 API + React 19",
      "TailwindCSS v4",
      "Docker configs",
      "MIT License",
      "Community support",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Pro",
    description: "For devs who ship fast",
    monthlyPrice: 49,
    annualPrice: 39,
    features: [
      "Everything in Starter",
      "Auth + JWT + OAuth",
      "Stripe subscriptions",
      "Admin dashboard",
      "Email templates",
      "Priority support",
      "Lifetime updates",
    ],
    cta: "Get Pro",
    highlighted: true,
  },
  {
    name: "Team",
    description: "For teams building products",
    monthlyPrice: 149,
    annualPrice: 119,
    features: [
      "Everything in Pro",
      "Multi-tenant architecture",
      "Team management UI",
      "Role-based access control",
      "Audit logging",
      "CI/CD pipeline",
      "Dedicated support",
      "Custom integrations",
    ],
    cta: "Get Team",
    highlighted: false,
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="py-20 sm:py-28 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-zinc-400 text-lg max-w-2xl mx-auto">
            Start free. Upgrade when you need auth, payments, and premium
            features.
          </p>

          {/* Monthly / Annual toggle */}
          <div className="mt-8 inline-flex items-center gap-3 bg-zinc-900 rounded-full p-1 border border-zinc-800">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAnnual(false)}
              className={`rounded-full ${
                !annual
                  ? "bg-indigo-600 text-white hover:bg-indigo-500 hover:text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Monthly
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAnnual(true)}
              className={`rounded-full ${
                annual
                  ? "bg-indigo-600 text-white hover:bg-indigo-500 hover:text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Annual
              <span className="ml-1.5 text-xs text-green-400 font-semibold">
                Save 20%
              </span>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {TIERS.map((tier) => {
            const price = annual ? tier.annualPrice : tier.monthlyPrice;
            return (
              <Card
                key={tier.name}
                className={`relative flex flex-col transition-all ${
                  tier.highlighted
                    ? "bg-zinc-900 border-indigo-500/50 shadow-xl shadow-indigo-500/10 scale-[1.02]"
                    : "hover:border-zinc-700"
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full">
                    Most Popular
                  </div>
                )}

                <CardHeader>
                  <CardTitle>{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-white">
                        {price === 0 ? "Free" : `$${price}`}
                      </span>
                      {price > 0 && (
                        <span className="text-sm text-zinc-500">/month</span>
                      )}
                    </div>
                    {price > 0 && annual && (
                      <p className="mt-1 text-xs text-zinc-500">
                        Billed ${price * 12}/year
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3">
                    {tier.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        <span className="text-zinc-300">{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    variant={tier.highlighted ? "default" : "secondary"}
                    className="w-full"
                    onClick={() =>
                      document
                        .getElementById("pricing")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    {tier.cta}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
