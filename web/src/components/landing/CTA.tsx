export default function CTA() {
  return (
    <section className="py-24 sm:py-32 relative overflow-hidden border-t border-white/[0.04]">
      {/* Gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-indigo-600/[0.06] blur-[120px]" />
      </div>

      <div className="relative max-w-2xl mx-auto px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Your next project starts here
        </h2>
        <p className="mt-4 text-zinc-400 text-[17px]">
          One command. Full-stack Rails + React. Production-ready in minutes.
        </p>

        {/* Code snippet */}
        <div className="mt-8 inline-flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-5 py-3 font-mono text-[13px]">
          <span className="text-zinc-600">$</span>
          <span className="text-emerald-400">git clone</span>
          <span className="text-zinc-300">railskit</span>
          <span className="text-zinc-600">&&</span>
          <span className="text-emerald-400">bin/setup</span>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="#pricing"
            className="w-full sm:w-auto px-8 py-3 text-[14px] font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
          >
            Get Started — Free
          </a>
          <a
            href="/docs"
            className="w-full sm:w-auto px-8 py-3 text-[14px] font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Read the docs →
          </a>
        </div>
      </div>
    </section>
  );
}
