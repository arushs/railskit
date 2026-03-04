/**
 * Testimonials — Social proof that converts.
 *
 * Copywriting tips:
 * - Real names + photos > anonymous quotes. Always.
 * - Specific outcomes > vague praise. "Shipped in 3 days" > "Great product!"
 * - Include role/company for credibility.
 * - 3-4 testimonials is the sweet spot. More feels fake.
 * - Mix developer + founder voices — different buyer personas.
 *
 * TODO: Replace placeholder testimonials with real ones from beta users.
 */

const TESTIMONIALS = [
  {
    quote: "I went from zero to deployed SaaS in a weekend. The auth + Stripe integration alone saved me 2 weeks.",
    name: "Sarah Chen",
    role: "Indie Developer",
    avatar: "SC",
  },
  {
    quote: "We evaluated 5 Rails boilerplates. RailsKit was the only one that didn't fight us on React integration. The monorepo setup is chef's kiss.",
    name: "Marcus Rivera",
    role: "CTO, LaunchPad",
    avatar: "MR",
  },
  {
    quote: "Finally, a Rails + React template that doesn't feel like duct tape. The Docker configs and CI pipeline work out of the box.",
    name: "Alex Petrov",
    role: "Senior Engineer",
    avatar: "AP",
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 sm:py-28 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Loved by developers
          </h2>
          <p className="mt-4 text-zinc-400 text-lg max-w-2xl mx-auto">
            Join hundreds of developers who ship faster with RailsKit.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <svg key={j} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <p className="text-sm text-zinc-300 leading-relaxed mb-6 italic">
                "{t.quote}"
              </p>

              <div className="flex items-center gap-3">
                {/* Avatar placeholder — replace with real images */}
                <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs font-semibold text-indigo-400">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{t.name}</p>
                  <p className="text-xs text-zinc-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
