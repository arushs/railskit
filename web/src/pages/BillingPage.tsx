import { useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, ExternalLink } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: string;
  interval: string;
  features: string[];
  highlighted?: boolean;
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    interval: "forever",
    features: ["1 project", "100 API requests/day", "Community support"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    interval: "month",
    features: [
      "Unlimited projects",
      "10K API requests/day",
      "Priority support",
      "Custom domain",
      "Analytics dashboard",
    ],
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$99",
    interval: "month",
    features: [
      "Everything in Pro",
      "Unlimited API requests",
      "Dedicated support",
      "SSO / SAML",
      "SLA guarantee",
      "Custom integrations",
    ],
  },
];

export default function BillingPage() {
  const [currentPlan] = useState("pro");
  const [portalLoading, setPortalLoading] = useState(false);

  async function openCustomerPortal() {
    setPortalLoading(true);
    try {
      const { data, ok } = await api.post<{ url: string }>("/api/billing/portal", {});
      if (ok && data.url) {
        window.location.href = data.url;
      }
    } finally {
      setPortalLoading(false);
    }
  }

  async function handlePlanChange(planId: string) {
    if (planId === currentPlan) return;
    const { data, ok } = await api.post<{ url?: string }>("/api/billing/checkout", {
      plan: planId,
    });
    if (ok && data.url) {
      window.location.href = data.url;
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Billing</h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          Manage your subscription and billing details.
        </p>
      </div>

      <Card className="dark:bg-zinc-900/50 bg-white">
        <CardHeader className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-zinc-900 dark:text-white">Current Plan</CardTitle>
              <CardDescription className="text-zinc-500 dark:text-zinc-400">
                You are currently on the{" "}
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {plans.find((p) => p.id === currentPlan)?.name}
                </span>{" "}
                plan.
              </CardDescription>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <Button variant="secondary" size="sm" onClick={openCustomerPortal} disabled={portalLoading}>
            <ExternalLink className="mr-2 h-4 w-4" />
            {portalLoading ? "Loading\u2026" : "Manage in Stripe"}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
          Available Plans
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            return (
              <Card
                key={plan.id}
                className={`relative dark:bg-zinc-900/50 bg-white ${
                  plan.highlighted
                    ? "ring-2 ring-indigo-500 dark:ring-indigo-400"
                    : ""
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge>Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="p-6">
                  <CardTitle className="text-zinc-900 dark:text-white">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-zinc-900 dark:text-white">
                      {plan.price}
                    </span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      /{plan.interval}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0 space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                        <Check className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={isCurrent ? "secondary" : "default"}
                    size="sm"
                    className="w-full"
                    disabled={isCurrent}
                    onClick={() => handlePlanChange(plan.id)}
                  >
                    {isCurrent ? "Current Plan" : `Upgrade to ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
