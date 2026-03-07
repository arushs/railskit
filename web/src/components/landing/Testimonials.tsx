/**
 * Social proof — stats + testimonial cards.
 * TODO: Replace placeholder testimonials with real ones from beta users.
 */

const TESTIMONIALS = [
  {
    quote:
      "Went from zero to deployed SaaS in a weekend. The auth + Stripe integration alone saved me 2 weeks.",
    name: "Sarah Chen",
    role: "Indie Developer",
    initials: "SC",
  },
  {
    quote:
      "We evaluated 5 Rails boilerplates. RailsKit was the only one that didn't fight us on React. The monorepo setup is perfect.",
    name: "Marcus Rivera",
    role: "CTO, LaunchPad",
    initials: "MR",
  },
  {
    quote:
      "Finally, a Rails + React template that doesn't feel like duct tape. Docker and CI work out of the box.",
    name: "Alex Petrov",
    role: "Senior Engineer",
    initials: "AP",
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 sm:py-32 border-t border-white/[0.04]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-[13px] font-medium text-indigo-400 tracking-wide uppercase mb-3">
            Social proof
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Loved by developers
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] transition-all"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, j) => (
                  <svg
                    key={j}
                    className="w-3.5 h-3.5 text-amber-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <p className="text-[13px] text-zinc-400 leading-relaxed mb-6">
                "{t.quote}"
              </p>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[10px] font-semibold text-indigo-400">
                  {t.initials}
                </div>
                <div>
                  <p className="text-[13px] font-medium text-white">
                    {t.name}
                  </p>
                  <p className="text-[11px] text-zinc-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
