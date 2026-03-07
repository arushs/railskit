const PAIN = [
  "2 weeks wiring auth, payments, and deploy before writing product code",
  "Gluing together 15 tutorials that each assume a different setup",
  "Fighting CORS, proxy configs, and TypeScript mismatches",
  "Paying $200+/month for a SaaS boilerplate that locks you in",
];

const CURE = [
  "bin/setup → full-stack app with auth, billing, and CI in 2 minutes",
  "One monorepo. Rails 8 API + React 19 + Vite. All pre-wired.",
  "Proxy, CORS, types, and env configs already handled",
  "Open source, MIT licensed. Fork it, own it, never pay rent",
];

export default function ProblemSolution() {
  return (
    <section className="py-24 sm:py-32 border-t border-white/[0.04]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Sound familiar?
          </h2>
          <p className="mt-4 text-zinc-400 text-[17px] max-w-lg mx-auto">
            Every Rails + React project starts with the same yak-shaving.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-10 max-w-4xl mx-auto">
          {/* Without */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <span className="text-[13px] font-medium text-red-400 tracking-wide">
                Without RailsKit
              </span>
            </div>
            <div className="space-y-2.5">
              {PAIN.map((p, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-xl border border-red-500/[0.08] bg-red-500/[0.03]"
                >
                  <svg className="w-4 h-4 text-red-400/60 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  <p className="text-[13px] text-zinc-400 leading-relaxed">{p}</p>
                </div>
              ))}
            </div>
          </div>

          {/* With */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[13px] font-medium text-emerald-400 tracking-wide">
                With RailsKit
              </span>
            </div>
            <div className="space-y-2.5">
              {CURE.map((s, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-xl border border-emerald-500/[0.08] bg-emerald-500/[0.03]"
                >
                  <svg className="w-4 h-4 text-emerald-400/60 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <p className="text-[13px] text-zinc-400 leading-relaxed">{s}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
