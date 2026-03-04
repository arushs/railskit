/**
 * Problem/Solution — Agitate the pain, then present the cure.
 *
 * Copywriting tips:
 * - Left side: make them FEEL the pain. Use specific, relatable frustrations.
 * - Right side: mirror each pain point with a concrete solution.
 * - "Before/After" framing is incredibly persuasive.
 * - Keep each bullet to one line — scannable > readable.
 */

const PAIN_POINTS = [
  { icon: "⏰", text: "2 weeks wiring auth, payments, and deploy before writing a line of product code" },
  { icon: "🔧", text: "Gluing together 15 different tutorials that each assume a different setup" },
  { icon: "🤯", text: "Fighting CORS, proxy configs, and TypeScript mismatches between frontend and API" },
  { icon: "💸", text: "Paying $200+/month for a SaaS boilerplate that locks you into their stack" },
];

const SOLUTIONS = [
  { icon: "⚡", text: "Run bin/setup → full-stack app with auth, billing, and CI in under 2 minutes" },
  { icon: "📦", text: "One cohesive monorepo. Rails 8 API + React 19 + Vite. All pre-wired." },
  { icon: "✅", text: "Proxy, CORS, types, and env configs already handled. It just works." },
  { icon: "🆓", text: "Open source, MIT licensed. Fork it, own it, never pay rent on your stack." },
];

export default function ProblemSolution() {
  return (
    <section className="py-20 sm:py-28 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Sound familiar?
          </h2>
          <p className="mt-4 text-zinc-400 text-lg max-w-2xl mx-auto">
            Every Rails + React project starts with the same yak-shaving.
            We did it once so you never have to again.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
          {/* Pain */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-red-400 mb-2">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              Without RailsKit
            </div>
            <div className="space-y-3">
              {PAIN_POINTS.map((p, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10"
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">{p.icon}</span>
                  <p className="text-zinc-300 text-sm leading-relaxed">{p.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Solution */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-green-400 mb-2">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              With RailsKit
            </div>
            <div className="space-y-3">
              {SOLUTIONS.map((s, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-xl bg-green-500/5 border border-green-500/10"
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">{s.icon}</span>
                  <p className="text-zinc-300 text-sm leading-relaxed">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
