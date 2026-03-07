/**
 * Features — Bento grid layout inspired by Linear/Supabase.
 * Two hero features spanning full width, then a 3-col grid.
 */

const HERO_FEATURES = [
  {
    icon: "🔐",
    title: "Auth that just works",
    description:
      "Devise + JWT with refresh token rotation. Google OAuth pre-wired. Protected routes on both Rails and React. Session management, email verification, password reset — all included.",
    code: `# One command to scaffold\nrails generate devise User\n\n# React hook — done\nconst { user, signOut } = useAuth();`,
  },
  {
    icon: "💳",
    title: "Stripe payments, wired",
    description:
      "Subscriptions, one-time payments, and customer portal. Webhook handlers, pricing page component, and checkout flow. Add your Stripe keys and start charging.",
    code: `# Checkout in 3 lines\nPOST /api/checkout\n{ price_id: "price_xxx" }\n→ { url: "https://checkout.stripe.com/..." }`,
  },
];

const GRID_FEATURES = [
  {
    icon: "⚡",
    title: "Vite + HMR",
    description: "Sub-second hot reload. API proxy configured. TypeScript strict. No webpack.",
  },
  {
    icon: "🐳",
    title: "Docker + CI/CD",
    description: "Production Dockerfiles, docker-compose, GitHub Actions. Ship to any cloud.",
  },
  {
    icon: "🧪",
    title: "Tests included",
    description: "RSpec for API, Vitest for React. Factory Bot, fixtures, CI-ready scripts.",
  },
  {
    icon: "📱",
    title: "Mobile-first UI",
    description: "TailwindCSS v4 with responsive components. Dark mode. Accessible by default.",
  },
  {
    icon: "🗃️",
    title: "PostgreSQL",
    description: "Production-grade with sensible defaults. Seeds, migrations, and schema included.",
  },
  {
    icon: "📝",
    title: "API docs",
    description: "Auto-generated with request/response examples. Swagger UI for easy testing.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-[13px] font-medium text-indigo-400 tracking-wide uppercase mb-3">
            What's included
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Everything you need to ship
          </h2>
          <p className="mt-4 text-zinc-400 text-[17px] max-w-xl mx-auto">
            Not a starter template. A production-ready foundation with the boring&nbsp;stuff already&nbsp;built.
          </p>
        </div>

        {/* Hero features — 2-col */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {HERO_FEATURES.map((f, i) => (
            <div
              key={i}
              className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 hover:border-white/[0.1] transition-all overflow-hidden"
            >
              {/* Subtle gradient on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-indigo-600/[0.03] to-transparent pointer-events-none" />

              <div className="relative">
                <span className="text-2xl block mb-4">{f.icon}</span>
                <h3 className="text-[18px] font-semibold text-white mb-2 tracking-tight">
                  {f.title}
                </h3>
                <p className="text-[14px] text-zinc-400 leading-relaxed mb-5">
                  {f.description}
                </p>
                <pre className="rounded-lg bg-black/30 border border-white/[0.04] p-4 overflow-x-auto">
                  <code className="text-[12px] font-mono text-zinc-400 leading-relaxed whitespace-pre">
                    {f.code}
                  </code>
                </pre>
              </div>
            </div>
          ))}
        </div>

        {/* Grid features — 3-col */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GRID_FEATURES.map((f, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 hover:border-white/[0.1] transition-all"
            >
              <span className="text-xl block mb-3">{f.icon}</span>
              <h3 className="text-[15px] font-semibold text-white mb-1.5 group-hover:text-indigo-400 transition-colors">
                {f.title}
              </h3>
              <p className="text-[13px] text-zinc-500 leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
