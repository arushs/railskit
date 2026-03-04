/**
 * Features — Show what's in the box.
 *
 * Copywriting tips:
 * - Lead each feature with the BENEFIT, not the technology.
 *   "Deploy in 60 seconds" > "Docker + GitHub Actions included"
 * - Icons should be instantly recognizable — emoji works great for dev tools.
 * - 6-8 features max. More = noise. Less = incomplete.
 * - Group related features visually if you have 8+.
 */

const FEATURES = [
  {
    icon: "🔐",
    title: "Auth, done right",
    description: "Devise + JWT tokens with refresh rotation. Google OAuth pre-wired. Protected routes on both sides.",
  },
  {
    icon: "💳",
    title: "Stripe payments",
    description: "Subscriptions, webhooks, and customer portal. Pricing page included. Just add your Stripe keys.",
  },
  {
    icon: "🐳",
    title: "Docker + deploy configs",
    description: "Production Dockerfiles, docker-compose for local dev, and CI/CD with GitHub Actions. Ship to any cloud.",
  },
  {
    icon: "⚡",
    title: "Vite + hot reload",
    description: "Sub-second HMR for React. API proxy configured. TypeScript strict mode. No webpack, no tears.",
  },
  {
    icon: "🧪",
    title: "Test suite included",
    description: "RSpec for the API, Vitest for the frontend. Factory Bot, fixtures, and CI-ready test scripts.",
  },
  {
    icon: "📱",
    title: "Mobile-first UI",
    description: "TailwindCSS v4 with responsive components. Dark mode. Accessible. Looks great on every screen.",
  },
  {
    icon: "🗃️",
    title: "PostgreSQL + migrations",
    description: "Production-grade database with sensible defaults. Seeds, schema, and migration patterns included.",
  },
  {
    icon: "📝",
    title: "API documentation",
    description: "Auto-generated API docs with request/response examples. Swagger UI included for easy testing.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20 sm:py-28 bg-zinc-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Everything you need to ship
          </h2>
          <p className="mt-4 text-zinc-400 text-lg max-w-2xl mx-auto">
            Not a starter template. A production-ready foundation with the boring stuff already built.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="group p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-indigo-500/30 transition-all hover:shadow-lg hover:shadow-indigo-500/5"
            >
              <span className="text-3xl block mb-4">{f.icon}</span>
              <h3 className="text-base font-semibold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                {f.title}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
