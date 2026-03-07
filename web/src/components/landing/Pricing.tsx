import { useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface Tier {
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  monthlyPriceId: string;
  annualPriceId: string;
  features: string[];
  cta: string;
  highlighted: boolean;
}

const TIERS: Tier[] = [
  {
    name: "Starter",
    description: "Solo devs & side projects",
    monthlyPrice: 0,
    annualPrice: 0,
    monthlyPriceId: "",
    annualPriceId: "",
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
    description: "Devs who ship fast",
    monthlyPrice: 49,
    annualPrice: 39,
    monthlyPriceId: "price_pro_monthly",
    annualPriceId: "price_pro_annual",
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
    description: "Teams building products",
    monthlyPrice: 149,
    annualPrice: 119,
    monthlyPriceId: "price_team_monthly",
    annualPriceId: "price_team_annual",
    features: [
      "Everything in Pro",
      "Multi-tenant teams",
      "Role-based access",
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
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  async function handleCheckout(tier: Tier) {
    if (tier.monthlyPrice === 0) {
      window.location.href = "/auth/sign-up";
      return;
    }
    const priceId = annual ? tier.annualPriceId : tier.monthlyPriceId;
    if (!priceId) return;
    setLoadingTier(tier.name);
    try {
      const { data, ok } = await api.post<{ url: string }>("/api/checkout", {
        price_id: priceId,
      });
      if (ok && data.url) window.location.href = data.url;
      else window.location.href = "/auth/sign-in?redirect=/pricing";
    } catch {
      window.location.href = "/auth/sign-in?redirect=/pricing";
    } finally {
      setLoadingTier(null);
    }
  }

  return (
    <section id="pricing" className="py-24 sm:py-32 border-t border-white/[0.04]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-[13px] font-medium text-indigo-400 tracking-wide uppercase mb-3">
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-zinc-400 text-[17px] max-w-lg mx-auto">
            Start free. Upgrade when you need premium features.
          </p>

          {/* Toggle */}
          <div className="mt-8 inline-flex items-center rounded-full border border-white/[0.06] bg-white/[0.02] p-0.5">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 text-[13px] font-medium rounded-full transition-all ${
                !annual
                  ? "bg-white/10 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 text-[13px] font-medium rounded-full transition-all ${
                annual
                  ? "bg-white/10 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Annual
              <span className="ml-1.5 text-[11px] text-emerald-400 font-semibold">
                −20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {TIERS.map((tier) => {
            const price = annual ? tier.annualPrice : tier.monthlyPrice;
            const isLoading = loadingTier === tier.name;

            return (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-2xl border p-7 transition-all ${
                  tier.highlighted
                    ? "border-indigo-500/30 bg-indigo-500/[0.04] shadow-lg shadow-indigo-500/10"
                    : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]"
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-indigo-600 text-white text-[11px] font-semibold rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-[16px] font-semibold text-white">
                    {tier.name}
                  </h3>
                  <p className="text-[13px] text-zinc-500 mt-0.5">
                    {tier.description}
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white tracking-tight">
                      {price === 0 ? "Free" : `$${price}`}
                    </span>
                    {price > 0 && (
                      <span className="text-[13px] text-zinc-500">/mo</span>
                    )}
                  </div>
                  {price > 0 && annual && (
                    <p className="mt-1 text-[11px] text-zinc-600">
                      Billed ${price * 12}/year
                    </p>
                  )}
                </div>

                <ul className="space-y-2.5 flex-1 mb-7">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[13px]">
                      <svg
                        className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      <span className="text-zinc-400">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCheckout(tier)}
                  disabled={isLoading}
                  className={`w-full py-2.5 text-[13px] font-medium rounded-xl transition-all ${
                    tier.highlighted
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                      : "bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 border border-white/[0.06]"
                  } disabled:opacity-50`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Redirecting…
                    </span>
                  ) : (
                    tier.cta
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
